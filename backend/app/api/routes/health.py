from fastapi import APIRouter
from app.services.docker_service import docker_service
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """
    Health check endpoint distinguishing application status from Docker connectivity.
    """
    docker_status = docker_service.check_status()
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docker_connected": docker_status.connected,
        "docker_status": docker_status.status,
    }
