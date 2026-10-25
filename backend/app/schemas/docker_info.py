from pydantic import BaseModel
from typing import Optional, List


class DockerStatusResponse(BaseModel):
    connected: bool
    status: str
    version: Optional[str] = None
    api_version: Optional[str] = None
    os: Optional[str] = None
    arch: Optional[str] = None
    containers_running: int = 0
    containers_stopped: int = 0
    containers_total: int = 0
    images_count: int = 0
    server_time: Optional[str] = None
    error_message: Optional[str] = None
    troubleshooting: List[str] = []
    is_demo: bool = False
