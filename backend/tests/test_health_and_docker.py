import pytest
from unittest.mock import patch
from app.core.exceptions import DockerUnavailableException


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "docker_connected" in data
    assert "app_name" in data


def test_docker_status_disconnected(client):
    # Without real docker running, /api/docker/status returns disconnected status with troubleshooting steps
    with patch("app.services.docker_service.docker_service.get_client") as mock_get:
        mock_get.side_effect = DockerUnavailableException("Docker daemon not reachable")
        response = client.get("/api/docker/status")
        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is False
        assert data["status"] == "Disconnected"
        assert len(data["troubleshooting"]) > 0


def test_docker_status_connected(client, mock_docker_client):
    with patch("app.services.docker_service.docker_service.get_client", return_value=mock_docker_client):
        response = client.get("/api/docker/status")
        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is True
        assert data["status"] == "Connected"
        assert data["version"] == "25.0.3"
        assert data["containers_running"] == 3
        assert data["containers_stopped"] == 2
        assert data["images_count"] == 12


def test_demo_endpoints(client):
    status_resp = client.get("/api/demo/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["is_demo"] is True

    cont_resp = client.get("/api/demo/containers")
    assert cont_resp.status_code == 200
    containers = cont_resp.json()
    assert len(containers) > 0
    assert all(c["is_demo"] is True for c in containers)

    img_resp = client.get("/api/demo/images")
    assert img_resp.status_code == 200
    images = img_resp.json()
    assert len(images) > 0
    assert all(img["is_demo"] is True for img in images)
