from fastapi import APIRouter, Query, HTTPException, status
from typing import List
from app.services.image_service import image_service
from app.services.demo_service import demo_service
from app.schemas.image import ImageSummary, ImageDetail
from app.core.exceptions import DockerUnavailableException

router = APIRouter(prefix="/images", tags=["Images"])


@router.get("", response_model=List[ImageSummary])
def list_images(demo: bool = Query(False, description="Use sample demo images if Docker is offline")):
    """
    List local Docker images. Distinguishes live daemon data from demo data.
    """
    if demo:
        return demo_service.get_demo_images()
    try:
        return image_service.list_images()
    except DockerUnavailableException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query images: {str(e)}"
        )


@router.get("/{image_id}", response_model=ImageDetail)
def get_image(image_id: str, demo: bool = Query(False)):
    """
    Inspect detailed image metadata, layers, and labels.
    """
    if demo or image_id.startswith("sha256:4d83b28b"):
        # Demo image detail
        return ImageDetail(
            id=image_id,
            short_id=image_id[:12],
            tags=["docksight/backend:v1.0.0"],
            size_bytes=184549376,
            size_formatted="176.0 MB",
            created="2026-10-25T08:15:00Z",
            architecture="amd64",
            os="linux",
            docker_version="25.0.3",
            author="DockSight DevOps",
            env=["PATH=/usr/local/bin:/usr/bin", "PYTHONUNBUFFERED=1"],
            entrypoint=None,
            cmd=["uvicorn", "main:app"],
            layers=[
                {"id": "c1a2b3c4d5e6", "created_by": "COPY backend /app", "size_bytes": 15482000, "size_formatted": "14.8 MB", "comment": ""},
                {"id": "a9b8c7d6e5f4", "created_by": "RUN pip install -r requirements.txt", "size_bytes": 112450000, "size_formatted": "107.2 MB", "comment": ""},
                {"id": "334455667788", "created_by": "FROM python:3.11-slim", "size_bytes": 56617376, "size_formatted": "54.0 MB", "comment": ""},
            ],
            labels={"maintainer": "DevOps Engineering"},
            is_demo=True,
        )
    return image_service.get_image(image_id)
