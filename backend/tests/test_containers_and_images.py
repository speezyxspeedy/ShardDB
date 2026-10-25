from unittest.mock import MagicMock, patch
from docker.errors import NotFound
from app.core.exceptions import DockerUnavailableException


def test_containers_list_mocked(client, mock_docker_client):
    mock_container = MagicMock()
    mock_container.id = "abcd1234ef567890"
    mock_container.short_id = "abcd1234ef56"
    mock_container.name = "/web-app"
    mock_container.status = "running"
    mock_container.image.tags = ["myorg/web:1.0"]
    mock_container.attrs = {
        "State": {"Status": "running"},
        "NetworkSettings": {"Ports": {"80/tcp": [{"HostIp": "0.0.0.0", "HostPort": "8080"}]}},
        "Created": "2026-10-25T10:00:00Z",
        "Config": {"Labels": {"com.docker.compose.service": "web"}},
    }
    mock_docker_client.containers.list.return_value = [mock_container]

    with patch("app.services.docker_service.docker_service.get_client", return_value=mock_docker_client):
        response = client.get("/api/containers")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "web-app"
        assert data[0]["short_id"] == "abcd1234ef56"
        assert "0.0.0.0:8080->80/tcp" in data[0]["ports"]
        assert data[0]["is_demo"] is False


def test_container_inspect_redaction(client, mock_docker_client):
    mock_container = MagicMock()
    mock_container.id = "c123456789012345"
    mock_container.short_id = "c12345678901"
    mock_container.name = "/db-service"
    mock_container.status = "running"
    mock_container.image.tags = ["postgres:16-alpine"]
    mock_container.image.id = "sha256:112233"
    mock_container.logs.return_value = b"Postgres started\nready for connections\n"
    mock_container.attrs = {
        "State": {"Status": "running", "StartedAt": "2026-10-25T10:00:00Z"},
        "NetworkSettings": {"Ports": {}, "Networks": {}},
        "Created": "2026-10-25T10:00:00Z",
        "Mounts": [],
        "Config": {
            "Env": [
                "POSTGRES_USER=admin",
                "POSTGRES_PASSWORD=supersecretpassword123",
                "API_KEY=ghp_123456789012345678901234567890123456",
                "APP_ENV=production",
            ],
            "Cmd": ["postgres"],
            "Labels": {},
        },
    }
    mock_docker_client.containers.get.return_value = mock_container

    with patch("app.services.docker_service.docker_service.get_client", return_value=mock_docker_client):
        response = client.get("/api/containers/c123456789012345")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "db-service"
        env = data["env"]
        # Verify secret redaction
        assert env["POSTGRES_PASSWORD"] != "supersecretpassword123"
        assert "REDACTED" in env["POSTGRES_PASSWORD"] or "******" in env["POSTGRES_PASSWORD"]
        assert env["APP_ENV"] == "production"


def test_container_action_confirmation_required(client, mock_docker_client):
    mock_container = MagicMock()
    mock_container.status = "running"
    mock_container.name = "web"
    mock_docker_client.containers.get.return_value = mock_container

    with patch("app.services.docker_service.docker_service.get_client", return_value=mock_docker_client):
        # Stop without confirmation should fail safely
        resp_unconfirmed = client.post(
            "/api/containers/c123/action",
            json={"action": "stop", "confirm": False}
        )
        assert resp_unconfirmed.status_code == 200
        data = resp_unconfirmed.json()
        assert data["success"] is False
        assert "confirmation" in data["message"].lower()

        # Stop with confirmation executes
        resp_confirmed = client.post(
            "/api/containers/c123/action",
            json={"action": "stop", "confirm": True}
        )
        assert resp_confirmed.status_code == 200
        data_conf = resp_confirmed.json()
        assert data_conf["success"] is True
        mock_container.stop.assert_called_once()


def test_images_list_mocked(client, mock_docker_client):
    mock_img = MagicMock()
    mock_img.id = "sha256:abcdef123456"
    mock_img.short_id = "sha256:abcdef"
    mock_img.tags = ["myrepo/app:latest"]
    mock_img.attrs = {"Size": 104857600, "Created": "2026-10-25T08:00:00Z"}
    mock_docker_client.images.list.return_value = [mock_img]

    with patch("app.services.docker_service.docker_service.get_client", return_value=mock_docker_client):
        response = client.get("/api/images")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["repository"] == "myrepo/app"
        assert data[0]["tag"] == "latest"
        assert "100.0 MB" in data[0]["size_formatted"]
