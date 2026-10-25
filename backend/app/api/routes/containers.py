from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Optional
from app.services.container_service import container_service
from app.services.demo_service import demo_service
from app.services.docker_service import docker_service
from app.schemas.container import (
    ContainerSummary,
    ContainerDetail,
    ContainerActionRequest,
    ContainerActionResponse,
)
from app.core.exceptions import DockerUnavailableException

router = APIRouter(prefix="/containers", tags=["Containers"])


@router.get("", response_model=List[ContainerSummary])
def list_containers(
    all_containers: bool = Query(True, description="Include stopped containers"),
    demo: bool = Query(False, description="Use sample demo containers if Docker is offline")
):
    """
    List Docker containers. If Docker is offline and demo=True is explicitly requested,
    returns labeled sample data. Otherwise returns real Docker containers or raises 503.
    """
    if demo:
        return demo_service.get_demo_containers()
    try:
        return container_service.list_containers(all_containers=all_containers)
    except DockerUnavailableException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query containers: {str(e)}"
        )


@router.get("/{container_id}", response_model=ContainerDetail)
def get_container(
    container_id: str,
    demo: bool = Query(False, description="Whether this is a demo container query")
):
    """
    Inspect detailed configuration for a specific container.
    """
    if demo or container_id.startswith("demo-"):
        return demo_service.get_demo_container_detail(container_id)
    return container_service.get_container(container_id)


@router.post("/{container_id}/action", response_model=ContainerActionResponse)
def perform_container_action(
    container_id: str,
    req: ContainerActionRequest,
    demo: bool = Query(False)
):
    """
    Perform lifecycle action on container: start, stop, or restart.
    Destructive actions (stop, restart) require confirm: true.
    """
    if demo or container_id.startswith("demo-"):
        # Simulated action for demo container
        return ContainerActionResponse(
            success=True,
            container_id=container_id,
            action=req.action,
            message=f"[DEMO SIMULATION] Action '{req.action}' executed successfully on demo container.",
            new_state="running" if req.action in ["start", "restart"] else "exited"
        )
    return container_service.perform_action(container_id, req.action, req.confirm)
