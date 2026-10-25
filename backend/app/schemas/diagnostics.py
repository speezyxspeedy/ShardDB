from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class DiagnosticItem(BaseModel):
    id: str
    rule_id: str
    severity: Literal["error", "warning", "info"]
    title: str
    explanation: str
    service: Optional[str] = None
    path: Optional[str] = None
    suggested_remediation: str
    auto_fix_available: bool = False


class DiagnosticsReport(BaseModel):
    total_issues: int
    errors_count: int
    warnings_count: int
    info_count: int
    items: List[DiagnosticItem]
