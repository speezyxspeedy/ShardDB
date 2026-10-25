import docker
from docker.errors import NotFound, APIError
from typing import List, Optional, Dict, Any
from app.services.docker_service import docker_service
from app.schemas.container import (
    ContainerSummary,
    ContainerDetail,
    ContainerPortMapping,
    ContainerMount,
    ContainerNetwork,
    ContainerActionResponse,
)
from app.core.exceptions import (
    ContainerNotFoundException,
    DockerUnavailableException,
)
from app.core.security import redact_env_dict


def _format_ports(port_dict: Dict[str, Any]) -> List[str]:
    """Helper to convert Docker port dictionary to clean string representations."""
    if not port_dict:
        return []
    formatted = []
    for container_port, host_bindings in port_dict.items():
        if host_bindings:
            for b in host_bindings:
                host_ip = b.get("HostIp", "0.0.0.0")
                host_port = b.get("HostPort", "")
                formatted.append(f"{host_ip}:{host_port}->{container_port}")
        else:
            formatted.append(container_port)
    return formatted


class ContainerService:
    def list_containers(self, all_containers: bool = True) -> List[ContainerSummary]:
        client = docker_service.get_client()
        try:
            containers = client.containers.list(all=all_containers)
            results = []
            for c in containers:
                attrs = c.attrs
                status = c.status
                state_dict = attrs.get("State", {})
                state = state_dict.get("Status", status)
                
                # Health status if available
                health = None
                if "Health" in state_dict:
                    health = state_dict["Health"].get("Status")

                # Compose labels
                labels = attrs.get("Config", {}).get("Labels", {}) or {}
                compose_project = labels.get("com.docker.compose.project")
                compose_service = labels.get("com.docker.compose.service")

                # Formatted ports
                ports = _format_ports(attrs.get("NetworkSettings", {}).get("Ports", {}))

                image_name = ""
                if c.image and c.image.tags:
                    image_name = c.image.tags[0]
                elif attrs.get("Config", {}).get("Image"):
                    image_name = attrs["Config"]["Image"]

                results.append(
                    ContainerSummary(
                        id=c.id,
                        short_id=c.short_id,
                        name=c.name.lstrip("/"),
                        image=image_name,
                        status=status,
                        state=state,
                        created=attrs.get("Created", ""),
                        ports=ports,
                        health=health,
                        compose_project=compose_project,
                        compose_service=compose_service,
                        is_demo=False,
                    )
                )
            return results
        except APIError as e:
            raise DockerUnavailableException(detail=f"Docker API error while listing containers: {str(e)}")

    def get_container(self, container_id: str) -> ContainerDetail:
        client = docker_service.get_client()
        try:
            c = client.containers.get(container_id)
            attrs = c.attrs

            state_dict = attrs.get("State", {})
            status = c.status
            state = state_dict.get("Status", status)

            # Ports
            raw_ports = attrs.get("NetworkSettings", {}).get("Ports", {}) or {}
            port_mappings: List[ContainerPortMapping] = []
            for c_port, bindings in raw_ports.items():
                proto = "tcp"
                port_num = c_port
                if "/" in c_port:
                    port_num, proto = c_port.split("/", 1)
                if bindings:
                    for b in bindings:
                        port_mappings.append(
                            ContainerPortMapping(
                                host_ip=b.get("HostIp"),
                                host_port=b.get("HostPort"),
                                container_port=port_num,
                                protocol=proto,
                            )
                        )
                else:
                    port_mappings.append(
                        ContainerPortMapping(
                            container_port=port_num,
                            protocol=proto,
                        )
                    )

            # Mounts
            raw_mounts = attrs.get("Mounts", []) or []
            mounts: List[ContainerMount] = []
            for m in raw_mounts:
                mounts.append(
                    ContainerMount(
                        source=m.get("Source", ""),
                        destination=m.get("Destination", ""),
                        mode=m.get("Mode", "rw"),
                        rw=m.get("RW", True),
                        type=m.get("Type", "bind"),
                    )
                )

            # Networks
            raw_networks = attrs.get("NetworkSettings", {}).get("Networks", {}) or {}
            networks: List[ContainerNetwork] = []
            for net_name, net_info in raw_networks.items():
                networks.append(
                    ContainerNetwork(
                        name=net_name,
                        ip_address=net_info.get("IPAddress"),
                        gateway=net_info.get("Gateway"),
                        mac_address=net_info.get("MacAddress"),
                    )
                )

            # Environment variables (parsed and redacted)
            raw_env_list = attrs.get("Config", {}).get("Env", []) or []
            env_dict: Dict[str, str] = {}
            for item in raw_env_list:
                if "=" in item:
                    k, v = item.split("=", 1)
                    env_dict[k] = v
                else:
                    env_dict[item] = ""
            redacted_env = redact_env_dict(env_dict)

            # Health
            health = None
            if "Health" in state_dict:
                health = state_dict["Health"].get("Status")

            # Recent logs snippet
            recent_logs: List[str] = []
            try:
                raw_logs = c.logs(tail=20, timestamps=True)
                if isinstance(raw_logs, bytes):
                    recent_logs = [line for line in raw_logs.decode("utf-8", errors="replace").splitlines() if line]
            except Exception:
                recent_logs = ["(Recent logs unavailable)"]

            image_tag = ""
            if c.image and c.image.tags:
                image_tag = c.image.tags[0]
            else:
                image_tag = attrs.get("Config", {}).get("Image", "")

            return ContainerDetail(
                id=c.id,
                short_id=c.short_id,
                name=c.name.lstrip("/"),
                image=image_tag,
                image_id=c.image.id if c.image else "",
                status=status,
                state=state,
                created=attrs.get("Created", ""),
                started_at=state_dict.get("StartedAt"),
                finished_at=state_dict.get("FinishedAt"),
                exit_code=state_dict.get("ExitCode"),
                restart_count=attrs.get("RestartCount", 0),
                ports=port_mappings,
                mounts=mounts,
                networks=networks,
                env=redacted_env,
                command=attrs.get("Config", {}).get("Cmd"),
                labels=attrs.get("Config", {}).get("Labels", {}) or {},
                health=health,
                recent_logs=recent_logs,
                is_demo=False,
            )
        except NotFound:
            raise ContainerNotFoundException(container_id)
        except APIError as e:
            raise DockerUnavailableException(detail=f"Docker API error inspecting container: {str(e)}")

    def perform_action(self, container_id: str, action: str, confirm: bool) -> ContainerActionResponse:
        action = action.lower()
        if action not in ["start", "stop", "restart"]:
            raise ValueError(f"Unsupported action: '{action}'. Allowed: start, stop, restart")

        if action in ["stop", "restart"] and not confirm:
            return ContainerActionResponse(
                success=False,
                container_id=container_id,
                action=action,
                message=f"Action '{action}' requires user confirmation before execution."
            )

        client = docker_service.get_client()
        try:
            c = client.containers.get(container_id)
            if action == "start":
                c.start()
                msg = f"Container {c.name.lstrip('/')} started successfully."
            elif action == "stop":
                c.stop(timeout=10)
                msg = f"Container {c.name.lstrip('/')} stopped successfully."
            elif action == "restart":
                c.restart(timeout=10)
                msg = f"Container {c.name.lstrip('/')} restarted successfully."

            c.reload()
            return ContainerActionResponse(
                success=True,
                container_id=container_id,
                action=action,
                message=msg,
                new_state=c.status,
            )
        except NotFound:
            raise ContainerNotFoundException(container_id)
        except APIError as e:
            return ContainerActionResponse(
                success=False,
                container_id=container_id,
                action=action,
                message=f"Docker action failed: {str(e)}",
            )


container_service = ContainerService()
