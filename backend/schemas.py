"""
Pydantic schemas for request validation and response serialization.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class NodePortSchema(BaseModel):
    id: str
    label: str
    type: str = "any"
    required: bool = False
    description: Optional[str] = None


class ConfigFieldSchema(BaseModel):
    name: str
    label: str
    type: str
    default: Any = None
    options: Optional[List[Dict[str, str]]] = None
    placeholder: Optional[str] = None
    description: Optional[str] = None
    required: bool = False


class NodeDefinitionSchema(BaseModel):
    type: str
    label: str
    category: str
    description: str
    icon: str
    color: str
    inputs: List[NodePortSchema] = Field(default_factory=list)
    outputs: List[NodePortSchema] = Field(default_factory=list)
    default_data: Dict[str, Any] = Field(default_factory=dict)
    config_fields: List[ConfigFieldSchema] = Field(default_factory=list)


# Workflow Schemas
class WorkflowBase(BaseModel):
    name: str = "Untitled Workflow"
    description: Optional[str] = ""
    category: Optional[str] = "General"
    tags: List[str] = Field(default_factory=list)
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    viewport: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_active: bool = True


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    viewport: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class WorkflowOut(WorkflowBase):
    id: str
    created_at: datetime
    updated_at: datetime
    graph_json: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Execution Step Schemas
class ExecutionStepOut(BaseModel):
    id: str
    execution_id: str
    node_id: str
    node_type: str
    node_name: str
    status: str
    input_json: Optional[Dict[str, Any]] = None
    output_json: Optional[Any] = None
    error_message: Optional[str] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    duration_ms: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# Execution Schemas
class ExecutionOut(BaseModel):
    id: str
    workflow_id: Optional[str] = None
    workflow_name: str
    status: str
    triggered_by: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    duration_ms: Optional[float] = 0.0
    error: Optional[str] = None
    error_message: Optional[str] = None
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    node_results: Dict[str, Any] = Field(default_factory=dict)
    final_output_json: Optional[Dict[str, Any]] = None
    execution_order: List[str] = Field(default_factory=list)
    steps: Optional[List[ExecutionStepOut]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ExecuteRequest(BaseModel):
    trigger_payload: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AdHocExecuteRequest(BaseModel):
    workflow_name: Optional[str] = "Ad-Hoc Workflow"
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    trigger_payload: Optional[Dict[str, Any]] = Field(default_factory=dict)


# Validation Schemas
class ValidationErrorItem(BaseModel):
    node_id: Optional[str] = None
    edge_id: Optional[str] = None
    type: str = "error"
    message: str


class ValidationResponse(BaseModel):
    valid: bool
    errors: List[ValidationErrorItem] = Field(default_factory=list)
    warnings: List[ValidationErrorItem] = Field(default_factory=list)
    node_count: int
    edge_count: int


# Template Schema
class TemplateOut(BaseModel):
    id: str
    name: str
    description: str
    category: str
    tags: List[str]
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Stats Schema
class SystemStatsOut(BaseModel):
    total_workflows: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate_pct: float
    avg_duration_ms: float
