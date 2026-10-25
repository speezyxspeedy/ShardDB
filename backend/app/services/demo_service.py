from typing import List
from app.schemas.container import (
    ContainerSummary,
    ContainerDetail,
    ContainerPortMapping,
    ContainerMount,
    ContainerNetwork,
)
from app.schemas.image import ImageSummary, ImageDetail
from app.schemas.docker_info import DockerStatusResponse
from app.schemas.logs import ContainerLogsResponse, LogLine

SAMPLE_COMPOSE_YAMLS = {
    "microservices": """version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped

  api:
    image: myorg/payment-service:v2.4.1
    ports:
      - "8080:8080"
    depends_on:
      - cache
      - database
      - auth-service  # Note: auth-service is missing in this compose file!
    environment:
      DATABASE_URL: "postgresql://dbuser:supersecretpass123@database:5432/payments"
      REDIS_HOST: "cache"
      NODE_ENV: "production"
      API_KEY: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    restart: on-failure

  cache:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"  # Sensitive port exposed to host!
    volumes:
      - redis-data:/data

  database:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: "dbuser"
      POSTGRES_PASSWORD: "supersecretpass123"
      POSTGRES_DB: "payments"
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dbuser -d payments"]
      interval: 10s
      timeout: 5s
      retries: 5

  monitoring:
    image: prom/prometheus:v2.50.0
    ports:
      - "9090:9090"
    privileged: true  # Risky privileged mode!
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro  # Docker socket mount!

volumes:
  db-data:
  redis-data:
""",
    "basic": """services:
  app:
    image: python:3.11-slim
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: "development"
    command: python app.py
"""
}


class DemoService:
    def get_demo_status(self) -> DockerStatusResponse:
        return DockerStatusResponse(
            connected=False,
            status="Offline Demo Sandbox",
            version="Docker Demo Mode (Offline)",
            api_version="1.45 (Simulated)",
            os="Linux (Simulated Container Runtime)",
            arch="x86_64",
            containers_running=3,
            containers_stopped=1,
            containers_total=4,
            images_count=5,
            server_time="2026-10-25T14:30:00Z",
            error_message="Live Docker daemon is disconnected. Displaying simulated demo environment for exploration.",
            troubleshooting=[
                "This is sample data provided for demonstration purposes only.",
                "To connect to your real Docker environment, start Docker Desktop and click 'Refresh' in the top bar.",
            ],
            is_demo=True,
        )

    def get_demo_containers(self) -> List[ContainerSummary]:
        return [
            ContainerSummary(
                id="demo-c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6",
                short_id="demo-c1a2b3c4",
                name="docksight-api-service",
                image="docksight/backend:v1.0.0",
                status="Up 4 hours",
                state="running",
                created="2026-10-25T10:00:00Z",
                ports=["127.0.0.1:8000->8000/tcp"],
                health="healthy",
                compose_project="docksight-prod",
                compose_service="api",
                is_demo=True,
            ),
            ContainerSummary(
                id="demo-a8f3c2e1b9d4e5f6a7b8c9d0e1f2a3b4",
                short_id="demo-a8f3c2e1",
                name="docksight-postgres-db",
                image="postgres:16.2-alpine",
                status="Up 4 hours",
                state="running",
                created="2026-10-25T09:58:00Z",
                ports=["127.0.0.1:5432->5432/tcp"],
                health="healthy",
                compose_project="docksight-prod",
                compose_service="db",
                is_demo=True,
            ),
            ContainerSummary(
                id="demo-f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9",
                short_id="demo-f4e3d2c1",
                name="docksight-redis-cache",
                image="redis:7.2.4-alpine",
                status="Up 4 hours",
                state="running",
                created="2026-10-25T09:59:00Z",
                ports=["127.0.0.1:6379->6379/tcp"],
                health="healthy",
                compose_project="docksight-prod",
                compose_service="cache",
                is_demo=True,
            ),
            ContainerSummary(
                id="demo-99887766554433221100aabbccddeeff",
                short_id="demo-99887766",
                name="docksight-worker-batch",
                image="docksight/worker:v1.0.0",
                status="Exited (0) 1 hour ago",
                state="exited",
                created="2026-10-25T08:30:00Z",
                ports=[],
                health=None,
                compose_project="docksight-prod",
                compose_service="worker",
                is_demo=True,
            ),
        ]

    def get_demo_container_detail(self, container_id: str) -> ContainerDetail:
        return ContainerDetail(
            id=container_id,
            short_id=container_id[:12],
            name="docksight-api-service",
            image="docksight/backend:v1.0.0",
            image_id="sha256:4d83b28b68832a8904791e2b6943801f9c3f4e69b596956f1f416cba07c0800b",
            status="Up 4 hours",
            state="running",
            created="2026-10-25T10:00:00Z",
            started_at="2026-10-25T10:00:02Z",
            finished_at=None,
            exit_code=0,
            restart_count=0,
            ports=[
                ContainerPortMapping(
                    host_ip="127.0.0.1",
                    host_port="8000",
                    container_port="8000",
                    protocol="tcp",
                )
            ],
            mounts=[
                ContainerMount(
                    source="/workspace/docksight/app",
                    destination="/app",
                    mode="rw",
                    rw=True,
                    type="bind",
                )
            ],
            networks=[
                ContainerNetwork(
                    name="docksight-network",
                    ip_address="172.20.0.4",
                    gateway="172.20.0.1",
                    mac_address="02:42:ac:14:00:04",
                )
            ],
            env={
                "APP_ENV": "production",
                "PORT": "8000",
                "DATABASE_URL": "po...23 [REDACTED]",
                "SECRET_KEY": "******",
                "REDIS_HOST": "docksight-redis-cache",
            },
            command=["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
            labels={
                "com.docker.compose.project": "docksight-prod",
                "com.docker.compose.service": "api",
                "maintainer": "DevOps Team",
            },
            health="healthy",
            recent_logs=[
                "2026-10-25T10:00:02.124Z [INFO] DockSight API runtime initialized",
                "2026-10-25T10:00:02.435Z [INFO] Connected to PostgreSQL on 172.20.0.2:5432",
                "2026-10-25T10:00:02.502Z [INFO] Connected to Redis Cache on 172.20.0.3:6379",
                "2026-10-25T10:00:03.011Z [INFO] Application startup complete. Uvicorn running on http://0.0.0.0:8000",
                "2026-10-25T11:15:30.892Z [INFO] GET /api/health HTTP/1.1 200 OK",
                "2026-10-25T12:00:00.100Z [INFO] Periodic health check passed (status=healthy)",
            ],
            is_demo=True,
        )

    def get_demo_images(self) -> List[ImageSummary]:
        return [
            ImageSummary(
                id="sha256:4d83b28b68832a8904791e2b6943801f9c3f4e69b596956f1f416cba07c0800b",
                short_id="4d83b28b6883",
                repository="docksight/backend",
                tag="v1.0.0",
                size_bytes=184549376,
                size_formatted="176.0 MB",
                created="2026-10-25T08:15:00Z",
                containers_count=1,
                is_demo=True,
            ),
            ImageSummary(
                id="sha256:91c2b5f6a7e8d9c0b1a2f3e4d5c6b7a8901234567890abcdef1234567890abcd",
                short_id="91c2b5f6a7e8",
                repository="postgres",
                tag="16.2-alpine",
                size_bytes=398458880,
                size_formatted="380.0 MB",
                created="2026-10-20T12:00:00Z",
                containers_count=1,
                is_demo=True,
            ),
            ImageSummary(
                id="sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
                short_id="1a2b3c4d5e6f",
                repository="redis",
                tag="7.2.4-alpine",
                size_bytes=42991616,
                size_formatted="41.0 MB",
                created="2026-10-18T10:00:00Z",
                containers_count=1,
                is_demo=True,
            ),
            ImageSummary(
                id="sha256:0f1e2d3c4b5a697887654321fedcba0987654321abcdef0123456789abcdef01",
                short_id="0f1e2d3c4b5a",
                repository="nginx",
                tag="latest",
                size_bytes=196083712,
                size_formatted="187.0 MB",
                created="2026-10-15T09:00:00Z",
                containers_count=0,
                is_demo=True,
            ),
            ImageSummary(
                id="sha256:deadbeefcafebabefeedface0123456789abcdef0123456789abcdef01234567",
                short_id="deadbeefcafe",
                repository="prom/prometheus",
                tag="v2.50.0",
                size_bytes=225443840,
                size_formatted="215.0 MB",
                created="2026-10-10T14:00:00Z",
                containers_count=0,
                is_demo=True,
            ),
        ]

    def get_demo_logs(self, container_id: str, tail: int = 100) -> ContainerLogsResponse:
        lines = [
            LogLine(timestamp="2026-10-25T14:20:00.001Z", stream="stdout", message="[INFO] DockSight Service worker starting..."),
            LogLine(timestamp="2026-10-25T14:20:00.120Z", stream="stdout", message="[INFO] Initializing worker thread pool (workers=4)"),
            LogLine(timestamp="2026-10-25T14:20:01.350Z", stream="stdout", message="[INFO] Database connection established pool_size=10"),
            LogLine(timestamp="2026-10-25T14:21:05.112Z", stream="stdout", message="[INFO] Polling task queue for pending inspection jobs"),
            LogLine(timestamp="2026-10-25T14:22:15.840Z", stream="stdout", message="[INFO] Processing compose project validation: payment-network"),
            LogLine(timestamp="2026-10-25T14:23:44.200Z", stream="stderr", message="[WARN] Upstream service 'auth-service' responded with high latency (1240ms)"),
            LogLine(timestamp="2026-10-25T14:25:00.000Z", stream="stdout", message="[INFO] Health check probe received from container orchestrator: 200 OK"),
            LogLine(timestamp="2026-10-25T14:26:10.510Z", stream="stdout", message="[INFO] Log rotation check completed successfully"),
        ]
        return ContainerLogsResponse(
            container_id=container_id,
            container_name="docksight-api-service",
            tail=tail,
            total_lines=len(lines),
            logs=lines,
            is_demo=True,
        )


demo_service = DemoService()
