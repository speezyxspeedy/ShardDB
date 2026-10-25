import re
from typing import Dict, Any

SENSITIVE_PATTERNS = [
    re.compile(r"(pass|pwd|secret|key|token|auth|cred|private|cert|jwt)", re.IGNORECASE),
    re.compile(r"^(aws_|azure_|gcp_|github_|docker_)", re.IGNORECASE),
]

POTENTIAL_SECRET_VALUE_PATTERNS = [
    re.compile(r"^(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}$"), # GitHub tokens
    re.compile(r"^(?:AKIA|ASIA)[0-9A-Z]{16}$"),                     # AWS Access Key
    re.compile(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----"),              # Private key header
]


def is_sensitive_key(key_name: str) -> bool:
    """Determine if an environment variable key indicates sensitive data."""
    if not key_name:
        return False
    return any(p.search(key_name) for p in SENSITIVE_PATTERNS)


def redact_env_value(key: str, val: Any) -> str:
    """Redact sensitive environment values with mask."""
    if val is None:
        return ""
    val_str = str(val)
    if is_sensitive_key(key):
        if len(val_str) <= 6:
            return "******"
        return f"{val_str[:2]}...{val_str[-2:]} [REDACTED]"
    
    # Check if value itself matches known secret formats
    for pattern in POTENTIAL_SECRET_VALUE_PATTERNS:
        if pattern.search(val_str):
            return "****** [DETECTED_SECRET_REDACTED]"
            
    return val_str


def redact_env_dict(env_dict: Dict[str, Any]) -> Dict[str, str]:
    """Return dictionary with sensitive environment values masked."""
    return {k: redact_env_value(k, v) for k, v in env_dict.items()}
