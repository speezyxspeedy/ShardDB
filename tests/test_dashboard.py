def test_dashboard_stats(client):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()

    assert "total_tickets" in data
    assert "open_tickets" in data
    assert "in_progress_tickets" in data
    assert "waiting_tickets" in data
    assert "resolved_tickets" in data
    assert "closed_tickets" in data
    assert "status_distribution" in data
    assert "priority_distribution" in data
    assert "category_distribution" in data
    assert "agent_ticket_counts" in data
    assert "created_over_time" in data
    assert "recent_activities" in data

    # Verify agent ticket count structure
    agent_counts = data["agent_ticket_counts"]
    assert any(a["agent_name"] == "Unassigned" for a in agent_counts)


def test_recent_activity_endpoint(client):
    res = client.get("/api/dashboard/recent-activity?limit=5")
    assert res.status_code == 200
    activities = res.json()
    assert isinstance(activities, list)
    if activities:
        assert "actor_name" in activities[0]
        assert "action_type" in activities[0]
        assert "details" in activities[0]
