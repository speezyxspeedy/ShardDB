from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "DockSight"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    MAX_UPLOAD_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB
    DOCKER_TIMEOUT_SECONDS: int = 5

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
