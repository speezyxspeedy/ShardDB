"""
SQLAlchemy models for NodeFlow.
Workflows, Executions, ExecutionSteps, and Templates.
"""

from datetime import datetime, timezone
import json
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Float, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False, default="Untitled Workflow")
    description = Column(Text, nullable=True, default="")
    category = Column(String(64), nullable=True, default="General")
    tags = Column(JSON, nullable=False, default=list)
    nodes = Column(JSON, nullable=False, default=list)
    edges = Column(JSON, nullable=False, default=list)
    viewport = Column(JSON, nullable=True, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    @property
    def graph_json(self) -> str:
        return json.dumps({"nodes": self.nodes, "edges": self.edges, "viewport": self.viewport})


class Execution(Base):
    __tablename__ = "executions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    workflow_id = Column(String(36), nullable=True, index=True)
    workflow_name = Column(String(255), nullable=False, default="Draft Execution")
    status = Column(String(32), nullable=False, default="QUEUED", index=True)  # QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    triggered_by = Column(String(32), nullable=False, default="MANUAL")  # MANUAL, WEBHOOK, TEST, SCHEDULE
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Float, nullable=True, default=0.0)
    error = Column(Text, nullable=True)
    logs = Column(JSON, nullable=False, default=list)
    node_results = Column(JSON, nullable=False, default=dict)
    execution_order = Column(JSON, nullable=False, default=list)

    # Relationships and aliases for spec compatibility
    steps = relationship("ExecutionStep", back_populates="execution", cascade="all, delete-orphan", order_by="ExecutionStep.started_at")

    @property
    def finished_at(self):
        return self.completed_at

    @property
    def error_message(self):
        return self.error

    @property
    def final_output_json(self):
        return self.node_results


class ExecutionStep(Base):
    __tablename__ = "execution_steps"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    execution_id = Column(String(36), ForeignKey("executions.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String(64), nullable=False)
    node_type = Column(String(64), nullable=False)
    node_name = Column(String(255), nullable=False, default="")
    status = Column(String(32), nullable=False, default="PENDING")  # COMPLETED, FAILED, SKIPPED
    input_json = Column(JSON, nullable=True, default=dict)
    output_json = Column(JSON, nullable=True, default=dict)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=utc_now)
    finished_at = Column(DateTime, nullable=True)
    duration_ms = Column(Float, nullable=True, default=0.0)

    execution = relationship("Execution", back_populates="steps")


class TemplateModel(Base):
    __tablename__ = "templates"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False, default="Automation")
    tags = Column(JSON, nullable=False, default=list)
    nodes = Column(JSON, nullable=False, default=list)
    edges = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=utc_now)
