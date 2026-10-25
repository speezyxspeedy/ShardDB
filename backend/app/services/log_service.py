import re
from typing import List, Optional
from docker.errors import NotFound, APIError
from app.services.docker_service import docker_service
from app.schemas.logs import LogLine, ContainerLogsResponse
from app.core.exceptions import ContainerNotFoundException, DockerUnavailableException

TIMESTAMP_REGEX = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+(.*)$")


class LogService:
    def get_container_logs(
        self,
        container_id: str,
        tail: int = 100,
        timestamps: bool = True,
    ) -> ContainerLogsResponse:
        client = docker_service.get_client()
        try:
            c = client.containers.get(container_id)
            c_name = c.name.lstrip("/")

            # Docker SDK allows tail as int or 'all'
            safe_tail = min(max(tail, 1), 2000)

            # Retrieve stdout
            try:
                raw_logs = c.logs(
                    stdout=True,
                    stderr=True,
                    tail=safe_tail,
                    timestamps=timestamps,
                )
            except Exception as e:
                return ContainerLogsResponse(
                    container_id=container_id,
                    container_name=c_name,
                    tail=safe_tail,
                    total_lines=1,
                    logs=[LogLine(stream="stderr", message=f"Unable to read logs: {str(e)}")],
                    is_demo=False
                )

            log_lines: List[LogLine] = []
            if isinstance(raw_logs, bytes):
                decoded = raw_logs.decode("utf-8", errors="replace")
                raw_lines = decoded.splitlines()
                for line in raw_lines:
                    if not line:
                        continue
                    ts_match = TIMESTAMP_REGEX.match(line)
                    if ts_match:
                        ts = ts_match.group(1)
                        msg = ts_match.group(2)
                    else:
                        ts = None
                        msg = line

                    # Determine stream heuristic if stderr prefix is present
                    stream = "stdout"
                    lower_msg = msg.lower()
                    if "error" in lower_msg or "fatal" in lower_msg or "fail" in lower_msg or "err" in lower_msg:
                        stream = "stderr"

                    log_lines.append(LogLine(timestamp=ts, stream=stream, message=msg))

            return ContainerLogsResponse(
                container_id=container_id,
                container_name=c_name,
                tail=safe_tail,
                total_lines=len(log_lines),
                logs=log_lines,
                is_demo=False
            )
        except NotFound:
            raise ContainerNotFoundException(container_id)
        except APIError as e:
            raise DockerUnavailableException(detail=f"Docker error while reading logs: {str(e)}")


log_service = LogService()
