"""
Unit and integration tests for NodeFlow Workflow Engine.
Covers:
- Graph validation & missing trigger
- Invalid edge references
- Cycle detection
- Valid sequential execution
- Condition true branch & false branch
- Text transformations (uppercase, lowercase, trim, replace, split_lines)
- Delay limits
- Invalid node configuration
- Failed node execution and persisted error
"""

import pytest
from backend.engine import WorkflowEngine


@pytest.fixture
def engine():
    return WorkflowEngine()


def test_validation_empty_workflow(engine):
    res = engine.validate_workflow([], [])
    assert res["valid"] is False
    assert len(res["errors"]) > 0
    assert any("no nodes" in e["message"].lower() for e in res["errors"])


def test_validation_missing_trigger(engine):
    # Workflow without a trigger node
    nodes = [
        {"id": "n1", "type": "text_input", "data": {"text": "hello"}},
        {"id": "n2", "type": "output", "data": {}}
    ]
    edges = [{"id": "e1", "source": "n1", "target": "n2"}]
    res = engine.validate_workflow(nodes, edges)
    assert res["valid"] is False
    assert any("trigger" in e["message"].lower() for e in res["errors"])


def test_validation_invalid_edge_references(engine):
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "n1", "type": "text_input", "data": {"text": "hello"}}
    ]
    # Reference non-existent node
    edges = [{"id": "e1", "source": "t1", "target": "non_existent_node"}]
    res = engine.validate_workflow(nodes, edges)
    assert res["valid"] is False
    assert any("invalid target" in e["message"].lower() for e in res["errors"])


def test_validation_detects_cycle(engine):
    # A -> B -> C -> A
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "node-a", "type": "text_input", "data": {"text": "hello"}},
        {"id": "node-b", "type": "text_transform", "data": {"operation": "uppercase"}},
        {"id": "node-c", "type": "output", "data": {}}
    ]
    edges = [
        {"id": "e0", "source": "t1", "target": "node-a"},
        {"id": "e1", "source": "node-a", "target": "node-b"},
        {"id": "e2", "source": "node-b", "target": "node-c"},
        {"id": "e3", "source": "node-c", "target": "node-a"},
    ]
    res = engine.validate_workflow(nodes, edges)
    assert res["valid"] is False
    assert any("cycle" in e["message"].lower() or "circular" in e["message"].lower() for e in res["errors"])


def test_validation_delay_limits(engine):
    # Delay above 5.0 seconds
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "d1", "type": "delay", "data": {"delay_seconds": 15.0}}
    ]
    edges = [{"id": "e1", "source": "t1", "target": "d1"}]
    res = engine.validate_workflow(nodes, edges)
    assert res["valid"] is False
    assert any("safety limit" in e["message"].lower() or "exceeds" in e["message"].lower() for e in res["errors"])


def test_valid_sequential_execution(engine):
    # Manual Trigger -> Text Input -> Text Transform -> Output
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "n1", "type": "text_input", "data": {"text": "nodeflow industrial blueprint"}},
        {"id": "n2", "type": "text_transform", "data": {"operation": "uppercase"}},
        {"id": "n3", "type": "output", "data": {"label": "Terminal Output"}}
    ]
    edges = [
        {"id": "e1", "source": "t1", "target": "n1", "sourceHandle": "output", "targetHandle": "input"},
        {"id": "e2", "source": "n1", "target": "n2", "sourceHandle": "output", "targetHandle": "input"},
        {"id": "e3", "source": "n2", "target": "n3", "sourceHandle": "output", "targetHandle": "input"},
    ]
    outcome = engine.execute(nodes, edges)
    assert outcome["status"] == "COMPLETED"
    assert outcome["node_results"]["t1"]["status"] == "COMPLETED"
    assert outcome["node_results"]["t1"]["output"]["trigger"] == "manual"
    assert outcome["node_results"]["n1"]["status"] == "COMPLETED"
    assert outcome["node_results"]["n2"]["output"]["transformed_text"] == "NODEFLOW INDUSTRIAL BLUEPRINT"
    assert outcome["node_results"]["n3"]["status"] == "COMPLETED"


def test_condition_true_branch(engine):
    # Manual Trigger -> Text Input ("URGENT issue") -> Condition (contains "URGENT") -> True (Output) / False (Output)
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "n1", "type": "text_input", "data": {"text": "URGENT server outage detected"}},
        {
            "id": "c1",
            "type": "condition",
            "data": {
                "field_path": "text",
                "operator": "contains",
                "target_value": "URGENT",
                "data_type": "string"
            }
        },
        {"id": "out-true", "type": "output", "data": {"label": "Escalation Queue"}},
        {"id": "out-false", "type": "output", "data": {"label": "Standard Queue"}}
    ]
    edges = [
        {"id": "e1", "source": "t1", "target": "n1", "sourceHandle": "output", "targetHandle": "input"},
        {"id": "e2", "source": "n1", "target": "c1", "sourceHandle": "output", "targetHandle": "input"},
        {"id": "e3", "source": "c1", "target": "out-true", "sourceHandle": "true", "targetHandle": "input"},
        {"id": "e4", "source": "c1", "target": "out-false", "sourceHandle": "false", "targetHandle": "input"},
    ]

    outcome = engine.execute(nodes, edges)
    assert outcome["status"] == "COMPLETED"
    assert outcome["node_results"]["c1"]["branch_selected"] == "true"
    assert outcome["node_results"]["out-true"]["status"] == "COMPLETED"
    assert outcome["node_results"]["out-false"]["status"] == "SKIPPED"


def test_condition_false_branch(engine):
    # Text doesn't contain target
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "n1", "type": "text_input", "data": {"text": "Routine maintenance completed smoothly"}},
        {
            "id": "c1",
            "type": "condition",
            "data": {
                "field_path": "text",
                "operator": "contains",
                "target_value": "URGENT",
                "data_type": "string"
            }
        },
        {"id": "out-true", "type": "output", "data": {"label": "Escalation Queue"}},
        {"id": "out-false", "type": "output", "data": {"label": "Standard Queue"}}
    ]
    edges = [
        {"id": "e1", "source": "t1", "target": "n1", "sourceHandle": "output", "targetHandle": "input"},
        {"id": "e2", "source": "n1", "target": "c1", "sourceHandle": "output", "targetHandle": "input"},
        {"id": "e3", "source": "c1", "target": "out-true", "sourceHandle": "true", "targetHandle": "input"},
        {"id": "e4", "source": "c1", "target": "out-false", "sourceHandle": "false", "targetHandle": "input"},
    ]

    outcome = engine.execute(nodes, edges)
    assert outcome["status"] == "COMPLETED"
    assert outcome["node_results"]["c1"]["branch_selected"] == "false"
    assert outcome["node_results"]["out-true"]["status"] == "SKIPPED"
    assert outcome["node_results"]["out-false"]["status"] == "COMPLETED"


def test_text_transform_operations(engine):
    # Test lowercase, trim, replace, split_lines
    from backend.nodes.registry import execute_text_transform

    # 1. Lowercase
    res, _ = execute_text_transform({"operation": "lowercase"}, {"input": "HELLO WORLD"}, {})
    assert res["transformed_text"] == "hello world"

    # 2. Trim
    res, _ = execute_text_transform({"operation": "trim"}, {"input": "   spaces removed   "}, {})
    assert res["transformed_text"] == "spaces removed"

    # 3. Replace
    res, _ = execute_text_transform({"operation": "replace", "find_text": "foo", "replace_with": "bar"}, {"input": "foo baz"}, {})
    assert res["transformed_text"] == "bar baz"

    # 4. Split into lines
    res, _ = execute_text_transform({"operation": "split_lines"}, {"input": "line1\nline2\nline3"}, {})
    assert res["line_count"] == 3
    assert res["lines"] == ["line1", "line2", "line3"]


def test_invalid_node_configuration(engine):
    # Unsupported operator
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "c1", "type": "condition", "data": {"operator": "invalid_magic_operator"}}
    ]
    edges = [{"id": "e1", "source": "t1", "target": "c1"}]
    res = engine.validate_workflow(nodes, edges)
    assert res["valid"] is False
    assert any("unsupported operator" in e["message"].lower() for e in res["errors"])


def test_failed_node_execution_persists_error(engine):
    # Node with required field empty
    nodes = [
        {"id": "t1", "type": "manual_trigger", "data": {}},
        {"id": "n1", "type": "text_input", "data": {"text": "", "required": True}},
        {"id": "n2", "type": "output", "data": {}}
    ]
    edges = [
        {"id": "e1", "source": "t1", "target": "n1"},
        {"id": "e2", "source": "n1", "target": "n2"}
    ]
    outcome = engine.execute(nodes, edges)
    assert outcome["status"] == "FAILED"
    assert outcome["node_results"]["n1"]["status"] == "FAILED"
    assert outcome["error"] is not None
    assert "required" in outcome["error"].lower()
