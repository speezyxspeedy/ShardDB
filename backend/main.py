"""
NodeFlow FastAPI Application.
Main REST API backend for visual workflow authoring, graph validation,
execution engine, database persistence, and execution step history.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, get_db, Base
from .models import Workflow, Execution, ExecutionStep
from .schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowOut,
    ExecutionOut, ExecuteRequest, AdHocExecuteRequest,
    ValidationResponse, ValidationErrorItem, TemplateOut,
    SystemStatsOut
)
from .nodes.registry import get_all_node_definitions
from .engine import WorkflowEngine
from .templates import get_templates, get_template_by_id

# Create tables
Base.metadata.create_all(bind=engine)

workflow_engine = WorkflowEngine()


def _persist_execution_record(
    db: Session,
    outcome: Dict[str, Any],
    workflow_id: Optional[str],
    workflow_name: str,
    triggered_by: str = "MANUAL"
) -> Execution:
    """Helper to store Execution and individual ExecutionStep records in SQLite."""
    now = datetime.now(timezone.utc)
    execution_record = Execution(
        workflow_id=workflow_id,
        workflow_name=workflow_name,
        status=outcome["status"],
        triggered_by=triggered_by,
        started_at=datetime.fromisoformat(outcome.get("started_at", now.isoformat())),
        completed_at=datetime.fromisoformat(outcome.get("completed_at", now.isoformat())),
        duration_ms=outcome["duration_ms"],
        error=outcome["error"],
        logs=outcome["logs"],
        node_results=outcome["node_results"],
        execution_order=outcome["execution_order"]
    )
    db.add(execution_record)
    db.flush()  # populate execution_record.id

    # Persist steps
    node_results = outcome.get("node_results", {})
    for node_id in outcome.get("execution_order", []):
        res = node_results.get(node_id)
        if not res:
            continue
        step = ExecutionStep(
            execution_id=execution_record.id,
            node_id=node_id,
            node_type=res.get("node_type", "unknown"),
            node_name=res.get("node_name", node_id),
            status=res.get("status", "COMPLETED"),
            input_json=res.get("inputs", {}),
            output_json=res.get("output"),
            error_message=res.get("error"),
            started_at=datetime.fromisoformat(res.get("started_at", now.isoformat())) if res.get("started_at") else now,
            finished_at=datetime.fromisoformat(res.get("finished_at", now.isoformat())) if res.get("finished_at") else now,
            duration_ms=res.get("duration_ms", 0.0)
        )
        db.add(step)

    db.commit()
    db.refresh(execution_record)
    return execution_record


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    # Seed default sample workflow if empty
    db = next(get_db())
    try:
        count = db.query(Workflow).count()
        if count == 0:
            default_template = get_template_by_id("text-processor") or get_template_by_id("sentiment-feedback-pipeline")
            if default_template:
                sample_wf = Workflow(
                    name=default_template["name"],
                    description=default_template["description"],
                    category=default_template["category"],
                    tags=default_template["tags"],
                    nodes=default_template["nodes"],
                    edges=default_template["edges"],
                    viewport={"x": 0, "y": 0, "zoom": 1.0},
                    is_active=True
                )
                db.add(sample_wf)
                db.commit()
    finally:
        db.close()
    yield


app = FastAPI(
    title="NodeFlow API",
    description="Visual Workflow Automation Platform Engine & Storage",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Vite local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "NodeFlow Visual Workflow Automation Platform",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# -------------------------------------------------------------
# Summary Statistics
# -------------------------------------------------------------
@app.get("/api/stats", response_model=SystemStatsOut)
def get_system_stats(db: Session = Depends(get_db)):
    """Computes real metrics based on actual database contents."""
    total_wf = db.query(Workflow).count()
    total_exec = db.query(Execution).count()
    successful = db.query(Execution).filter(Execution.status == "COMPLETED").count()
    failed = db.query(Execution).filter(Execution.status == "FAILED").count()

    success_rate = round((successful / total_exec * 100.0), 1) if total_exec > 0 else 100.0
    avg_dur = db.query(func.avg(Execution.duration_ms)).scalar() or 0.0

    return SystemStatsOut(
        total_workflows=total_wf,
        total_executions=total_exec,
        successful_executions=successful,
        failed_executions=failed,
        success_rate_pct=success_rate,
        avg_duration_ms=round(avg_dur, 2)
    )


# -------------------------------------------------------------
# Node Catalog
# -------------------------------------------------------------
@app.get("/api/nodes/definitions")
def get_node_definitions():
    """Returns the schema catalog for all registered node types."""
    return get_all_node_definitions()


# -------------------------------------------------------------
# Workflow Templates
# -------------------------------------------------------------
@app.get("/api/templates", response_model=List[TemplateOut])
def list_templates():
    return get_templates()


@app.get("/api/templates/{template_id}", response_model=TemplateOut)
def get_template(template_id: str):
    tpl = get_template_by_id(template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found.")
    return tpl


@app.post("/api/templates/{template_id}/instantiate", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
def instantiate_template(template_id: str, db: Session = Depends(get_db)):
    tpl = get_template_by_id(template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found.")

    new_wf = Workflow(
        name=f"{tpl['name']} (from template)",
        description=tpl["description"],
        category=tpl["category"],
        tags=tpl.get("tags", []),
        nodes=tpl["nodes"],
        edges=tpl["edges"],
        viewport={"x": 0, "y": 0, "zoom": 1.0},
        is_active=True
    )
    db.add(new_wf)
    db.commit()
    db.refresh(new_wf)
    return new_wf


# -------------------------------------------------------------
# Workflow CRUD & Duplicate
# -------------------------------------------------------------
@app.get("/api/workflows", response_model=List[WorkflowOut])
def get_workflows(
    q: Optional[str] = Query(None, description="Search term for workflow name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    query = db.query(Workflow)
    if q:
        query = query.filter(
            (Workflow.name.ilike(f"%{q}%")) | (Workflow.description.ilike(f"%{q}%"))
        )
    if category and category != "All":
        query = query.filter(Workflow.category == category)

    return query.order_by(Workflow.updated_at.desc()).all()


@app.post("/api/workflows", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
def create_workflow(wf_in: WorkflowCreate, db: Session = Depends(get_db)):
    wf = Workflow(
        name=wf_in.name,
        description=wf_in.description,
        category=wf_in.category or "General",
        tags=wf_in.tags,
        nodes=wf_in.nodes,
        edges=wf_in.edges,
        viewport=wf_in.viewport or {},
        is_active=wf_in.is_active
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf


@app.get("/api/workflows/{workflow_id}", response_model=WorkflowOut)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    return wf


@app.put("/api/workflows/{workflow_id}", response_model=WorkflowOut)
def update_workflow(workflow_id: str, wf_update: WorkflowUpdate, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")

    update_data = wf_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(wf, field, val)

    wf.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wf)
    return wf


@app.delete("/api/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")

    db.delete(wf)
    db.commit()
    return None


@app.post("/api/workflows/{workflow_id}/duplicate", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
def duplicate_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Clones an existing workflow with a (Copy) suffix."""
    orig = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Workflow to duplicate not found.")

    duplicated = Workflow(
        name=f"{orig.name} (Copy)",
        description=orig.description,
        category=orig.category,
        tags=list(orig.tags or []),
        nodes=list(orig.nodes or []),
        edges=list(orig.edges or []),
        viewport=dict(orig.viewport or {}),
        is_active=orig.is_active
    )
    db.add(duplicated)
    db.commit()
    db.refresh(duplicated)
    return duplicated


# -------------------------------------------------------------
# Graph Validation & Execution
# -------------------------------------------------------------
@app.post("/api/workflows/validate", response_model=ValidationResponse)
def validate_workflow(request: AdHocExecuteRequest):
    """Validates triggers, cycle detection, edge connections, and node configurations."""
    res = workflow_engine.validate_workflow(request.nodes, request.edges)
    return ValidationResponse(
        valid=res["valid"],
        errors=[ValidationErrorItem(**e) for e in res["errors"]],
        warnings=[ValidationErrorItem(**w) for w in res["warnings"]],
        node_count=res["node_count"],
        edge_count=res["edge_count"]
    )


@app.post("/api/workflows/execute-adhoc", response_model=ExecutionOut)
def execute_adhoc_workflow(request: AdHocExecuteRequest, db: Session = Depends(get_db)):
    """Executes a workflow graph directly from the visual canvas without requiring prior save."""
    outcome = workflow_engine.execute(
        nodes=request.nodes,
        edges=request.edges,
        trigger_payload=request.trigger_payload
    )

    execution_record = _persist_execution_record(
        db=db,
        outcome=outcome,
        workflow_id=None,
        workflow_name=request.workflow_name or "Ad-Hoc Workflow",
        triggered_by="TEST"
    )
    return execution_record


@app.post("/api/workflows/{workflow_id}/execute", response_model=ExecutionOut)
def execute_saved_workflow(workflow_id: str, req: ExecuteRequest = None, db: Session = Depends(get_db)):
    """Executes a saved workflow by ID."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")

    trigger_payload = req.trigger_payload if req else {}
    outcome = workflow_engine.execute(
        nodes=wf.nodes,
        edges=wf.edges,
        trigger_payload=trigger_payload,
        workflow_id=wf.id
    )

    execution_record = _persist_execution_record(
        db=db,
        outcome=outcome,
        workflow_id=wf.id,
        workflow_name=wf.name,
        triggered_by="MANUAL"
    )
    return execution_record


# -------------------------------------------------------------
# Execution History & Cancellation
# -------------------------------------------------------------
@app.get("/api/executions", response_model=List[ExecutionOut])
def list_executions(
    workflow_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Execution)
    if workflow_id:
        query = query.filter(Execution.workflow_id == workflow_id)
    if status and status != "ALL":
        query = query.filter(Execution.status == status)

    return query.order_by(Execution.started_at.desc()).limit(limit).all()


@app.get("/api/executions/{execution_id}", response_model=ExecutionOut)
def get_execution(execution_id: str, db: Session = Depends(get_db)):
    record = db.query(Execution).filter(Execution.id == execution_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Execution record not found.")
    return record


@app.post("/api/executions/{execution_id}/cancel", response_model=ExecutionOut)
def cancel_execution(execution_id: str, db: Session = Depends(get_db)):
    """Safely cancels a queued or running execution."""
    record = db.query(Execution).filter(Execution.id == execution_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Execution record not found.")

    if record.status in ("QUEUED", "RUNNING"):
        record.status = "CANCELLED"
        record.completed_at = datetime.now(timezone.utc)
        record.error = "Execution was cancelled by the user."
        db.commit()
        db.refresh(record)

    return record


@app.delete("/api/executions/{execution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_execution(execution_id: str, db: Session = Depends(get_db)):
    record = db.query(Execution).filter(Execution.id == execution_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Execution record not found.")
    db.delete(record)
    db.commit()
    return None


@app.delete("/api/executions", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_executions(db: Session = Depends(get_db)):
    db.query(ExecutionStep).delete()
    db.query(Execution).delete()
    db.commit()
    return None
