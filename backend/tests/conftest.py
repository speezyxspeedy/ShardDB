import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.docker_service import docker_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_docker_client():
    mock = MagicMock()
    mock.ping.return_value = True
    mock.version.return_value = {
        "Version": "25.0.3",
        "ApiVersion": "1.44",
    }
    mock.info.return_value = {
        "Containers": 5,
        "ContainersRunning": 3,
        "ContainersStopped": 2,
        "Images": 12,
        "OperatingSystem": "Docker Desktop Linux",
        "Architecture": "x86_64",
        "SystemTime": "2026-10-25T14:00:00Z",
    }
    return mock
