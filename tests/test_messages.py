import pytest


def test_public_reply_and_internal_note(client):
    create_res = client.post("/api/tickets", json={
        "title": "Message Thread Test",
        "description": "Initial ticket description.",
        "category": "Technical",
        "priority": "Medium",
        "customer_name": "Grace Hopper",
        "customer_email": "grace@navy.mil",
    })
    ticket_id = create_res.json()["id"]

    # Customer adds public reply
    cust_res = client.post(f"/api/tickets/{ticket_id}/messages", json={
        "author_name": "Grace Hopper",
        "author_email": "grace@navy.mil",
        "author_role": "customer",
        "message_type": "public",
        "content": "Attaching the memory dump for review.",
    })
    assert cust_res.status_code == 201
    assert cust_res.json()["message_type"] == "public"

    # Agent adds internal note
    note_res = client.post(f"/api/tickets/{ticket_id}/messages", json={
        "author_name": "Agent Smith",
        "author_email": "agent@matrix.io",
        "author_role": "agent",
        "message_type": "internal_note",
        "content": "Internal check: verified memory leak in core loop.",
    })
    assert note_res.status_code == 201
    assert note_res.json()["message_type"] == "internal_note"

    # List messages
    list_res = client.get(f"/api/tickets/{ticket_id}/messages")
    assert list_res.status_code == 200
    messages = list_res.json()
    assert len(messages) == 2
    assert messages[0]["content"] == "Attaching the memory dump for review."
    assert messages[1]["content"] == "Internal check: verified memory leak in core loop."


def test_customer_cannot_add_internal_note(client):
    create_res = client.post("/api/tickets", json={
        "title": "Note Security Test",
        "description": "Checking role permission on note creation.",
        "category": "General",
        "priority": "Low",
        "customer_name": "Harry",
        "customer_email": "harry@potter.org",
    })
    ticket_id = create_res.json()["id"]

    res = client.post(f"/api/tickets/{ticket_id}/messages", json={
        "author_name": "Harry",
        "author_email": "harry@potter.org",
        "author_role": "customer",
        "message_type": "internal_note",
        "content": "Sneaky customer note.",
    })
    assert res.status_code == 400
    assert "customers cannot post internal notes" in res.json()["detail"].lower()


def test_empty_message_rejected(client):
    create_res = client.post("/api/tickets", json={
        "title": "Blank Message Test",
        "description": "Valid ticket description.",
        "category": "General",
        "priority": "Low",
        "customer_name": "Ian",
        "customer_email": "ian@test.org",
    })
    ticket_id = create_res.json()["id"]

    # Empty string
    res = client.post(f"/api/tickets/{ticket_id}/messages", json={
        "author_name": "Ian",
        "author_email": "ian@test.org",
        "author_role": "customer",
        "message_type": "public",
        "content": "",
    })
    assert res.status_code == 422

    # Whitespace only
    res_space = client.post(f"/api/tickets/{ticket_id}/messages", json={
        "author_name": "Ian",
        "author_email": "ian@test.org",
        "author_role": "customer",
        "message_type": "public",
        "content": "     \n\t   ",
    })
    assert res_space.status_code == 422
