from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.models import TicketPriority, TicketStatus, MessageType


class AgentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = Field(default="Support Specialist", max_length=50)
    avatar_color: str = Field(default="#2563eb", max_length=20)
    is_active: bool = True


class AgentCreate(AgentBase):
    pass


class AgentResponse(AgentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    author_name: str = Field(..., min_length=2, max_length=100)
    author_email: EmailStr
    author_role: str = Field(default="customer")  # "customer" or "agent"
    message_type: MessageType = Field(default=MessageType.PUBLIC)
    content: str = Field(..., min_length=1, max_length=5000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty or whitespace only")
        return stripped

    @field_validator("author_role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        role = v.lower().strip()
        if role not in ("customer", "agent"):
            raise ValueError("author_role must be either 'customer' or 'agent'")
        return role


class MessageResponse(BaseModel):
    id: int
    ticket_id: int
    author_name: str
    author_email: str
    author_role: str
    message_type: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ActivityResponse(BaseModel):
    id: int
    ticket_id: int
    actor_name: str
    actor_role: str
    action_type: str
    details: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TicketBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5, max_length=5000)
    category: str = Field(..., min_length=2, max_length=50)
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM)
    due_date: Optional[datetime] = None

    @field_validator("title", "description", "category")
    @classmethod
    def strip_text(cls, v: str) -> str:
        if isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("Field cannot be empty or blank")
            return stripped
        return v


class TicketCreate(TicketBase):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_email: EmailStr
    assigned_agent_id: Optional[int] = None

    @field_validator("customer_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("Customer name must be at least 2 characters")
        return stripped


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=5, max_length=5000)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_agent_id: Optional[int] = None
    due_date: Optional[datetime] = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    actor_name: str = Field(default="Agent")
    actor_role: str = Field(default="agent")


class TicketPriorityUpdate(BaseModel):
    priority: TicketPriority
    actor_name: str = Field(default="Agent")
    actor_role: str = Field(default="agent")


class TicketAssignUpdate(BaseModel):
    assigned_agent_id: Optional[int] = None
    actor_name: str = Field(default="Agent")
    actor_role: str = Field(default="agent")


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    customer_name: str
    customer_email: str
    assigned_agent_id: Optional[int]
    assigned_agent: Optional[AgentResponse] = None
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class TicketDetailResponse(TicketResponse):
    messages: List[MessageResponse] = []
    activities: List[ActivityResponse] = []
    model_config = ConfigDict(from_attributes=True)


class PaginatedTicketsResponse(BaseModel):
    items: List[TicketResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AgentTicketCount(BaseModel):
    agent_id: Optional[int]
    agent_name: str
    ticket_count: int


class DateCount(BaseModel):
    date: str
    count: int


class DashboardStatsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    waiting_tickets: int
    resolved_tickets: int
    closed_tickets: int
    urgent_priority: int
    high_priority: int
    medium_priority: int
    low_priority: int
    status_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    agent_ticket_counts: List[AgentTicketCount]
    created_over_time: List[DateCount]
    recent_activities: List[ActivityResponse]
