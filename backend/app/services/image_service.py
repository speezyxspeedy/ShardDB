import docker
from docker.errors import NotFound, APIError
from typing import List, Dict, Any
from app.services.docker_service import docker_service
from app.schemas.image import ImageSummary, ImageDetail
from app.core.exceptions import ImageNotFoundException, DockerUnavailableException


def _format_size(size_bytes: int) -> str:
    """Format bytes into human-readable MB / GB."""
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


class ImageService:
    def list_images(self) -> List[ImageSummary]:
        client = docker_service.get_client()
        try:
            images = client.images.list()
            results = []
            for img in images:
                tags = img.tags if img.tags else ["<none>:<none>"]
                size = img.attrs.get("Size", 0)
                created = img.attrs.get("Created", "")

                for tag_str in tags:
                    if ":" in tag_str:
                        repo, tag = tag_str.rsplit(":", 1)
                    else:
                        repo, tag = tag_str, "<none>"

                    results.append(
                        ImageSummary(
                            id=img.id,
                            short_id=img.short_id,
                            repository=repo,
                            tag=tag,
                            size_bytes=size,
                            size_formatted=_format_size(size),
                            created=created,
                            containers_count=0,
                            is_demo=False,
                        )
                    )
            return results
        except APIError as e:
            raise DockerUnavailableException(detail=f"Docker API error while listing images: {str(e)}")

    def get_image(self, image_id: str) -> ImageDetail:
        client = docker_service.get_client()
        try:
            img = client.images.get(image_id)
            attrs = img.attrs
            config = attrs.get("Config", {}) or {}
            size = attrs.get("Size", 0)

            # Layers and history
            history_layers = []
            try:
                raw_history = img.history()
                for h in raw_history[:15]:
                    h_size = h.get("Size", 0)
                    history_layers.append({
                        "id": h.get("Id", "")[:12] if h.get("Id") else "<missing>",
                        "created_by": h.get("CreatedBy", ""),
                        "size_bytes": h_size,
                        "size_formatted": _format_size(h_size),
                        "comment": h.get("Comment", "")
                    })
            except Exception:
                pass

            return ImageDetail(
                id=img.id,
                short_id=img.short_id,
                tags=img.tags or ["<none>"],
                size_bytes=size,
                size_formatted=_format_size(size),
                created=attrs.get("Created", ""),
                architecture=attrs.get("Architecture"),
                os=attrs.get("Os"),
                docker_version=attrs.get("DockerVersion"),
                author=attrs.get("Author"),
                env=config.get("Env", []) or [],
                entrypoint=config.get("Entrypoint"),
                cmd=config.get("Cmd"),
                layers=history_layers,
                labels=config.get("Labels", {}) or {},
                is_demo=False,
            )
        except NotFound:
            raise ImageNotFoundException(image_id)
        except APIError as e:
            raise DockerUnavailableException(detail=f"Docker API error inspecting image: {str(e)}")


image_service = ImageService()
