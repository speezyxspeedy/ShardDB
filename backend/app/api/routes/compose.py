from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Dict, Any
from app.schemas.compose import ComposeValidationResponse, ComposeUploadRequest
from app.services.compose_parser import compose_parser
from app.services.diagnostics_engine import diagnostics_engine
from app.services.demo_service import SAMPLE_COMPOSE_YAMLS
from app.core.config import settings

router = APIRouter(prefix="/compose", tags=["Compose"])


@router.post("/validate", response_model=ComposeValidationResponse)
def validate_compose(req: ComposeUploadRequest):
    """
    Validates a Docker Compose YAML document completely offline.
    Parses services, dependencies, builds visualization nodes and edges,
    and runs static diagnostic rules.
    """
    raw_yaml = req.yaml_content
    parsed_dict, parse_err = compose_parser.parse_yaml(raw_yaml, req.project_name)

    # Run static analysis
    report = diagnostics_engine.analyze(raw_yaml, parsed_dict, parse_err)

    if parsed_dict:
        services, _ = compose_parser.extract_services(parsed_dict)
        nodes, edges = compose_parser.build_graph(services, report.items)
    else:
        services, nodes, edges = [], [], []

    has_errors = any(item.severity == "error" for item in report.items)

    return ComposeValidationResponse(
        is_valid=not has_errors and parse_err is None,
        services_count=len(services),
        services=services,
        nodes=nodes,
        edges=edges,
        diagnostics=report.items,
        raw_yaml=raw_yaml,
        project_name=req.project_name or "compose-project",
    )


@router.post("/upload", response_model=ComposeValidationResponse)
async def upload_compose_file(file: UploadFile = File(...)):
    """
    Safely uploads and validates a Compose file from local machine with strict file-size limits.
    """
    contents = await file.read(settings.MAX_UPLOAD_SIZE_BYTES + 1024)
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        )

    try:
        yaml_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content could not be decoded as UTF-8 text."
        )

    project_name = file.filename.rsplit(".", 1)[0] if file.filename else "uploaded-compose"
    return validate_compose(ComposeUploadRequest(yaml_content=yaml_text, project_name=project_name))


@router.get("/samples")
def get_sample_compose_templates() -> Dict[str, str]:
    """
    Returns built-in sample Compose templates for quick exploration and testing.
    """
    return SAMPLE_COMPOSE_YAMLS
