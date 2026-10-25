import io


def test_valid_compose_validation(client):
    valid_yaml = """
services:
  web:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
    depends_on:
      - backend
  backend:
    image: python:3.11-slim
    ports:
      - "8000:8000"
"""
    response = client.post("/api/compose/validate", json={"yaml_content": valid_yaml, "project_name": "test-proj"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["services_count"] == 2
    assert len(data["nodes"]) == 2
    assert len(data["edges"]) == 1
    assert data["edges"][0]["source"] == "web"
    assert data["edges"][0]["target"] == "backend"
    assert data["edges"][0]["is_valid"] is True


def test_invalid_yaml_syntax(client):
    invalid_yaml = """
services:
  web:
    image: nginx
    ports: [80:80
"""
    response = client.post("/api/compose/validate", json={"yaml_content": invalid_yaml})
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert any(d["rule_id"] == "DOCK-001-YAML-SYNTAX" for d in data["diagnostics"])


def test_missing_dependency_detected(client):
    yaml_with_broken_dep = """
services:
  frontend:
    image: node:20-alpine
    depends_on:
      - nonexistent_backend
"""
    response = client.post("/api/compose/validate", json={"yaml_content": yaml_with_broken_dep})
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    broken_diag = next((d for d in data["diagnostics"] if d["rule_id"] == "DOCK-009-MISSING-DEPENDENCY"), None)
    assert broken_diag is not None
    assert "nonexistent_backend" in broken_diag["explanation"]
    
    # Check that graph edge is marked invalid
    edge = next((e for e in data["edges"] if e["target"] == "nonexistent_backend"), None)
    assert edge is not None
    assert edge["is_valid"] is False


def test_port_conflict_detection(client):
    conflicting_ports_yaml = """
services:
  service_a:
    image: myorg/app1:v1
    ports:
      - "8080:80"
  service_b:
    image: myorg/app2:v1
    ports:
      - "8080:3000"
"""
    response = client.post("/api/compose/validate", json={"yaml_content": conflicting_ports_yaml})
    assert response.status_code == 200
    data = response.json()
    assert any(d["rule_id"] == "DOCK-011-PORT-CONFLICT" for d in data["diagnostics"])


def test_security_rules_privileged_and_mounts_and_secrets(client):
    risky_yaml = """
services:
  insecure_app:
    image: app:latest
    privileged: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "6379:6379"
    environment:
      AWS_SECRET_ACCESS_KEY: "AKIA1234567890EXAMPLE"
"""
    response = client.post("/api/compose/validate", json={"yaml_content": risky_yaml})
    assert response.status_code == 200
    data = response.json()
    rule_ids = [d["rule_id"] for d in data["diagnostics"]]
    assert "DOCK-008-LATEST-TAG" in rule_ids
    assert "DOCK-014-PRIVILEGED-MODE" in rule_ids
    assert "DOCK-015-DANGEROUS-MOUNT" in rule_ids
    assert "DOCK-012-SENSITIVE-PORT" in rule_ids
    assert "DOCK-013-HARDCODED-SECRET" in rule_ids


def test_file_upload_size_limit(client):
    # Exceeding 2MB upload limit
    huge_content = b"a" * (3 * 1024 * 1024)
    file_obj = io.BytesIO(huge_content)
    response = client.post(
        "/api/compose/upload",
        files={"file": ("docker-compose.yml", file_obj, "application/x-yaml")}
    )
    assert response.status_code == 413
