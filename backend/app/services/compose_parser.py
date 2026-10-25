import yaml
import re
from typing import Dict, Any, List, Tuple, Optional
from app.schemas.compose import (
    ComposeServiceConfig,
    ComposeGraphNode,
    ComposeGraphEdge,
    ComposeValidationResponse,
)
from app.schemas.diagnostics import DiagnosticItem
from app.core.security import redact_env_dict


class ComposeParser:
    def parse_yaml(self, raw_yaml: str, project_name: str = "compose-project") -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Safely parses raw YAML string into Python dictionary.
        Returns (parsed_dict, error_string).
        """
        if not raw_yaml or not raw_yaml.strip():
            return None, "Compose file is empty"
        try:
            parsed = yaml.safe_load(raw_yaml)
            if not isinstance(parsed, dict):
                return None, "Root element of Compose file must be a dictionary or mapping"
            return parsed, None
        except yaml.YAMLError as e:
            return None, f"YAML syntax error: {str(e)}"
        except Exception as e:
            return None, f"Failed to parse Compose YAML: {str(e)}"

    def extract_services(self, compose_dict: Dict[str, Any]) -> Tuple[List[ComposeServiceConfig], List[str]]:
        """
        Extracts services and their properties from a parsed Compose dictionary.
        Returns (list_of_services, list_of_service_names).
        """
        services_section = compose_dict.get("services")
        if not services_section or not isinstance(services_section, dict):
            return [], []

        services: List[ComposeServiceConfig] = []
        service_names = list(services_section.keys())

        for name, conf in services_section.items():
            if not isinstance(conf, dict):
                # Service with invalid configuration definition
                services.append(ComposeServiceConfig(name=str(name)))
                continue

            # Extract ports
            raw_ports = conf.get("ports", [])
            ports: List[str] = []
            if isinstance(raw_ports, list):
                for p in raw_ports:
                    if isinstance(p, dict):
                        # Long port syntax
                        target = p.get("target", "")
                        published = p.get("published", "")
                        ports.append(f"{published}:{target}" if published else str(target))
                    else:
                        ports.append(str(p))
            elif isinstance(raw_ports, (str, int)):
                ports.append(str(raw_ports))

            # Extract volumes
            raw_vols = conf.get("volumes", [])
            volumes: List[str] = []
            if isinstance(raw_vols, list):
                for v in raw_vols:
                    if isinstance(v, dict):
                        src = v.get("source", "")
                        tgt = v.get("target", "")
                        volumes.append(f"{src}:{tgt}" if src else str(tgt))
                    else:
                        volumes.append(str(v))

            # Extract environment variables
            raw_env = conf.get("environment", {})
            env_dict: Dict[str, str] = {}
            if isinstance(raw_env, list):
                for item in raw_env:
                    if isinstance(item, str) and "=" in item:
                        k, v = item.split("=", 1)
                        env_dict[k] = v
                    elif isinstance(item, str):
                        env_dict[item] = ""
            elif isinstance(raw_env, dict):
                for k, v in raw_env.items():
                    env_dict[str(k)] = str(v) if v is not None else ""
            redacted_env = redact_env_dict(env_dict)

            # Extract depends_on
            raw_deps = conf.get("depends_on", [])
            deps: List[str] = []
            if isinstance(raw_deps, list):
                deps = [str(d) for d in raw_deps]
            elif isinstance(raw_deps, dict):
                # Condition format: depends_on: { db: { condition: service_healthy } }
                deps = list(raw_deps.keys())

            # Networks
            raw_nets = conf.get("networks", [])
            networks: List[str] = []
            if isinstance(raw_nets, list):
                networks = [str(n) for n in raw_nets]
            elif isinstance(raw_nets, dict):
                networks = list(raw_nets.keys())

            # Build config
            build_conf = conf.get("build")

            # Healthcheck
            healthcheck = conf.get("healthcheck") if isinstance(conf.get("healthcheck"), dict) else None

            # Privileged
            privileged = bool(conf.get("privileged", False))

            services.append(
                ComposeServiceConfig(
                    name=str(name),
                    image=conf.get("image"),
                    build=build_conf,
                    ports=ports,
                    volumes=volumes,
                    environment=redacted_env,
                    depends_on=deps,
                    networks=networks,
                    healthcheck=healthcheck,
                    restart=conf.get("restart"),
                    command=conf.get("command"),
                    entrypoint=conf.get("entrypoint"),
                    privileged=privileged,
                )
            )

        return services, service_names

    def build_graph(
        self, services: List[ComposeServiceConfig], diagnostics: List[DiagnosticItem]
    ) -> Tuple[List[ComposeGraphNode], List[ComposeGraphEdge]]:
        """
        Builds React Flow compatible nodes and directional edges reflecting dependencies.
        Properly flags missing dependencies (referenced in depends_on but missing from services).
        """
        service_names = {s.name for s in services}
        service_issue_counts: Dict[str, int] = {}
        for d in diagnostics:
            if d.service:
                service_issue_counts[d.service] = service_issue_counts.get(d.service, 0) + 1

        nodes: List[ComposeGraphNode] = []
        edges: List[ComposeGraphEdge] = []
        missing_service_nodes: Dict[str, ComposeGraphNode] = {}

        for s in services:
            missing_deps = [dep for dep in s.depends_on if dep not in service_names]
            status = "missing_dependency" if missing_deps else "configured"

            nodes.append(
                ComposeGraphNode(
                    id=s.name,
                    name=s.name,
                    image=s.image,
                    ports=s.ports,
                    dependency_count=len(s.depends_on),
                    issues_count=service_issue_counts.get(s.name, 0),
                    status=status,
                    missing_dependencies=missing_deps,
                )
            )

            # Build edges: edge points from dependent service to dependency (or vice versa for pipeline flow)
            for dep in s.depends_on:
                edge_id = f"edge-{s.name}->{dep}"
                is_valid = dep in service_names
                err_detail = None if is_valid else f"Dependency '{dep}' does not exist in services."
                
                # If target does not exist, create a placeholder phantom node for the graph
                if not is_valid and dep not in missing_service_nodes and dep not in service_names:
                    missing_node = ComposeGraphNode(
                        id=dep,
                        name=f"{dep} (Missing)",
                        image="<not defined>",
                        ports=[],
                        dependency_count=0,
                        issues_count=1,
                        status="missing_dependency",
                        missing_dependencies=[],
                    )
                    missing_service_nodes[dep] = missing_node

                edges.append(
                    ComposeGraphEdge(
                        id=edge_id,
                        source=s.name,
                        target=dep,
                        label="depends_on",
                        is_valid=is_valid,
                        error_detail=err_detail,
                    )
                )

        # Append phantom nodes to the node list so graph renders the broken dependency edge visually
        for missing_node in missing_service_nodes.values():
            nodes.append(missing_node)

        return nodes, edges


compose_parser = ComposeParser()
