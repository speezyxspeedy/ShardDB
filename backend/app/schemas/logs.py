from pydantic import BaseModel
from typing import Optional, List


class LogLine(BaseModel):
    timestamp: Optional[str] = None
    stream: str = "stdout"  # stdout, stderr, or unknown
    message: str


class ContainerLogsResponse(BaseModel):
    container_id: str
    container_name: Optional[str] = None
    tail: int
    total_lines: int
    logs: List[LogLine]
    is_demo: bool = False
