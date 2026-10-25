from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.diagnostics import DiagnosticItem


class ComposeServiceConfig(BaseModel):
    name: str
    image: Optional[str] = None
    build: Optional[Any] = None
    ports: List[str] = []
    volumes: List[str] = []
    environment: Dict[str, str] = {}
    depends_on: List[str] = []
    networks: List[str] = []
    healthcheck: Optional[Dict[str, Any]] = None
    restart: Optional[str] = None
    command: Optional[Any] = None
    entrypoint: Optional[Any] = None
    privileged: bool = False


class ComposeGraphNode(BaseModel):
    id: str
    name: str
    image: Optional[str] = None
    ports: List[str] = []
    dependency_count: int = 0
    issues_count: int = 0
    status: str = "configured"  # "configured", "running", "stopped", "missing_dependency"
    missing_dependencies: List[str] = []


class ComposeGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = "depends_on"
    is_valid: bool = True
    error_detail: Optional[str] = None


class ComposeValidationResponse(BaseModel):
    is_valid: bool
    services_count: int
    services: List[ComposeServiceConfig] = []
    nodes: List[ComposeGraphNode] = []
    edges: List[ComposeGraphEdge] = []
    diagnostics: List[DiagnosticItem] = []
    raw_yaml: str
    project_name: Optional[str] = "compose-project"


class ComposeUploadRequest(BaseModel):
    yaml_content: str
    project_name: Optional[str] = "custom-compose"
