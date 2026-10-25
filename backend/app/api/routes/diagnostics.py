from fastapi import APIRouter
from app.schemas.diagnostics import DiagnosticsReport
from app.schemas.compose import ComposeUploadRequest
from app.services.compose_parser import compose_parser
from app.services.diagnostics_engine import diagnostics_engine

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])


@router.post("/analyze", response_model=DiagnosticsReport)
def analyze_yaml_diagnostics(req: ComposeUploadRequest):
    """
    Runs comprehensive static analysis engine on the provided Compose YAML.
    Returns findings categorized by severity (error, warning, info) with remediation suggestions.
    """
    raw_yaml = req.yaml_content
    parsed_dict, parse_err = compose_parser.parse_yaml(raw_yaml, req.project_name)
    return diagnostics_engine.analyze(raw_yaml, parsed_dict, parse_err)
