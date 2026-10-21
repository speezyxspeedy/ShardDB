from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TicketStatus, TicketPriority
from app.schemas import (
    TicketCreate,
    TicketUpdate,
    TicketStatusUpdate,
    TicketPriorityUpdate,
    TicketAssignUpdate,
    TicketResponse,
    TicketDetailResponse,
    PaginatedTicketsResponse,
    ActivityResponse,
)
from app.services import ticket_service

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    """Create a new support ticket."""
    ticket = ticket_service.create_ticket(db, ticket_in)
    return ticket


@router.get("", response_model=PaginatedTicketsResponse)
def list_tickets(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search ticket number, title, description, or customer"),
    status: Optional[str] = Query(None, description="Filter by ticket status"),
    priority: Optional[str] = Query(None, description="Filter by ticket priority"),
    category: Optional[str] = Query(None, description="Filter by ticket category"),
    agent_id: Optional[int] = Query(None, description="Filter by assigned agent ID (-1 for unassigned)"),
    customer_email: Optional[str] = Query(None, description="Filter by customer email"),
    sort_by: str = Query("newest", pattern="^(newest|oldest|priority|updated)$", description="Sort option"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated tickets with filtering and search."""
    items, total = ticket_service.list_tickets(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        status_filter=status,
        priority_filter=priority,
        category_filter=category,
        agent_id_filter=agent_id,
        customer_email_filter=customer_email,
        sort_by=sort_by,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedTicketsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Retrieve full ticket details by internal ID."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    # Calculate message count
    response_dict = {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
        "assigned_agent_id": ticket.assigned_agent_id,
        "assigned_agent": ticket.assigned_agent,
        "due_date": ticket.due_date,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "message_count": len(ticket.messages),
        "messages": ticket.messages,
        "activities": ticket.activities,
    }
    return response_dict


@router.get("/number/{ticket_number}", response_model=TicketDetailResponse)
def get_ticket_by_number(ticket_number: str, db: Session = Depends(get_db)):
    """Retrieve ticket details by public ticket number (e.g. HDX-1001)."""
    ticket = ticket_service.get_ticket_by_number(db, ticket_number)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket '{ticket_number}' not found")
    
    response_dict = {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
        "assigned_agent_id": ticket.assigned_agent_id,
        "assigned_agent": ticket.assigned_agent,
        "due_date": ticket.due_date,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "message_count": len(ticket.messages),
        "messages": ticket.messages,
        "activities": ticket.activities,
    }
    return response_dict


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    actor_name: str = Query("Agent"),
    actor_role: str = Query("agent"),
    db: Session = Depends(get_db),
):
    """Update ticket attributes."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    updated = ticket_service.update_ticket(db, ticket, ticket_in, actor_name=actor_name, actor_role=actor_role)
    return updated


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_in: TicketStatusUpdate,
    db: Session = Depends(get_db),
):
    """Change ticket status."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    updated = ticket_service.update_status(
        db,
        ticket,
        new_status=status_in.status,
        actor_name=status_in.actor_name,
        actor_role=status_in.actor_role,
    )
    return updated


@router.patch("/{ticket_id}/priority", response_model=TicketResponse)
def update_ticket_priority(
    ticket_id: int,
    priority_in: TicketPriorityUpdate,
    db: Session = Depends(get_db),
):
    """Change ticket priority."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    updated = ticket_service.update_priority(
        db,
        ticket,
        new_priority=priority_in.priority,
        actor_name=priority_in.actor_name,
        actor_role=priority_in.actor_role,
    )
    return updated


@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    assign_in: TicketAssignUpdate,
    db: Session = Depends(get_db),
):
    """Assign or unassign an agent for a ticket."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    updated = ticket_service.assign_agent(
        db,
        ticket,
        agent_id=assign_in.assigned_agent_id,
        actor_name=assign_in.actor_name,
        actor_role=assign_in.actor_role,
    )
    return updated


@router.post("/{ticket_id}/resolve", response_model=TicketResponse)
def resolve_ticket(
    ticket_id: int,
    actor_name: str = Query("Agent"),
    actor_role: str = Query("agent"),
    db: Session = Depends(get_db),
):
    """Resolve a ticket."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    return ticket_service.update_status(
        db, ticket, new_status=TicketStatus.RESOLVED, actor_name=actor_name, actor_role=actor_role
    )


@router.post("/{ticket_id}/reopen", response_model=TicketResponse)
def reopen_ticket(
    ticket_id: int,
    actor_name: str = Query("Agent"),
    actor_role: str = Query("agent"),
    db: Session = Depends(get_db),
):
    """Reopen a ticket."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    return ticket_service.update_status(
        db, ticket, new_status=TicketStatus.OPEN, actor_name=actor_name, actor_role=actor_role
    )


@router.post("/{ticket_id}/close", response_model=TicketResponse)
def close_ticket(
    ticket_id: int,
    actor_name: str = Query("Agent"),
    actor_role: str = Query("agent"),
    db: Session = Depends(get_db),
):
    """Close a ticket."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    return ticket_service.update_status(
        db, ticket, new_status=TicketStatus.CLOSED, actor_name=actor_name, actor_role=actor_role
    )


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Delete a ticket with destructive confirmation."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    
    ticket_service.delete_ticket(db, ticket)
    return None
