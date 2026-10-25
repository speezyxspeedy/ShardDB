from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ImageSummary(BaseModel):
    id: str
    short_id: str
    repository: str
    tag: str
    size_bytes: int
    size_formatted: str
    created: str
    containers_count: Optional[int] = 0
    is_demo: bool = False


class ImageDetail(BaseModel):
    id: str
    short_id: str
    tags: List[str] = []
    size_bytes: int
    size_formatted: str
    created: str
    architecture: Optional[str] = None
    os: Optional[str] = None
    docker_version: Optional[str] = None
    author: Optional[str] = None
    env: List[str] = []
    entrypoint: Optional[List[str]] = None
    cmd: Optional[List[str]] = None
    layers: List[Dict[str, Any]] = []
    labels: Dict[str, str] = {}
    is_demo: bool = False
