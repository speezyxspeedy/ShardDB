from fastapi import APIRouter, Query
from app.services.log_service import log_service
from app.services.demo_service import demo_service
from app.schemas.logs import ContainerLogsResponse

router = APIRouter(prefix="/containers", tags=["Logs"])


@router.get("/{container_id}/logs", response_model=ContainerLogsResponse)
def get_container_logs(
    container_id: str,
    tail: int = Query(100, ge=1, le=2000, description="Number of recent log lines to fetch"),
    timestamps: bool = Query(True, description="Prefix log lines with ISO timestamps"),
    demo: bool = Query(False, description="Whether to return sample demo logs")
):
    """
    Fetches real-time or historical logs for a container with timestamp parsing and stream classification.
    """
    if demo or container_id.startswith("demo-"):
        return demo_service.get_demo_logs(container_id, tail=tail)
    return log_service.get_container_logs(container_id, tail=tail, timestamps=timestamps)
