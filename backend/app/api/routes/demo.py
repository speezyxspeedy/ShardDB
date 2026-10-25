from fastapi import APIRouter
from app.services.demo_service import demo_service
from app.schemas.docker_info import DockerStatusResponse
from app.schemas.container import ContainerSummary, ContainerDetail
from app.schemas.image import ImageSummary
from typing import List

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.get("/status", response_model=DockerStatusResponse)
def get_demo_status():
    return demo_service.get_demo_status()


@router.get("/containers", response_model=List[ContainerSummary])
def get_demo_containers():
    return demo_service.get_demo_containers()


@router.get("/images", response_model=List[ImageSummary])
def get_demo_images():
    return demo_service.get_demo_images()
