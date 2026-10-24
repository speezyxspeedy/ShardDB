"""
Workflow DAG Execution Engine for NodeFlow.
Handles graph validation, trigger verification, cycle detection, topological sorting,
branching/condition routing, data passing, step-by-step logging, and timeout protection.
"""

from collections import defaultdict, deque
from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional, Set, Tuple

from .nodes.registry import (
    execute_node,
    get_node_definition,
    SUPPORTED_OPERATORS,
    VALID_TEXT_OPERATIONS,
    MAX_SAFE_DELAY_SECONDS
)


def utc_now_str() -> str:
    return datetime.now(timezone.utc).isoformat()


class WorkflowValidationError(Exception):
    def __init__(self, message: str, errors: Optional[List[Dict[str, Any]]] = None):
        super().__init__(message)
        self.errors = errors or []


class WorkflowEngine:
    def __init__(self):
        pass

    def validate_workflow(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validates workflow graph:
        - Check for valid node structure and non-empty graph
        - Verify valid trigger exists
        - Detect cycles (DAG requirement)
        - Validate edge references
        - Validate node configuration constraints
        """
        errors = []
        warnings = []

        if not nodes:
            errors.append({"type": "error", "message": "Workflow contains no nodes."})
            return {
                "valid": False,
                "errors": errors,
                "warnings": warnings,
                "node_count": 0,
                "edge_count": 0
            }

        node_ids = set()
        has_trigger = False

        for node in nodes:
            nid = node.get("id")
            if not nid:
                errors.append({"type": "error", "message": "A node is missing an 'id' attribute."})
                continue
            elif nid in node_ids:
                errors.append({"node_id": nid, "type": "error", "message": f"Duplicate node ID detected: '{nid}'."})
            else:
                node_ids.add(nid)

            ntype = node.get("type", "")
            ndata = node.get("data", {})

            # Check if this node is a trigger
            if ntype in ("manual_trigger", "webhook_trigger") or ndata.get("category") == "Trigger":
                has_trigger = True

            # Node configuration checks
            if ntype in ("condition",):
                op = ndata.get("operator", "equals")
                if op not in SUPPORTED_OPERATORS:
                    errors.append({
                        "node_id": nid,
                        "type": "error",
                        "message": f"Condition node '{nid}' has unsupported operator '{op}'. Supported: {', '.join(sorted(SUPPORTED_OPERATORS))}."
                    })

            elif ntype in ("text_transform", "transform_text"):
                op = ndata.get("operation", "uppercase").strip().lower()
                if op not in VALID_TEXT_OPERATIONS:
                    errors.append({
                        "node_id": nid,
                        "type": "error",
                        "message": f"Text Transform node '{nid}' has invalid operation '{op}'. Valid: {', '.join(sorted(VALID_TEXT_OPERATIONS))}."
                    })

            elif ntype in ("delay",):
                raw_delay = ndata.get("delay_seconds")
                if raw_delay is None:
                    raw_delay = float(ndata.get("delay_ms", 300)) / 1000.0
                else:
                    try:
                        raw_delay = float(raw_delay)
                    except ValueError:
                        raw_delay = 0.0

                if raw_delay > MAX_SAFE_DELAY_SECONDS:
                    errors.append({
                        "node_id": nid,
                        "type": "error",
                        "message": f"Delay node '{nid}' specifies {raw_delay}s which exceeds the maximum allowed safety limit of {MAX_SAFE_DELAY_SECONDS}s."
                    })

        # Trigger presence verification
        if not has_trigger:
            errors.append({
                "type": "error",
                "message": "Workflow validation error: At least one trigger node (such as Manual Trigger) is required to start the workflow."
            })

        # Validate edges
        adj = defaultdict(list)
        in_degree = defaultdict(int)
        for nid in node_ids:
            in_degree[nid] = 0

        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            eid = edge.get("id", f"{src}->{tgt}")

            if not src or src not in node_ids:
                errors.append({"edge_id": eid, "type": "error", "message": f"Edge references invalid source node: '{src}'."})
            if not tgt or tgt not in node_ids:
                errors.append({"edge_id": eid, "type": "error", "message": f"Edge references invalid target node: '{tgt}'."})

            if src in node_ids and tgt in node_ids:
                adj[src].append(tgt)
                in_degree[tgt] += 1

        # Cycle detection using Kahn's algorithm
        queue = deque([nid for nid in node_ids if in_degree[nid] == 0])
        visited_count = 0

        if node_ids and not queue:
            errors.append({
                "type": "error",
                "message": "Circular dependency (cycle) detected in workflow. NodeFlow requires a Directed Acyclic Graph (DAG)."
            })
        else:
            temp_in_degree = dict(in_degree)
            temp_queue = deque(queue)
            while temp_queue:
                u = temp_queue.popleft()
                visited_count += 1
                for v in adj[u]:
                    temp_in_degree[v] -= 1
                    if temp_in_degree[v] == 0:
                        temp_queue.append(v)

            if visited_count < len(node_ids):
                errors.append({
                    "type": "error",
                    "message": "Circular dependency (cycle) detected in workflow. NodeFlow requires a Directed Acyclic Graph (DAG)."
                })

        # Isolated node warnings
        if len(node_ids) > 1:
            for nid in node_ids:
                if in_degree[nid] == 0 and len(adj[nid]) == 0:
                    warnings.append({
                        "node_id": nid,
                        "type": "warning",
                        "message": f"Node '{nid}' is isolated and has no connections."
                    })

        valid = len(errors) == 0
        return {
            "valid": valid,
            "errors": errors,
            "warnings": warnings,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }

    def execute(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        trigger_payload: Optional[Dict[str, Any]] = None,
        workflow_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a workflow graph in dependency order.
        Returns execution status, step logs, node results, timing, and errors.
        """
        start_time = time.perf_counter()
        started_at_str = utc_now_str()
        logs: List[Dict[str, Any]] = []
        node_results: Dict[str, Any] = {}
        execution_order: List[str] = []

        def log(level: str, message: str, node_id: Optional[str] = None, node_name: Optional[str] = None, data: Optional[Any] = None):
            logs.append({
                "timestamp": utc_now_str(),
                "level": level,
                "message": message,
                "node_id": node_id,
                "node_name": node_name,
                "data": data
            })

        log("INFO", f"Starting workflow execution: {len(nodes)} nodes, {len(edges)} connections.")

        # 1. Validation
        val_res = self.validate_workflow(nodes, edges)
        if not val_res["valid"]:
            first_err = val_res["errors"][0]["message"] if val_res["errors"] else "Workflow validation failed."
            log("ERROR", f"Graph validation rejected: {first_err}")
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "status": "FAILED",
                "error": first_err,
                "duration_ms": duration_ms,
                "started_at": started_at_str,
                "completed_at": utc_now_str(),
                "logs": logs,
                "node_results": node_results,
                "execution_order": execution_order
            }

        node_map = {n["id"]: n for n in nodes}

        # Build adjacency maps
        outgoing_edges = defaultdict(list)
        incoming_edges = defaultdict(list)
        for e in edges:
            src = e.get("source")
            tgt = e.get("target")
            if src and tgt and src in node_map and tgt in node_map:
                outgoing_edges[src].append(e)
                incoming_edges[tgt].append(e)

        # Topological in-degree queue
        in_degree = {nid: len(incoming_edges[nid]) for nid in node_map}
        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])

        skipped_nodes: Set[str] = set()
        execution_context = {
            "trigger_payload": trigger_payload or {},
            "workflow_id": workflow_id,
            "node_results": node_results
        }

        overall_error = None
        has_failed = False

        while queue:
            cur_id = queue.popleft()
            cur_node = node_map[cur_id]
            node_type = cur_node.get("type", "unknown")
            node_data = cur_node.get("data", {})
            node_label = node_data.get("label", node_type)

            execution_order.append(cur_id)

            # Check if this node should be skipped due to upstream conditional branch
            if incoming_edges[cur_id]:
                has_active_signal = False
                all_sources_skipped = True

                for in_edge in incoming_edges[cur_id]:
                    src_id = in_edge.get("source")
                    src_handle = in_edge.get("sourceHandle")

                    if src_id not in skipped_nodes:
                        src_res = node_results.get(src_id)
                        if src_res and src_res.get("branch_selected"):
                            chosen = src_res["branch_selected"]
                            if src_handle and src_handle != chosen:
                                continue  # this condition branch edge is inactive
                        has_active_signal = True
                        all_sources_skipped = False
                        break

                if not has_active_signal or all_sources_skipped:
                    skipped_nodes.add(cur_id)
                    log("INFO", f"Skipping node '{node_label}' ({cur_id}): branch inactive.", node_id=cur_id, node_name=node_label)
                    node_results[cur_id] = {
                        "node_id": cur_id,
                        "node_type": node_type,
                        "node_name": node_label,
                        "status": "SKIPPED",
                        "duration_ms": 0.0,
                        "inputs": {},
                        "output": None,
                        "error": None,
                        "started_at": utc_now_str(),
                        "finished_at": utc_now_str()
                    }
                    for out_edge in outgoing_edges[cur_id]:
                        nxt_id = out_edge["target"]
                        in_degree[nxt_id] -= 1
                        if in_degree[nxt_id] == 0:
                            queue.append(nxt_id)
                    continue

            # Gather structured inputs from incoming edges
            node_inputs: Dict[str, Any] = {}
            for in_edge in incoming_edges[cur_id]:
                src_id = in_edge.get("source")
                tgt_handle = in_edge.get("targetHandle") or "input"

                if src_id in node_results:
                    src_output = node_results[src_id].get("output")
                    if tgt_handle in node_inputs:
                        if not isinstance(node_inputs[tgt_handle], list):
                            node_inputs[tgt_handle] = [node_inputs[tgt_handle]]
                        node_inputs[tgt_handle].append(src_output)
                    else:
                        node_inputs[tgt_handle] = src_output

            log("DEBUG", f"Executing node '{node_label}' ({node_type})", node_id=cur_id, node_name=node_label, data={"inputs": node_inputs})

            step_started_at = utc_now_str()
            node_start = time.perf_counter()

            try:
                output_val, branch = execute_node(node_type, node_data, node_inputs, execution_context)
                node_dur = round((time.perf_counter() - node_start) * 1000, 2)
                step_finished_at = utc_now_str()

                node_results[cur_id] = {
                    "node_id": cur_id,
                    "node_type": node_type,
                    "node_name": node_label,
                    "status": "COMPLETED",
                    "duration_ms": node_dur,
                    "inputs": node_inputs,
                    "output": output_val,
                    "branch_selected": branch,
                    "error": None,
                    "started_at": step_started_at,
                    "finished_at": step_finished_at
                }

                if branch:
                    log("SUCCESS", f"Condition evaluated -> branch: '{branch.upper()}' ({node_dur}ms)", node_id=cur_id, node_name=node_label, data={"branch": branch})
                else:
                    log("SUCCESS", f"Node '{node_label}' completed ({node_dur}ms)", node_id=cur_id, node_name=node_label, data={"output": output_val})

            except Exception as exc:
                node_dur = round((time.perf_counter() - node_start) * 1000, 2)
                step_finished_at = utc_now_str()
                err_msg = str(exc)
                overall_error = err_msg
                has_failed = True

                node_results[cur_id] = {
                    "node_id": cur_id,
                    "node_type": node_type,
                    "node_name": node_label,
                    "status": "FAILED",
                    "duration_ms": node_dur,
                    "inputs": node_inputs,
                    "output": None,
                    "error": err_msg,
                    "started_at": step_started_at,
                    "finished_at": step_finished_at
                }
                log("ERROR", f"Node '{node_label}' failed: {err_msg}", node_id=cur_id, node_name=node_label)
                break

            # Downstream in-degree decrement
            for out_edge in outgoing_edges[cur_id]:
                nxt_id = out_edge["target"]
                in_degree[nxt_id] -= 1
                if in_degree[nxt_id] == 0:
                    queue.append(nxt_id)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        status = "FAILED" if has_failed else "COMPLETED"

        if status == "COMPLETED":
            log("SUCCESS", f"Workflow execution finished successfully in {duration_ms}ms. Total steps: {len(node_results)}.")
        else:
            log("ERROR", f"Workflow execution halted with error after {duration_ms}ms: {overall_error}")

        return {
            "status": status,
            "error": overall_error,
            "duration_ms": duration_ms,
            "started_at": started_at_str,
            "completed_at": utc_now_str(),
            "logs": logs,
            "node_results": node_results,
            "execution_order": execution_order
        }
