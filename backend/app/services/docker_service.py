import docker
from docker.errors import DockerException
import platform
import logging
from typing import Optional, Tuple, Dict, Any
from app.schemas.docker_info import DockerStatusResponse
from app.core.exceptions import DockerUnavailableException
from app.core.config import settings

logger = logging.getLogger(__name__)


class DockerService:
    def __init__(self):
        self._client: Optional[docker.DockerClient] = None
        self._last_status: Optional[DockerStatusResponse] = None

    def get_client(self) -> docker.DockerClient:
        """
        Attempts to acquire an active Docker client.
        Raises DockerUnavailableException if Docker is not running or unreachable.
        """
        try:
            # Check if existing client is still healthy
            if self._client is not None:
                self._client.ping()
                return self._client
        except Exception:
            self._client = None

        try:
            # docker.from_env handles both Windows named pipe and Unix socket
            client = docker.from_env(timeout=settings.DOCKER_TIMEOUT_SECONDS)
            client.ping()
            self._client = client
            return self._client
        except DockerException as e:
            logger.warning(f"Docker connection error: {e}")
            raise DockerUnavailableException(
                detail=f"Docker Engine is not running or unreachable: {str(e)}"
            )
        except Exception as e:
            logger.warning(f"Unexpected error connecting to Docker: {e}")
            raise DockerUnavailableException(
                detail=f"Unable to establish connection to Docker daemon: {str(e)}"
            )

    def check_status(self) -> DockerStatusResponse:
        """
        Verifies Docker Engine connectivity and gathers system metadata safely.
        Never throws unhandled exceptions; returns structured disconnected status if offline.
        """
        try:
            client = self.get_client()
            version_info = client.version()
            info = client.info()

            containers_running = info.get("ContainersRunning", 0)
            containers_stopped = info.get("ContainersStopped", 0)
            containers_total = info.get("Containers", 0)
            images_count = info.get("Images", 0)

            return DockerStatusResponse(
                connected=True,
                status="Connected",
                version=version_info.get("Version"),
                api_version=version_info.get("ApiVersion"),
                os=info.get("OperatingSystem", platform.system()),
                arch=info.get("Architecture", platform.machine()),
                containers_running=containers_running,
                containers_stopped=containers_stopped,
                containers_total=containers_total,
                images_count=images_count,
                server_time=info.get("SystemTime"),
                error_message=None,
                troubleshooting=[],
                is_demo=False
            )
        except DockerUnavailableException as due:
            troubleshooting = [
                "Verify that Docker Desktop or the Docker Engine daemon is started.",
                "On Windows, ensure 'Expose daemon on tcp://localhost:2375 without TLS' or named pipe access is permitted.",
                "Ensure current user belongs to the 'docker-users' group or runs with appropriate permissions.",
                "Test connectivity in PowerShell by running: `docker info`.",
            ]
            return DockerStatusResponse(
                connected=False,
                status="Disconnected",
                error_message=due.detail.get("message") if isinstance(due.detail, dict) else str(due.detail),
                troubleshooting=troubleshooting,
                is_demo=False
            )
        except Exception as e:
            return DockerStatusResponse(
                connected=False,
                status="Disconnected",
                error_message=f"Failed to connect to Docker daemon: {str(e)}",
                troubleshooting=[
                    "Check if Docker is installed on your system.",
                    "Start Docker Desktop from the Start Menu or Applications.",
                ],
                is_demo=False
            )


docker_service = DockerService()
