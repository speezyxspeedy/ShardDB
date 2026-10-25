from fastapi import HTTPException, status


class DockerUnavailableException(HTTPException):
    def __init__(self, detail: str = "Docker Engine is unavailable or not running"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DOCKER_UNAVAILABLE",
                "message": detail,
                "troubleshooting": [
                    "Ensure Docker Desktop or Docker Engine is started.",
                    "Verify user permissions for Docker socket or Windows named pipe.",
                    "Test docker command in terminal: `docker info`.",
                ]
            }
        )


class ContainerNotFoundException(HTTPException):
    def __init__(self, container_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CONTAINER_NOT_FOUND",
                "message": f"Container '{container_id}' was not found.",
            }
        )


class ImageNotFoundException(HTTPException):
    def __init__(self, image_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "IMAGE_NOT_FOUND",
                "message": f"Image '{image_id}' was not found.",
            }
        )


class ComposeValidationException(HTTPException):
    def __init__(self, errors: list):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "COMPOSE_INVALID",
                "message": "Compose file contains syntax or schema errors.",
                "errors": errors
            }
        )
