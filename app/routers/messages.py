from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MessageCreate, MessageResponse
from app.services import ticket_service

router = APIRouter(prefix="/api/tickets/{ticket_id}/messages", tags=["Messages"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def add_message(
    ticket_id: int,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
):
    """Add a public reply or internal note to a ticket."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found",
        )

    return ticket_service.add_ticket_message(db, ticket, message_in)


@router.get("", response_model=List[MessageResponse])
def get_messages(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve all messages for a ticket in chronological order."""
    ticket = ticket_service.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found",
        )

    return ticket.messages
