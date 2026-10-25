import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import (
    DockerUnavailableException,
    ContainerNotFoundException,
    ImageNotFoundException,
    ComposeValidationException,
)
from app.api.routes import health, docker_routes, containers, images, compose, diagnostics, logs, demo

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("docksight")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DockSight — Docker Environment Inspector & DevOps Diagnostics Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(DockerUnavailableException)
async def docker_unavailable_handler(request: Request, exc: DockerUnavailableException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )

@app.exception_handler(ContainerNotFoundException)
async def container_not_found_handler(request: Request, exc: ContainerNotFoundException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )

@app.exception_handler(ImageNotFoundException)
async def image_not_found_handler(request: Request, exc: ImageNotFoundException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )

@app.exception_handler(ComposeValidationException)
async def compose_validation_handler(request: Request, exc: ComposeValidationException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )

# Include API Routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(docker_routes.router, prefix=settings.API_V1_PREFIX)
app.include_router(containers.router, prefix=settings.API_V1_PREFIX)
app.include_router(images.router, prefix=settings.API_V1_PREFIX)
app.include_router(compose.router, prefix=settings.API_V1_PREFIX)
app.include_router(diagnostics.router, prefix=settings.API_V1_PREFIX)
app.include_router(logs.router, prefix=settings.API_V1_PREFIX)
app.include_router(demo.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "service": "DockSight API",
        "version": settings.VERSION,
        "docs": "/api/docs",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
