from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
    Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class TicketPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class TicketStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    WAITING_FOR_CUSTOMER = "Waiting for Customer"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class MessageType(str, enum.Enum):
    PUBLIC = "public"
    INTERNAL_NOTE = "internal_note"


class TicketCounter(Base):
    __tablename__ = "ticket_counters"

    id = Column(Integer, primary_key=True, default=1)
    next_number = Column(Integer, nullable=False, default=1001)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False, default="Support Specialist")
    avatar_color = Column(String(20), nullable=False, default="#2563eb")
    is_active = Column(Boolean, nullable=False, default=True)

    tickets = relationship("Ticket", back_populates="assigned_agent")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    priority = Column(String(20), nullable=False, default=TicketPriority.MEDIUM.value, index=True)
    status = Column(String(30), nullable=False, default=TicketStatus.OPEN.value, index=True)
    customer_name = Column(String(100), nullable=False, index=True)
    customer_email = Column(String(100), nullable=False, index=True)
    assigned_agent_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False, index=True)

    assigned_agent = relationship("Agent", back_populates="tickets")
    messages = relationship(
        "TicketMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at.asc()",
    )
    activities = relationship(
        "TicketActivity",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketActivity.created_at.asc()",
    )

    __table_args__ = (
        Index("ix_tickets_status_priority", "status", "priority"),
    )


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(100), nullable=False)
    author_email = Column(String(100), nullable=False)
    author_role = Column(String(20), nullable=False)  # "customer" or "agent"
    message_type = Column(String(20), nullable=False, default=MessageType.PUBLIC.value)  # "public" or "internal_note"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)

    ticket = relationship("Ticket", back_populates="messages")


class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_name = Column(String(100), nullable=False)
    actor_role = Column(String(20), nullable=False)  # "customer", "agent", "system"
    action_type = Column(String(50), nullable=False)  # "created", "status_changed", "priority_changed", etc.
    details = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)

    ticket = relationship("Ticket", back_populates="activities")
