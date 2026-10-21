from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import (
    Base,
    Agent,
    Ticket,
    TicketMessage,
    TicketActivity,
    TicketCounter,
    TicketPriority,
    TicketStatus,
    MessageType,
    utcnow,
)


def seed_database(db: Session):
    """Seed initial demo agents and realistic tickets if database is empty."""
    # Check if agents exist
    if db.query(Agent).count() > 0:
        return

    # Seed demo agents
    agents_data = [
        {"name": "Alex Rivera", "email": "alex@helpdeskx.io", "role": "Senior Support Engineer", "avatar_color": "#2563eb"},
        {"name": "Sarah Chen", "email": "sarah@helpdeskx.io", "role": "Technical Specialist", "avatar_color": "#7c3aed"},
        {"name": "Marcus Vance", "email": "marcus@helpdeskx.io", "role": "Customer Success Lead", "avatar_color": "#059669"},
    ]
    created_agents = []
    for a in agents_data:
        agent = Agent(**a, is_active=True)
        db.add(agent)
        created_agents.append(agent)
    db.flush()

    # Seed ticket counter
    counter = TicketCounter(id=1, next_number=1006)
    db.add(counter)

    now = utcnow()

    # Sample Ticket 1
    t1_time = now - timedelta(days=2, hours=4)
    t1 = Ticket(
        ticket_number="HDX-1001",
        title="Unable to export monthly billing reports to CSV",
        description="Whenever I click 'Export CSV' in the billing section, the screen spins for a few seconds and then displays a 504 Gateway Timeout error. This affects our end-of-month reconciliations.",
        category="Billing",
        priority=TicketPriority.HIGH.value,
        status=TicketStatus.IN_PROGRESS.value,
        customer_name="Jane Doe",
        customer_email="jane@acme.com",
        assigned_agent_id=created_agents[0].id,
        due_date=now + timedelta(days=1),
        created_at=t1_time,
        updated_at=now - timedelta(hours=3),
    )
    db.add(t1)
    db.flush()

    db.add(TicketActivity(
        ticket_id=t1.id,
        actor_name="Jane Doe",
        actor_role="customer",
        action_type="created",
        details="Ticket HDX-1001 created with High priority in category 'Billing'",
        created_at=t1_time,
    ))
    db.add(TicketActivity(
        ticket_id=t1.id,
        actor_name="Alex Rivera",
        actor_role="agent",
        action_type="assigned",
        details="Assigned ticket to Alex Rivera (Senior Support Engineer)",
        created_at=t1_time + timedelta(minutes=15),
    ))
    db.add(TicketActivity(
        ticket_id=t1.id,
        actor_name="Alex Rivera",
        actor_role="agent",
        action_type="status_changed",
        details="Status changed from 'Open' to 'In Progress'",
        created_at=t1_time + timedelta(minutes=20),
    ))

    # Messages for T1
    db.add(TicketMessage(
        ticket_id=t1.id,
        author_name="Jane Doe",
        author_email="jane@acme.com",
        author_role="customer",
        message_type=MessageType.PUBLIC.value,
        content="We need this resolved by Friday for our auditing team. Please let us know if you need error logs from our side.",
        created_at=t1_time + timedelta(minutes=2),
    ))
    db.add(TicketMessage(
        ticket_id=t1.id,
        author_name="Alex Rivera",
        author_email="alex@helpdeskx.io",
        author_role="agent",
        message_type=MessageType.INTERNAL_NOTE.value,
        content="Investigated cloud worker logs. Looks like report generation timeouts on accounts with >10,000 line items. Escalated to backend team to optimize query chunking.",
        created_at=t1_time + timedelta(hours=1),
    ))
    db.add(TicketMessage(
        ticket_id=t1.id,
        author_name="Alex Rivera",
        author_email="alex@helpdeskx.io",
        author_role="agent",
        message_type=MessageType.PUBLIC.value,
        content="Hi Jane, thank you for reaching out! We have identified the bottleneck in processing high-volume export queries. A patch is currently being tested on staging and we expect to deploy it within 24 hours.",
        created_at=t1_time + timedelta(hours=1, minutes=15),
    ))

    # Sample Ticket 2
    t2_time = now - timedelta(hours=18)
    t2 = Ticket(
        ticket_number="HDX-1002",
        title="SSO SAML login failure with Okta integration",
        description="Our team members are unable to log in via Okta SAML 2.0. Users receive 'Invalid Issuer Entity ID' on the redirect callback page.",
        category="Technical",
        priority=TicketPriority.URGENT.value,
        status=TicketStatus.OPEN.value,
        customer_name="John Smith",
        customer_email="john@globallogistics.org",
        assigned_agent_id=created_agents[1].id,
        due_date=now + timedelta(hours=6),
        created_at=t2_time,
        updated_at=t2_time + timedelta(minutes=30),
    )
    db.add(t2)
    db.flush()

    db.add(TicketActivity(
        ticket_id=t2.id,
        actor_name="John Smith",
        actor_role="customer",
        action_type="created",
        details="Ticket HDX-1002 created with Urgent priority in category 'Technical'",
        created_at=t2_time,
    ))
    db.add(TicketActivity(
        ticket_id=t2.id,
        actor_name="Sarah Chen",
        actor_role="agent",
        action_type="assigned",
        details="Assigned ticket to Sarah Chen (Technical Specialist)",
        created_at=t2_time + timedelta(minutes=30),
    ))

    # Sample Ticket 3
    t3_time = now - timedelta(days=3)
    t3 = Ticket(
        ticket_number="HDX-1003",
        title="Requesting custom branding color palette for email alerts",
        description="Could you help us configure custom primary and accent brand colors for notification emails sent to our external vendors?",
        category="Feature Request",
        priority=TicketPriority.MEDIUM.value,
        status=TicketStatus.WAITING_FOR_CUSTOMER.value,
        customer_name="Emily Watson",
        customer_email="emily@nexusmedia.co",
        assigned_agent_id=created_agents[2].id,
        due_date=now + timedelta(days=4),
        created_at=t3_time,
        updated_at=now - timedelta(days=1),
    )
    db.add(t3)
    db.flush()

    db.add(TicketActivity(
        ticket_id=t3.id,
        actor_name="Emily Watson",
        actor_role="customer",
        action_type="created",
        details="Ticket HDX-1003 created with Medium priority in category 'Feature Request'",
        created_at=t3_time,
    ))
    db.add(TicketActivity(
        ticket_id=t3.id,
        actor_name="Marcus Vance",
        actor_role="agent",
        action_type="status_changed",
        details="Status changed from 'Open' to 'Waiting for Customer'",
        created_at=t3_time + timedelta(hours=2),
    ))
    db.add(TicketMessage(
        ticket_id=t3.id,
        author_name="Marcus Vance",
        author_email="marcus@helpdeskx.io",
        author_role="agent",
        message_type=MessageType.PUBLIC.value,
        content="Hi Emily, we support custom HEX color overrides under Workspace Settings > Branding. Could you verify if you have Organization Admin permissions on your profile?",
        created_at=t3_time + timedelta(hours=2),
    ))

    # Sample Ticket 4
    t4_time = now - timedelta(days=5)
    t4 = Ticket(
        ticket_number="HDX-1004",
        title="Need to update company legal address on past invoices",
        description="Our legal entity recently changed offices from Boston to Austin. We need updated PDF invoices for Q1 and Q2 reflecting the new legal address.",
        category="Billing",
        priority=TicketPriority.LOW.value,
        status=TicketStatus.RESOLVED.value,
        customer_name="Jane Doe",
        customer_email="jane@acme.com",
        assigned_agent_id=created_agents[0].id,
        due_date=None,
        created_at=t4_time,
        updated_at=now - timedelta(days=2),
    )
    db.add(t4)
    db.flush()

    db.add(TicketActivity(
        ticket_id=t4.id,
        actor_name="Jane Doe",
        actor_role="customer",
        action_type="created",
        details="Ticket HDX-1004 created with Low priority in category 'Billing'",
        created_at=t4_time,
    ))
    db.add(TicketActivity(
        ticket_id=t4.id,
        actor_name="Alex Rivera",
        actor_role="agent",
        action_type="resolved",
        details="Status changed from 'In Progress' to 'Resolved'",
        created_at=t4_time + timedelta(days=1),
    ))

    # Sample Ticket 5
    t5_time = now - timedelta(hours=5)
    t5 = Ticket(
        ticket_number="HDX-1005",
        title="Webhook delivery failure on ticket status change events",
        description="We configured a webhook listener at https://api.globallogistics.org/hooks/tickets, but test events are returning 400 Bad Request with signature verification mismatch.",
        category="Technical",
        priority=TicketPriority.HIGH.value,
        status=TicketStatus.OPEN.value,
        customer_name="John Smith",
        customer_email="john@globallogistics.org",
        assigned_agent_id=None,
        due_date=now + timedelta(days=2),
        created_at=t5_time,
        updated_at=t5_time,
    )
    db.add(t5)
    db.flush()

    db.add(TicketActivity(
        ticket_id=t5.id,
        actor_name="John Smith",
        actor_role="customer",
        action_type="created",
        details="Ticket HDX-1005 created with High priority in category 'Technical'",
        created_at=t5_time,
    ))

    db.commit()
