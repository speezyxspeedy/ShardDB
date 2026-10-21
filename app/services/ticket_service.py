from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc, case, func
from fastapi import HTTPException, status

from app.models import (
    Ticket,
    TicketMessage,
    TicketActivity,
    Agent,
    TicketCounter,
    TicketPriority,
    TicketStatus,
    MessageType,
    utcnow,
)
from app.schemas import (
    TicketCreate,
    TicketUpdate,
    MessageCreate,
)


def generate_ticket_number(db: Session) -> str:
    """Safely generate a consecutive unique ticket number (e.g. HDX-1001)."""
    counter = db.query(TicketCounter).with_for_update().first() if db.bind.name != "sqlite" else db.query(TicketCounter).first()
    if not counter:
        # Determine highest existing ticket number or start at 1001
        last_ticket = db.query(Ticket).order_by(desc(Ticket.id)).first()
        start_val = 1001
        if last_ticket and last_ticket.ticket_number.startswith("HDX-"):
            try:
                start_val = max(1001, int(last_ticket.ticket_number.replace("HDX-", "")) + 1)
            except ValueError:
                start_val = 1001
        counter = TicketCounter(id=1, next_number=start_val)
        db.add(counter)
        db.flush()

    ticket_num = f"HDX-{counter.next_number}"
    counter.next_number += 1
    db.flush()
    return ticket_num


def create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket:
    """Create a new ticket and record creation activity."""
    # Validate assigned agent if specified
    if ticket_in.assigned_agent_id:
        agent = db.query(Agent).filter(Agent.id == ticket_in.assigned_agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Agent with ID {ticket_in.assigned_agent_id} does not exist"
            )

    ticket_number = generate_ticket_number(db)
    now = utcnow()

    new_ticket = Ticket(
        ticket_number=ticket_number,
        title=ticket_in.title,
        description=ticket_in.description,
        category=ticket_in.category,
        priority=ticket_in.priority.value,
        status=TicketStatus.OPEN.value,
        customer_name=ticket_in.customer_name,
        customer_email=ticket_in.customer_email,
        assigned_agent_id=ticket_in.assigned_agent_id,
        due_date=ticket_in.due_date,
        created_at=now,
        updated_at=now,
    )
    db.add(new_ticket)
    db.flush()

    # Initial activity log
    activity = TicketActivity(
        ticket_id=new_ticket.id,
        actor_name=ticket_in.customer_name,
        actor_role="customer",
        action_type="created",
        details=f"Ticket {ticket_number} created with {new_ticket.priority} priority in category '{new_ticket.category}'",
        created_at=now,
    )
    db.add(activity)

    if ticket_in.assigned_agent_id:
        agent_obj = db.query(Agent).filter(Agent.id == ticket_in.assigned_agent_id).first()
        agent_name = agent_obj.name if agent_obj else f"ID {ticket_in.assigned_agent_id}"
        assign_act = TicketActivity(
            ticket_id=new_ticket.id,
            actor_name="System",
            actor_role="system",
            action_type="assigned",
            details=f"Initial assignment to agent {agent_name}",
            created_at=now,
        )
        db.add(assign_act)

    db.commit()
    db.refresh(new_ticket)
    return new_ticket


def get_ticket_by_id(db: Session, ticket_id: int) -> Optional[Ticket]:
    """Retrieve ticket by ID with eager loading for assigned agent, messages, and activity."""
    return (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assigned_agent),
            joinedload(Ticket.messages),
            joinedload(Ticket.activities),
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )


def get_ticket_by_number(db: Session, ticket_number: str) -> Optional[Ticket]:
    """Retrieve ticket by unique ticket number (e.g. HDX-1001)."""
    return (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assigned_agent),
            joinedload(Ticket.messages),
            joinedload(Ticket.activities),
        )
        .filter(Ticket.ticket_number == ticket_number.upper().strip())
        .first()
    )


def list_tickets(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    agent_id_filter: Optional[int] = None,
    customer_email_filter: Optional[str] = None,
    sort_by: str = "newest",
) -> Tuple[List[dict], int]:
    """List tickets with filtering, full-text search, sorting, and pagination."""
    # Base query
    query = db.query(Ticket).options(joinedload(Ticket.assigned_agent))

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.ticket_number.ilike(search_term),
                Ticket.title.ilike(search_term),
                Ticket.description.ilike(search_term),
                Ticket.customer_name.ilike(search_term),
                Ticket.customer_email.ilike(search_term),
            )
        )

    # Status filter
    if status_filter and status_filter.strip():
        query = query.filter(Ticket.status == status_filter.strip())

    # Priority filter
    if priority_filter and priority_filter.strip():
        query = query.filter(Ticket.priority == priority_filter.strip())

    # Category filter
    if category_filter and category_filter.strip():
        query = query.filter(Ticket.category == category_filter.strip())

    # Agent ID filter (-1 can mean unassigned)
    if agent_id_filter is not None:
        if agent_id_filter == 0 or agent_id_filter == -1:
            query = query.filter(Ticket.assigned_agent_id.is_(None))
        else:
            query = query.filter(Ticket.assigned_agent_id == agent_id_filter)

    # Customer email filter
    if customer_email_filter and customer_email_filter.strip():
        query = query.filter(Ticket.customer_email.ilike(customer_email_filter.strip()))

    # Total count
    total = query.count()

    # Sorting
    if sort_by == "oldest":
        query = query.order_by(asc(Ticket.created_at))
    elif sort_by == "updated":
        query = query.order_by(desc(Ticket.updated_at))
    elif sort_by == "priority":
        # Custom priority ordering: Urgent (4), High (3), Medium (2), Low (1)
        priority_order = case(
            (Ticket.priority == "Urgent", 4),
            (Ticket.priority == "High", 3),
            (Ticket.priority == "Medium", 2),
            (Ticket.priority == "Low", 1),
            else_=0,
        )
        query = query.order_by(desc(priority_order), desc(Ticket.created_at))
    else:  # newest default
        query = query.order_by(desc(Ticket.created_at))

    # Pagination limits
    safe_page = max(1, page)
    safe_size = max(1, min(100, page_size))
    offset = (safe_page - 1) * safe_size

    tickets = query.offset(offset).limit(safe_size).all()

    # Attach message count
    ticket_ids = [t.id for t in tickets]
    counts_map = {}
    if ticket_ids:
        counts = (
            db.query(TicketMessage.ticket_id, func.count(TicketMessage.id))
            .filter(TicketMessage.ticket_id.in_(ticket_ids))
            .group_by(TicketMessage.ticket_id)
            .all()
        )
        counts_map = {cid: cnt for cid, cnt in counts}

    results = []
    for t in tickets:
        t_dict = {
            "id": t.id,
            "ticket_number": t.ticket_number,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "customer_name": t.customer_name,
            "customer_email": t.customer_email,
            "assigned_agent_id": t.assigned_agent_id,
            "assigned_agent": t.assigned_agent,
            "due_date": t.due_date,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "message_count": counts_map.get(t.id, 0),
        }
        results.append(t_dict)

    return results, total


def update_ticket(
    db: Session,
    ticket: Ticket,
    ticket_update: TicketUpdate,
    actor_name: str = "Agent",
    actor_role: str = "agent",
) -> Ticket:
    """Update ticket properties and log activity."""
    changes = []
    now = utcnow()

    if ticket_update.title and ticket_update.title != ticket.title:
        changes.append(f"title changed to '{ticket_update.title}'")
        ticket.title = ticket_update.title

    if ticket_update.description and ticket_update.description != ticket.description:
        changes.append("description updated")
        ticket.description = ticket_update.description

    if ticket_update.category and ticket_update.category != ticket.category:
        changes.append(f"category changed from '{ticket.category}' to '{ticket_update.category}'")
        ticket.category = ticket_update.category

    if ticket_update.priority and ticket_update.priority.value != ticket.priority:
        changes.append(f"priority changed from '{ticket.priority}' to '{ticket_update.priority.value}'")
        ticket.priority = ticket_update.priority.value

    if ticket_update.status and ticket_update.status.value != ticket.status:
        changes.append(f"status changed from '{ticket.status}' to '{ticket_update.status.value}'")
        ticket.status = ticket_update.status.value

    if ticket_update.due_date != ticket.due_date:
        changes.append("due date modified")
        ticket.due_date = ticket_update.due_date

    if ticket_update.assigned_agent_id is not None and ticket_update.assigned_agent_id != ticket.assigned_agent_id:
        if ticket_update.assigned_agent_id == 0:
            changes.append("ticket unassigned")
            ticket.assigned_agent_id = None
        else:
            agent = db.query(Agent).filter(Agent.id == ticket_update.assigned_agent_id).first()
            if not agent:
                raise HTTPException(status_code=400, detail="Assigned agent does not exist")
            changes.append(f"assigned to {agent.name}")
            ticket.assigned_agent_id = agent.id

    if changes:
        ticket.updated_at = now
        activity = TicketActivity(
            ticket_id=ticket.id,
            actor_name=actor_name,
            actor_role=actor_role,
            action_type="updated",
            details="; ".join(changes),
            created_at=now,
        )
        db.add(activity)
        db.commit()
        db.refresh(ticket)

    return ticket


def update_status(
    db: Session,
    ticket: Ticket,
    new_status: TicketStatus,
    actor_name: str = "Agent",
    actor_role: str = "agent",
) -> Ticket:
    """Update ticket status and log appropriate audit activity."""
    old_status = ticket.status
    if old_status == new_status.value:
        return ticket

    now = utcnow()
    ticket.status = new_status.value
    ticket.updated_at = now

    action_type = "status_changed"
    if new_status == TicketStatus.RESOLVED:
        action_type = "resolved"
    elif new_status == TicketStatus.CLOSED:
        action_type = "closed"
    elif old_status in (TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value) and new_status == TicketStatus.OPEN:
        action_type = "reopened"

    activity = TicketActivity(
        ticket_id=ticket.id,
        actor_name=actor_name,
        actor_role=actor_role,
        action_type=action_type,
        details=f"Status changed from '{old_status}' to '{new_status.value}'",
        created_at=now,
    )
    db.add(activity)
    db.commit()
    db.refresh(ticket)
    return ticket


def update_priority(
    db: Session,
    ticket: Ticket,
    new_priority: TicketPriority,
    actor_name: str = "Agent",
    actor_role: str = "agent",
) -> Ticket:
    """Update ticket priority and log audit activity."""
    old_priority = ticket.priority
    if old_priority == new_priority.value:
        return ticket

    now = utcnow()
    ticket.priority = new_priority.value
    ticket.updated_at = now

    activity = TicketActivity(
        ticket_id=ticket.id,
        actor_name=actor_name,
        actor_role=actor_role,
        action_type="priority_changed",
        details=f"Priority changed from '{old_priority}' to '{new_priority.value}'",
        created_at=now,
    )
    db.add(activity)
    db.commit()
    db.refresh(ticket)
    return ticket


def assign_agent(
    db: Session,
    ticket: Ticket,
    agent_id: Optional[int],
    actor_name: str = "Agent",
    actor_role: str = "agent",
) -> Ticket:
    """Assign or reassign ticket to an agent, or unassign if agent_id is None or 0."""
    now = utcnow()
    if agent_id in (None, 0):
        if ticket.assigned_agent_id is None:
            return ticket
        ticket.assigned_agent_id = None
        ticket.updated_at = now
        activity = TicketActivity(
            ticket_id=ticket.id,
            actor_name=actor_name,
            actor_role=actor_role,
            action_type="unassigned",
            details="Ticket unassigned",
            created_at=now,
        )
    else:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=400, detail=f"Agent with ID {agent_id} does not exist")
        if ticket.assigned_agent_id == agent.id:
            return ticket
        old_agent_id = ticket.assigned_agent_id
        ticket.assigned_agent_id = agent.id
        ticket.updated_at = now
        action_type = "reassigned" if old_agent_id else "assigned"
        activity = TicketActivity(
            ticket_id=ticket.id,
            actor_name=actor_name,
            actor_role=actor_role,
            action_type=action_type,
            details=f"Assigned ticket to {agent.name} ({agent.role})",
            created_at=now,
        )

    db.add(activity)
    db.commit()
    db.refresh(ticket)
    return ticket


def add_ticket_message(
    db: Session,
    ticket: Ticket,
    msg_in: MessageCreate,
) -> TicketMessage:
    """Add a public reply or internal note to a ticket."""
    # Customers can submit public replies only
    if msg_in.author_role.lower() == "customer" and msg_in.message_type == MessageType.INTERNAL_NOTE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customers cannot post internal notes"
        )

    now = utcnow()
    message = TicketMessage(
        ticket_id=ticket.id,
        author_name=msg_in.author_name,
        author_email=msg_in.author_email,
        author_role=msg_in.author_role.lower(),
        message_type=msg_in.message_type.value,
        content=msg_in.content,
        created_at=now,
    )
    db.add(message)

    # Activity description
    if msg_in.message_type == MessageType.INTERNAL_NOTE:
        action_desc = f"{msg_in.author_name} added an internal note"
        action_type = "note_added"
    else:
        action_desc = f"{msg_in.author_name} posted a reply"
        action_type = "reply_added"

    activity = TicketActivity(
        ticket_id=ticket.id,
        actor_name=msg_in.author_name,
        actor_role=msg_in.author_role.lower(),
        action_type=action_type,
        details=action_desc,
        created_at=now,
    )
    db.add(activity)

    # Automatic status workflow:
    # If customer replies to a "Waiting for Customer" or "Resolved" ticket, update status to "In Progress"
    if msg_in.author_role.lower() == "customer":
        if ticket.status in (TicketStatus.WAITING_FOR_CUSTOMER.value, TicketStatus.RESOLVED.value):
            ticket.status = TicketStatus.IN_PROGRESS.value
            status_activity = TicketActivity(
                ticket_id=ticket.id,
                actor_name="System",
                actor_role="system",
                action_type="status_changed",
                details="Status automatically changed to 'In Progress' following customer reply",
                created_at=now,
            )
            db.add(status_activity)

    ticket.updated_at = now
    db.commit()
    db.refresh(message)
    return message


def delete_ticket(db: Session, ticket: Ticket) -> None:
    """Delete a ticket and cascading messages/activity (for destructive confirmation)."""
    db.delete(ticket)
    db.commit()
