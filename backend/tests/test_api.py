"""
API integration tests for NodeFlow using FastAPI TestClient.
Covers:
- Workflow CRUD
- Workflow duplication
- Execution history & ExecutionStep persistence
- Execution cancellation
- API validation and 404 responses
- Stats endpoint
- Template instantiation
"""

from fastapi.testclient import TestClient
import pytest
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "NodeFlow" in data["app"]


def test_node_definitions_endpoint():
    res = client.get("/api/nodes/definitions")
    assert res.status_code == 200
    nodes = res.json()
    assert isinstance(nodes, list)
    assert len(nodes) >= 7
    types = [n["type"] for n in nodes]
    assert "manual_trigger" in types
    assert "text_input" in types
    assert "condition" in types
    assert "text_transform" in types
    assert "delay" in types
    assert "output" in types
    assert "notification_simulator" in types


def test_templates_endpoint():
    res = client.get("/api/templates")
    assert res.status_code == 200
    templates = res.json()
    assert len(templates) >= 3
    t_ids = [t["id"] for t in templates]
    assert "text-processor" in t_ids
    assert "conditional-router" in t_ids
    assert "message-generator" in t_ids


def test_template_instantiate():
    res = client.post("/api/templates/text-processor/instantiate")
    assert res.status_code == 201
    wf = res.json()
    assert "Text Processor" in wf["name"]
    assert len(wf["nodes"]) >= 4
    # Clean up
    client.delete(f"/api/workflows/{wf['id']}")


def test_stats_endpoint():
    res = client.get("/api/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_workflows" in stats
    assert "total_executions" in stats
    assert "success_rate_pct" in stats


def test_execute_adhoc_workflow():
    payload = {
        "workflow_name": "Test AdHoc Run",
        "nodes": [
            {"id": "t1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "data": {}},
            {"id": "t2", "type": "text_input", "position": {"x": 200, "y": 0}, "data": {"text": "hello world"}},
            {"id": "t3", "type": "text_transform", "position": {"x": 400, "y": 0}, "data": {"operation": "slugify"}},
            {"id": "t4", "type": "output", "position": {"x": 600, "y": 0}, "data": {}}
        ],
        "edges": [
            {"id": "e1", "source": "t1", "target": "t2", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "e2", "source": "t2", "target": "t3", "sourceHandle": "output", "targetHandle": "input"},
            {"id": "e3", "source": "t3", "target": "t4", "sourceHandle": "output", "targetHandle": "input"}
        ]
    }
    res = client.post("/api/workflows/execute-adhoc", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["status"] == "COMPLETED"
    assert "t3" in result["node_results"]
    assert result["node_results"]["t3"]["output"]["transformed_text"] == "hello-world"
    assert "steps" in result
    assert len(result["steps"]) == 4


def test_workflow_crud_lifecycle_and_duplication():
    # 1. Create
    create_res = client.post("/api/workflows", json={
        "name": "E2E Test Flow",
        "description": "Created during pytest",
        "category": "Testing",
        "tags": ["unit-test"],
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "data": {}},
            {"id": "n2", "type": "output", "position": {"x": 200, "y": 0}, "data": {}}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "sourceHandle": "output", "targetHandle": "input"}
        ],
        "viewport": {"x": 0, "y": 0, "zoom": 1.0}
    })
    assert create_res.status_code == 201
    wf = create_res.json()
    wf_id = wf["id"]
    assert wf["name"] == "E2E Test Flow"

    # 2. Get
    get_res = client.get(f"/api/workflows/{wf_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == wf_id

    # 3. Update
    update_res = client.put(f"/api/workflows/{wf_id}", json={
        "name": "Updated Test Flow"
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Test Flow"

    # 4. Duplicate
    dup_res = client.post(f"/api/workflows/{wf_id}/duplicate")
    assert dup_res.status_code == 201
    dup_wf = dup_res.json()
    assert dup_wf["name"] == "Updated Test Flow (Copy)"
    assert dup_wf["id"] != wf_id

    # 5. Execute Saved
    exec_res = client.post(f"/api/workflows/{wf_id}/execute", json={})
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert exec_data["status"] == "COMPLETED"
    exec_id = exec_data["id"]

    # 6. Verify Execution Record & Steps
    hist_res = client.get(f"/api/executions/{exec_id}")
    assert hist_res.status_code == 200
    assert hist_res.json()["workflow_id"] == wf_id
    assert len(hist_res.json()["steps"]) == 2

    # 7. Cancel Execution (returns existing execution record)
    cancel_res = client.post(f"/api/executions/{exec_id}/cancel")
    assert cancel_res.status_code == 200

    # 8. Delete Workflows & Clean up
    del_res = client.delete(f"/api/workflows/{wf_id}")
    assert del_res.status_code == 204
    client.delete(f"/api/workflows/{dup_wf['id']}")

    # Confirm 404 for deleted workflow
    get_after = client.get(f"/api/workflows/{wf_id}")
    assert get_after.status_code == 404


def test_not_found_responses():
    res1 = client.get("/api/workflows/non-existent-uuid-12345")
    assert res1.status_code == 404

    res2 = client.get("/api/executions/non-existent-uuid-12345")
    assert res2.status_code == 404

    res3 = client.post("/api/workflows/non-existent-uuid-12345/duplicate")
    assert res3.status_code == 404
