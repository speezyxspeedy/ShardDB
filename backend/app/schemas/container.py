from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ContainerPortMapping(BaseModel):
    host_ip: Optional[str] = None
    host_port: Optional[str] = None
    container_port: str
    protocol: str = "tcp"


class ContainerMount(BaseModel):
    source: str
    destination: str
    mode: str = "rw"
    rw: bool = True
    type: str = "bind"


class ContainerNetwork(BaseModel):
    name: str
    ip_address: Optional[str] = None
    gateway: Optional[str] = None
    mac_address: Optional[str] = None


class ContainerSummary(BaseModel):
    id: str
    short_id: str
    name: str
    image: str
    status: str
    state: str
    created: str
    ports: List[str] = []
    health: Optional[str] = None
    compose_project: Optional[str] = None
    compose_service: Optional[str] = None
    is_demo: bool = False


class ContainerDetail(BaseModel):
    id: str
    short_id: str
    name: str
    image: str
    image_id: str
    status: str
    state: str
    created: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    exit_code: Optional[int] = None
    restart_count: int = 0
    ports: List[ContainerPortMapping] = []
    mounts: List[ContainerMount] = []
    networks: List[ContainerNetwork] = []
    env: Dict[str, str] = {}
    command: Optional[List[str]] = None
    labels: Dict[str, str] = {}
    health: Optional[str] = None
    recent_logs: List[str] = []
    is_demo: bool = False


class ContainerActionRequest(BaseModel):
    action: str = Field(..., description="Action to perform: 'start', 'stop', 'restart'")
    confirm: bool = Field(False, description="User confirmation required for stopping/restarting")


class ContainerActionResponse(BaseModel):
    success: bool
    container_id: str
    action: str
    message: str
    new_state: Optional[str] = None
