from fastapi import APIRouter
from app.services.docker_service import docker_service
from app.schemas.docker_info import DockerStatusResponse

router = APIRouter(prefix="/docker", tags=["Docker"])


@router.get("/status", response_model=DockerStatusResponse)
def get_docker_status():
    """
    Returns Docker daemon connectivity, version information, and container counts.
    Never crashes; returns connected=False with troubleshooting if daemon is offline.
    """
    return docker_service.check_status()
