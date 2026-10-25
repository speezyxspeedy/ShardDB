import re
import uuid
from typing import Dict, Any, List, Optional
from app.schemas.diagnostics import DiagnosticItem, DiagnosticsReport
from app.core.security import SENSITIVE_PATTERNS, POTENTIAL_SECRET_VALUE_PATTERNS

SENSITIVE_PORTS = {
    "22": "SSH",
    "2375": "Unencrypted Docker Daemon",
    "2376": "Docker Daemon TLS",
    "3306": "MySQL",
    "5432": "PostgreSQL",
    "6379": "Redis (unauthenticated by default)",
    "27017": "MongoDB",
    "9200": "Elasticsearch",
}

DANGEROUS_MOUNT_TARGETS = [
    "/var/run/docker.sock",
    "//./pipe/docker_engine",
    "/etc",
    "/root",
    "/boot",
    "/sys",
    "/proc",
    "/",
    "c:\\",
    "c:\\windows",
]


class DiagnosticsEngine:
    def analyze(self, raw_yaml: str, parsed_dict: Optional[Dict[str, Any]], parse_error: Optional[str] = None) -> DiagnosticsReport:
        items: List[DiagnosticItem] = []

        # 1. Check YAML syntax
        if parse_error:
            items.append(
                DiagnosticItem(
                    id=str(uuid.uuid4()),
                    rule_id="DOCK-001-YAML-SYNTAX",
                    severity="error",
                    title="Invalid YAML Syntax",
                    explanation=f"The provided Compose file could not be parsed as valid YAML: {parse_error}",
                    path="root",
                    suggested_remediation="Verify indentation (use spaces, not tabs), check for unmatched colons or quotes, and ensure proper YAML formatting.",
                    auto_fix_available=False,
                )
            )
            return self._build_report(items)

        if not parsed_dict:
            items.append(
                DiagnosticItem(
                    id=str(uuid.uuid4()),
                    rule_id="DOCK-002-EMPTY-FILE",
                    severity="error",
                    title="Empty Docker Compose File",
                    explanation="The Compose specification contains no definitions or configuration content.",
                    path="root",
                    suggested_remediation="Add a 'services:' section defining at least one service.",
                    auto_fix_available=False,
                )
            )
            return self._build_report(items)

        # 2. Check for missing or invalid 'services' key
        services_section = parsed_dict.get("services")
        if services_section is None:
            items.append(
                DiagnosticItem(
                    id=str(uuid.uuid4()),
                    rule_id="DOCK-003-NO-SERVICES",
                    severity="error",
                    title="Missing 'services' Section",
                    explanation="A valid Docker Compose file must contain a top-level 'services:' mapping defining your workload.",
                    path="services",
                    suggested_remediation="Add a 'services:' key with child services to define containers.",
                    auto_fix_available=False,
                )
            )
            return self._build_report(items)

        if not isinstance(services_section, dict):
            items.append(
                DiagnosticItem(
                    id=str(uuid.uuid4()),
                    rule_id="DOCK-004-SERVICES-TYPE",
                    severity="error",
                    title="'services' Must Be a Mapping",
                    explanation=f"The 'services' section is expected to be a key-value dictionary, but got {type(services_section).__name__}.",
                    path="services",
                    suggested_remediation="Format services as key-value pairs where each key is a unique service name.",
                    auto_fix_available=False,
                )
            )
            return self._build_report(items)

        if len(services_section) == 0:
            items.append(
                DiagnosticItem(
                    id=str(uuid.uuid4()),
                    rule_id="DOCK-005-EMPTY-SERVICES",
                    severity="error",
                    title="'services' Section Is Empty",
                    explanation="The 'services' mapping is present but has zero services defined.",
                    path="services",
                    suggested_remediation="Add at least one service entry under 'services:'.",
                    auto_fix_available=False,
                )
            )
            return self._build_report(items)

        service_names = set(services_section.keys())
        used_host_ports: Dict[str, str] = {}  # host_port -> service_name

        # Analyze each service
        for s_name, s_conf in services_section.items():
            if not isinstance(s_conf, dict):
                items.append(
                    DiagnosticItem(
                        id=str(uuid.uuid4()),
                        rule_id="DOCK-006-INVALID-SERVICE-DEF",
                        severity="error",
                        title=f"Invalid Service Definition '{s_name}'",
                        explanation=f"Service '{s_name}' configuration must be a mapping dictionary, but got {type(s_conf).__name__}.",
                        service=str(s_name),
                        path=f"services.{s_name}",
                        suggested_remediation=f"Specify options such as 'image:', 'build:', or 'ports:' under '{s_name}:'.",
                        auto_fix_available=False,
                    )
                )
                continue

            # Check 3: Missing image or build
            has_image = bool(s_conf.get("image"))
            has_build = bool(s_conf.get("build"))
            if not has_image and not has_build:
                items.append(
                    DiagnosticItem(
                        id=str(uuid.uuid4()),
                        rule_id="DOCK-007-NO-IMAGE-OR-BUILD",
                        severity="error",
                        title=f"Service '{s_name}' Has No Image or Build Spec",
                        explanation=f"Service '{s_name}' does not specify an 'image:' to pull or a 'build:' context to compile.",
                        service=str(s_name),
                        path=f"services.{s_name}",
                        suggested_remediation=f"Define either 'image: <image_name>' or 'build: .' for service '{s_name}'.",
                        auto_fix_available=False,
                    )
                )

            # Check 4: Image uses 'latest' tag or missing tag
            if has_image:
                image_val = str(s_conf.get("image", ""))
                if ":" not in image_val or image_val.endswith(":latest"):
                    items.append(
                        DiagnosticItem(
                            id=str(uuid.uuid4()),
                            rule_id="DOCK-008-LATEST-TAG",
                            severity="warning",
                            title=f"Service '{s_name}' Uses Floating 'latest' Image Tag",
                            explanation=f"Using ':latest' (or omitting tag: '{image_val}') leads to unpredictable deployments when upstream base images change.",
                            service=str(s_name),
                            path=f"services.{s_name}.image",
                            suggested_remediation="Pin your image to a specific semantic version tag (e.g. `node:20.11-alpine` or `postgres:16.2`) for reproducibility.",
                            auto_fix_available=False,
                        )
                    )

            # Check 5: depends_on validation
            raw_deps = s_conf.get("depends_on", [])
            deps_list = []
            if isinstance(raw_deps, list):
                deps_list = [str(d) for d in raw_deps]
            elif isinstance(raw_deps, dict):
                deps_list = list(raw_deps.keys())
            
            for dep in deps_list:
                if dep not in service_names:
                    items.append(
                        DiagnosticItem(
                            id=str(uuid.uuid4()),
                            rule_id="DOCK-009-MISSING-DEPENDENCY",
                            severity="error",
                            title=f"Missing Dependency '{dep}' in Service '{s_name}'",
                            explanation=f"Service '{s_name}' declares 'depends_on: {dep}', but service '{dep}' is not defined in this Compose file.",
                            service=str(s_name),
                            path=f"services.{s_name}.depends_on",
                            suggested_remediation=f"Define service '{dep}' in the services section, or remove it from '{s_name}' depends_on.",
                            auto_fix_available=False,
                        )
                    )
                if dep == s_name:
                    items.append(
                        DiagnosticItem(
                            id=str(uuid.uuid4()),
                            rule_id="DOCK-010-CIRCULAR-SELF-DEPENDENCY",
                            severity="error",
                            title=f"Service '{s_name}' Depends on Itself",
                            explanation=f"Service '{s_name}' lists itself in 'depends_on', causing a circular dependency deadlock.",
                            service=str(s_name),
                            path=f"services.{s_name}.depends_on",
                            suggested_remediation=f"Remove '{s_name}' from its own 'depends_on' list.",
                            auto_fix_available=False,
                        )
                    )

            # Check 6: Port configurations and conflicts
            raw_ports = s_conf.get("ports", [])
            if isinstance(raw_ports, list):
                for port_entry in raw_ports:
                    port_str = ""
                    if isinstance(port_entry, (str, int)):
                        port_str = str(port_entry)
                    elif isinstance(port_entry, dict):
                        published = port_entry.get("published")
                        target = port_entry.get("target")
                        port_str = f"{published}:{target}" if published else str(target)

                    # Check for raw integers without quotes (common YAML bug where 60:60 is interpreted in base 60)
                    if isinstance(port_entry, int) and ":" not in str(port_entry):
                        pass

                    # Parse host port
                    host_port = None
                    if ":" in port_str:
                        parts = port_str.split(":")
                        if len(parts) == 2:
                            host_port = parts[0]
                        elif len(parts) == 3:
                            host_port = parts[1]

                    if host_port:
                        # Strip protocol if present (e.g. 80/tcp)
                        host_port_clean = host_port.split("/")[0]
                        if host_port_clean in used_host_ports:
                            other_svc = used_host_ports[host_port_clean]
                            items.append(
                                DiagnosticItem(
                                    id=str(uuid.uuid4()),
                                    rule_id="DOCK-011-PORT-CONFLICT",
                                    severity="error",
                                    title=f"Host Port Conflict on Port {host_port_clean}",
                                    explanation=f"Both '{other_svc}' and '{s_name}' attempt to bind to host port {host_port_clean}. Only one container can bind to the same host port simultaneously.",
                                    service=str(s_name),
                                    path=f"services.{s_name}.ports",
                                    suggested_remediation=f"Change the published host port for either '{s_name}' or '{other_svc}'.",
                                    auto_fix_available=False,
                                )
                            )
                        else:
                            used_host_ports[host_port_clean] = str(s_name)

                        # Check sensitive port exposed
                        if host_port_clean in SENSITIVE_PORTS:
                            service_desc = SENSITIVE_PORTS[host_port_clean]
                            items.append(
                                DiagnosticItem(
                                    id=str(uuid.uuid4()),
                                    rule_id="DOCK-012-SENSITIVE-PORT",
                                    severity="warning",
                                    title=f"Sensitive Port Exposed: {host_port_clean} ({service_desc})",
                                    explanation=f"Service '{s_name}' directly publishes port {host_port_clean} ({service_desc}) to the host interface.",
                                    service=str(s_name),
                                    path=f"services.{s_name}.ports",
                                    suggested_remediation=f"Bind to localhost only (`127.0.0.1:{host_port_clean}:{host_port_clean}`) or use an internal Docker network instead of exposing sensitive services to the host.",
                                    auto_fix_available=False,
                                )
                            )

            # Check 7: Hardcoded secrets in environment variables
            env_vars = s_conf.get("environment", {})
            env_items = []
            if isinstance(env_vars, dict):
                env_items = list(env_vars.items())
            elif isinstance(env_vars, list):
                for item in env_vars:
                    if isinstance(item, str) and "=" in item:
                        k, v = item.split("=", 1)
                        env_items.append((k, v))

            for k, v in env_items:
                k_str = str(k)
                v_str = str(v)
                # Check if key implies secret and value is non-empty and non-interpolated
                if v_str and not v_str.startswith("${"):
                    has_suspicious_key = any(p.search(k_str) for p in SENSITIVE_PATTERNS)
                    has_secret_pattern = any(p.search(v_str) for p in POTENTIAL_SECRET_VALUE_PATTERNS)
                    
                    if has_secret_pattern or (has_suspicious_key and len(v_str) > 3 and not v_str.lower() in ["placeholder", "example", "changeme"]):
                        items.append(
                            DiagnosticItem(
                                id=str(uuid.uuid4()),
                                rule_id="DOCK-013-HARDCODED-SECRET",
                                severity="warning",
                                title=f"Potential Hardcoded Secret in '{s_name}.{k_str}'",
                                explanation=f"Environment variable '{k_str}' appears to contain a hardcoded plaintext secret or credential in the Compose file.",
                                service=str(s_name),
                                path=f"services.{s_name}.environment.{k_str}",
                                suggested_remediation="Store sensitive values in a `.env` file excluded from version control or reference them using `${VARIABLE_NAME}` syntax.",
                                auto_fix_available=False,
                            )
                        )

            # Check 8: Privileged mode
            if s_conf.get("privileged") is True:
                items.append(
                    DiagnosticItem(
                        id=str(uuid.uuid4()),
                        rule_id="DOCK-014-PRIVILEGED-MODE",
                        severity="error",
                        title=f"Service '{s_name}' Uses Privileged Mode",
                        explanation=f"'privileged: true' gives the container full root access to the host kernel and devices, essentially bypassing container isolation.",
                        service=str(s_name),
                        path=f"services.{s_name}.privileged",
                        suggested_remediation="Remove 'privileged: true' and grant only required specific Linux capabilities using 'cap_add' (e.g. `cap_add: [NET_ADMIN]`).",
                        auto_fix_available=False,
                    )
                )

            # Check 9: Dangerous host filesystem mounts
            raw_vols = s_conf.get("volumes", [])
            if isinstance(raw_vols, list):
                for vol in raw_vols:
                    src = ""
                    if isinstance(vol, str):
                        parts = vol.split(":")
                        src = parts[0] if parts else ""
                    elif isinstance(vol, dict):
                        src = vol.get("source", "")

                    src_clean = src.strip().lower()
                    for danger in DANGEROUS_MOUNT_TARGETS:
                        if src_clean == danger or (len(danger) > 3 and src_clean.startswith(danger)):
                            items.append(
                                DiagnosticItem(
                                    id=str(uuid.uuid4()),
                                    rule_id="DOCK-015-DANGEROUS-MOUNT",
                                    severity="warning",
                                    title=f"Potentially Dangerous Mount in '{s_name}'",
                                    explanation=f"Service '{s_name}' mounts critical host resource or socket '{src}', allowing potential container escape or host compromise.",
                                    service=str(s_name),
                                    path=f"services.{s_name}.volumes",
                                    suggested_remediation="Avoid mounting the Docker socket or host root directories unless absolutely required for monitoring tools.",
                                    auto_fix_available=False,
                                )
                            )
                            break

            # Check 10: Missing health check on services that declare depends_on
            has_healthcheck = bool(s_conf.get("healthcheck"))
            # If other services depend on this service, a healthcheck is highly recommended
            services_depending_on_this = [
                other_name for other_name, other_cfg in services_section.items()
                if isinstance(other_cfg, dict) and s_name in (
                    other_cfg.get("depends_on", []) if isinstance(other_cfg.get("depends_on"), list)
                    else list(other_cfg.get("depends_on", {}).keys()) if isinstance(other_cfg.get("depends_on"), dict)
                    else []
                )
            ]
            if services_depending_on_this and not has_healthcheck:
                items.append(
                    DiagnosticItem(
                        id=str(uuid.uuid4()),
                        rule_id="DOCK-016-MISSING-HEALTHCHECK",
                        severity="info",
                        title=f"No Healthcheck on Dependency Service '{s_name}'",
                        explanation=f"Service '{s_name}' is depended on by {', '.join(services_depending_on_this)}, but has no 'healthcheck:' configured. Compose will start dependents immediately without waiting for readiness.",
                        service=str(s_name),
                        path=f"services.{s_name}.healthcheck",
                        suggested_remediation=f"Add a 'healthcheck:' block to '{s_name}' so dependents can wait with `condition: service_healthy`.",
                        auto_fix_available=False,
                    )
                )

            # Check 11: Missing restart policy
            if not s_conf.get("restart"):
                items.append(
                    DiagnosticItem(
                        id=str(uuid.uuid4()),
                        rule_id="DOCK-017-MISSING-RESTART-POLICY",
                        severity="info",
                        title=f"Service '{s_name}' Has No Restart Policy",
                        explanation=f"Without 'restart:', the container will not automatically restart if it crashes or when Docker reboots.",
                        service=str(s_name),
                        path=f"services.{s_name}.restart",
                        suggested_remediation="Consider setting `restart: unless-stopped` or `restart: on-failure` for production resiliency.",
                        auto_fix_available=False,
                    )
                )

            # Check 12: env_file check
            env_file = s_conf.get("env_file")
            if env_file:
                items.append(
                    DiagnosticItem(
                        id=str(uuid.uuid4()),
                        rule_id="DOCK-018-ENV-FILE-REFERENCE",
                        severity="info",
                        title=f"Service '{s_name}' References External env_file",
                        explanation=f"Service '{s_name}' specifies `env_file: {env_file}`. Ensure this file is present in deployment environments and added to `.gitignore`.",
                        service=str(s_name),
                        path=f"services.{s_name}.env_file",
                        suggested_remediation="Verify target environment file exists locally before running `docker compose up`.",
                        auto_fix_available=False,
                    )
                )

        return self._build_report(items)

    def _build_report(self, items: List[DiagnosticItem]) -> DiagnosticsReport:
        errors = sum(1 for i in items if i.severity == "error")
        warnings = sum(1 for i in items if i.severity == "warning")
        info = sum(1 for i in items if i.severity == "info")
        return DiagnosticsReport(
            total_issues=len(items),
            errors_count=errors,
            warnings_count=warnings,
            info_count=info,
            items=items,
        )


diagnostics_engine = DiagnosticsEngine()
