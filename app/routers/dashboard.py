from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DashboardStatsResponse, ActivityResponse
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve real-time metrics, status and priority distribution, and activity."""
    return dashboard_service.get_dashboard_metrics(db)


@router.get("/recent-activity", response_model=List[ActivityResponse])
def get_recent_activity(limit: int = 15, db: Session = Depends(get_db)):
    """Retrieve the latest ticket activities."""
    metrics = dashboard_service.get_dashboard_metrics(db)
    return metrics.recent_activities[:limit]
