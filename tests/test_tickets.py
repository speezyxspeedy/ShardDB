import pytest


def test_create_ticket_success(client):
    payload = {
        "title": "Cannot access billing invoices",
        "description": "Getting a 403 Forbidden error when attempting to download PDF invoices.",
        "category": "Billing",
        "priority": "High",
        "customer_name": "Alice Cooper",
        "customer_email": "alice@cooper.com",
    }
    response = client.post("/api/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["ticket_number"].startswith("HDX-")
    assert data["title"] == payload["title"]
    assert data["category"] == "Billing"
    assert data["priority"] == "High"
    assert data["status"] == "Open"
    assert data["customer_email"] == "alice@cooper.com"


def test_create_ticket_validation_failures(client):
    # Missing title & description
    response = client.post("/api/tickets", json={
        "category": "Technical",
        "customer_name": "Bob",
        "customer_email": "bob@example.com"
    })
    assert response.status_code == 422

    # Title too short
    response = client.post("/api/tickets", json={
        "title": "Hi",
        "description": "Something longer here",
        "category": "Technical",
        "customer_name": "Bob",
        "customer_email": "bob@example.com"
    })
    assert response.status_code == 422

    # Invalid email
    response = client.post("/api/tickets", json={
        "title": "Valid Ticket Title",
        "description": "Valid ticket description text",
        "category": "Technical",
        "customer_name": "Bob",
        "customer_email": "not-an-email"
    })
    assert response.status_code == 422


def test_get_ticket_details(client):
    create_res = client.post("/api/tickets", json={
        "title": "API Rate Limiting Question",
        "description": "What are the default rate limits on the REST endpoints?",
        "category": "Technical",
        "priority": "Medium",
        "customer_name": "Charlie Puth",
        "customer_email": "charlie@puth.com",
    })
    ticket_id = create_res.json()["id"]
    ticket_num = create_res.json()["ticket_number"]

    # Get by ID
    res_id = client.get(f"/api/tickets/{ticket_id}")
    assert res_id.status_code == 200
    assert res_id.json()["ticket_number"] == ticket_num
    assert "messages" in res_id.json()
    assert "activities" in res_id.json()

    # Get by Ticket Number
    res_num = client.get(f"/api/tickets/number/{ticket_num}")
    assert res_num.status_code == 200
    assert res_num.json()["id"] == ticket_id


def test_get_unknown_ticket_404(client):
    response = client.get("/api/tickets/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_and_filter_tickets(client):
    # Create tickets with different statuses and priorities
    client.post("/api/tickets", json={
        "title": "Feature: Dark Mode",
        "description": "Please add dark mode option.",
        "category": "Feature Request",
        "priority": "Low",
        "customer_name": "User One",
        "customer_email": "user1@example.com",
    })

    # Search query
    res = client.get("/api/tickets", params={"search": "Dark Mode"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any("Dark Mode" in t["title"] for t in data["items"])

    # Filter category
    res_cat = client.get("/api/tickets", params={"category": "Feature Request"})
    assert res_cat.status_code == 200
    assert all(t["category"] == "Feature Request" for t in res_cat.json()["items"])

    # Sorting
    res_sort = client.get("/api/tickets", params={"sort_by": "priority"})
    assert res_sort.status_code == 200


def test_update_ticket_status_and_priority(client):
    create_res = client.post("/api/tickets", json={
        "title": "Status Workflow Test",
        "description": "Testing status and priority transitions.",
        "category": "General",
        "priority": "Low",
        "customer_name": "Dave",
        "customer_email": "dave@example.com",
    })
    ticket_id = create_res.json()["id"]

    # Change Status to In Progress
    status_res = client.patch(f"/api/tickets/{ticket_id}/status", json={
        "status": "In Progress",
        "actor_name": "Test Agent",
        "actor_role": "agent",
    })
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "In Progress"

    # Change Priority to Urgent
    priority_res = client.patch(f"/api/tickets/{ticket_id}/priority", json={
        "priority": "Urgent",
        "actor_name": "Test Agent",
        "actor_role": "agent",
    })
    assert priority_res.status_code == 200
    assert priority_res.json()["priority"] == "Urgent"

    # Resolve ticket
    res_resolve = client.post(f"/api/tickets/{ticket_id}/resolve?actor_name=TestAgent")
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "Resolved"

    # Reopen ticket
    res_reopen = client.post(f"/api/tickets/{ticket_id}/reopen?actor_name=TestAgent")
    assert res_reopen.status_code == 200
    assert res_reopen.json()["status"] == "Open"


def test_assign_agent(client):
    create_res = client.post("/api/tickets", json={
        "title": "Assignment Test Ticket",
        "description": "Testing ticket assignment.",
        "category": "Technical",
        "priority": "Medium",
        "customer_name": "Eve",
        "customer_email": "eve@example.com",
    })
    ticket_id = create_res.json()["id"]

    # Assign to agent 1
    assign_res = client.patch(f"/api/tickets/{ticket_id}/assign", json={
        "assigned_agent_id": 1,
        "actor_name": "Manager",
        "actor_role": "agent",
    })
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_agent_id"] == 1

    # Unassign
    unassign_res = client.patch(f"/api/tickets/{ticket_id}/assign", json={
        "assigned_agent_id": None,
        "actor_name": "Manager",
        "actor_role": "agent",
    })
    assert unassign_res.status_code == 200
    assert unassign_res.json()["assigned_agent_id"] is None


def test_delete_ticket(client):
    create_res = client.post("/api/tickets", json={
        "title": "Ticket To Delete",
        "description": "This ticket will be deleted.",
        "category": "General",
        "priority": "Low",
        "customer_name": "Frank",
        "customer_email": "frank@example.com",
    })
    ticket_id = create_res.json()["id"]

    del_res = client.delete(f"/api/tickets/{ticket_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/tickets/{ticket_id}")
    assert get_res.status_code == 404
