from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models import (
    Ticket,
    Agent,
    TicketActivity,
    TicketStatus,
    TicketPriority,
    utcnow,
)
from app.schemas import (
    DashboardStatsResponse,
    AgentTicketCount,
    DateCount,
    ActivityResponse,
)


def get_dashboard_metrics(db: Session) -> DashboardStatsResponse:
    """Calculate all real-time dashboard statistics from database records."""
    total_tickets = db.query(Ticket).count()

    # Status breakdown
    status_rows = (
        db.query(Ticket.status, func.count(Ticket.id))
        .group_by(Ticket.status)
        .all()
    )
    status_dict = {
        TicketStatus.OPEN.value: 0,
        TicketStatus.IN_PROGRESS.value: 0,
        TicketStatus.WAITING_FOR_CUSTOMER.value: 0,
        TicketStatus.RESOLVED.value: 0,
        TicketStatus.CLOSED.value: 0,
    }
    for st, count in status_rows:
        status_dict[st] = count

    # Priority breakdown
    priority_rows = (
        db.query(Ticket.priority, func.count(Ticket.id))
        .group_by(Ticket.priority)
        .all()
    )
    priority_dict = {
        TicketPriority.URGENT.value: 0,
        TicketPriority.HIGH.value: 0,
        TicketPriority.MEDIUM.value: 0,
        TicketPriority.LOW.value: 0,
    }
    for pr, count in priority_rows:
        priority_dict[pr] = count

    # Category breakdown
    category_rows = (
        db.query(Ticket.category, func.count(Ticket.id))
        .group_by(Ticket.category)
        .all()
    )
    category_dict = {cat: count for cat, count in category_rows}

    # Tickets per Agent
    agents = db.query(Agent).filter(Agent.is_active == True).all()
    agent_counts: List[AgentTicketCount] = []
    
    # Unassigned count
    unassigned_count = db.query(Ticket).filter(Ticket.assigned_agent_id.is_(None)).count()
    agent_counts.append(AgentTicketCount(
        agent_id=None,
        agent_name="Unassigned",
        ticket_count=unassigned_count,
    ))

    for agent in agents:
        agent_ticket_cnt = (
            db.query(Ticket)
            .filter(Ticket.assigned_agent_id == agent.id)
            .count()
        )
        agent_counts.append(AgentTicketCount(
            agent_id=agent.id,
            agent_name=agent.name,
            ticket_count=agent_ticket_cnt,
        ))

    # Tickets created over past 7 days
    now = utcnow()
    days_data: List[DateCount] = []
    # Build a 7-day date list
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        date_str = day_date.strftime("%Y-%m-%d")
        
        # SQLite compatible date filtering
        day_start = datetime(day_date.year, day_date.month, day_date.day, 0, 0, 0, tzinfo=timezone.utc)
        day_end = datetime(day_date.year, day_date.month, day_date.day, 23, 59, 59, tzinfo=timezone.utc)
        
        cnt = (
            db.query(Ticket)
            .filter(Ticket.created_at >= day_start, Ticket.created_at <= day_end)
            .count()
        )
        days_data.append(DateCount(date=date_str, count=cnt))

    # Recent activities (last 12)
    recent_acts = (
        db.query(TicketActivity)
        .order_by(desc(TicketActivity.created_at))
        .limit(12)
        .all()
    )
    recent_act_schemas = [ActivityResponse.model_validate(act) for act in recent_acts]

    return DashboardStatsResponse(
        total_tickets=total_tickets,
        open_tickets=status_dict.get(TicketStatus.OPEN.value, 0),
        in_progress_tickets=status_dict.get(TicketStatus.IN_PROGRESS.value, 0),
        waiting_tickets=status_dict.get(TicketStatus.WAITING_FOR_CUSTOMER.value, 0),
        resolved_tickets=status_dict.get(TicketStatus.RESOLVED.value, 0),
        closed_tickets=status_dict.get(TicketStatus.CLOSED.value, 0),
        urgent_priority=priority_dict.get(TicketPriority.URGENT.value, 0),
        high_priority=priority_dict.get(TicketPriority.HIGH.value, 0),
        medium_priority=priority_dict.get(TicketPriority.MEDIUM.value, 0),
        low_priority=priority_dict.get(TicketPriority.LOW.value, 0),
        status_distribution=status_dict,
        priority_distribution=priority_dict,
        category_distribution=category_dict,
        agent_ticket_counts=agent_counts,
        created_over_time=days_data,
        recent_activities=recent_act_schemas,
    )
