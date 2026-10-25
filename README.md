# DockSight ⚓
### Docker Environment Inspector & DevOps Diagnostics Platform

**DockSight** is a developer tool and observability workstation designed to inspect Docker environments, visualize Docker Compose projects, diagnose configuration anomalies through static analysis, and explore real-time container logs.

Built with an **"Industrial DevOps Workstation"** design aesthetic, DockSight provides developer ergonomics, strict security safeguards (automatic credential redaction, localhost binding, destructive action confirmation), and complete offline analysis capability when the Docker Engine daemon is offline.

---

## 📸 Interface Preview & Workstation Views

| Overview & Health Telemetry | ComposeCraft Dependency Graph |
|---|---|
| ![Overview](file:///C:/Users/speedy/.gemini/antigravity-ide/brain/0bfa6975-9cf6-42aa-a344-524ff6379b24/overview_page_1792941744502.png) | ![Compose Graph](file:///C:/Users/speedy/.gemini/antigravity-ide/brain/0bfa6975-9cf6-42aa-a344-524ff6379b24/compose_projects_page_1792941817425.png) |

| Container Explorer & Redaction | DockSight Doctor Diagnostics |
|---|---|
| ![Container Details](file:///C:/Users/speedy/.gemini/antigravity-ide/brain/0bfa6975-9cf6-42aa-a344-524ff6379b24/container_details_panel_1792941784732.png) | ![Diagnostics Scan](file:///C:/Users/speedy/.gemini/antigravity-ide/brain/0bfa6975-9cf6-42aa-a344-524ff6379b24/diagnostics_filtered_1792941940028.png) |

---

## ⚡ Key Capabilities

### 1. Engine & Runtime Observability
- Real-time connection probe using platform-native transports (Windows named pipe `npipe:////./pipe/docker_engine` and Unix domain socket `unix:///var/run/docker.sock`).
- Clear distinction between live Docker daemon data and the offline **Demo Sandbox**.
- Engine version, API version, operating system, architecture, and live container state breakdown.

### 2. Container Explorer & Lifecycle Controls
- Compact, dense table displaying container names, short IDs, image tags, status badges, published port bindings, and creation timestamps.
- Status filters (`All`, `Running`, `Exited`) and multi-field search (name, ID, image).
- Safe lifecycle management: `start`, `stop`, and `restart`. Potentially disruptive actions require explicit confirmation via accessible dialogs.
- Right-side slide-over details panel featuring **automatic secret redaction** for sensitive environment variables (passwords, tokens, API keys, database credentials).

### 3. Image Explorer & Layer Auditing
- Lists local images with formatted storage footprint (KB, MB, GB), repository tags, and creation dates.
- Image inspection slide-over detailing base image metadata, Dockerfile commands, entrypoints, labels, and 15-tier layer history.

### 4. ComposeCraft — Visual Compose Explorer
- Full YAML editor with syntax checking and template loaders (`Microservices`, `Clean Basic`).
- Local Compose file import (`.yml`, `.yaml`) and validated YAML export.
- Interactive dependency graph powered by **React Flow** (`@xyflow/react`):
  - Custom service node cards showing service name, base image/build context, published ports, dependency counts, and warning counters.
  - Directional dependency edges derived from `depends_on`.
  - Distinguishes valid dependencies from **broken/missing dependency references** with red dashed edges and phantom error nodes.
  - Clicking any service node opens the Service Configuration inspector.

### 5. DockSight Doctor — Static Configuration Diagnostics
- 18 static analysis rules for Docker Compose specifications:
  - `DOCK-001-YAML-SYNTAX`: Invalid YAML syntax or indentation errors.
  - `DOCK-003-NO-SERVICES`: Missing `services` declaration.
  - `DOCK-007-NO-IMAGE-OR-BUILD`: Service without `image` or `build` context.
  - `DOCK-008-LATEST-TAG`: Floating or omitted image tag reproducibility risks.
  - `DOCK-009-MISSING-DEPENDENCY`: Service depends on an undeclared target.
  - `DOCK-010-CIRCULAR-SELF-DEPENDENCY`: Service declaring circular dependency on itself.
  - `DOCK-011-PORT-CONFLICT`: Host port collisions across multiple services.
  - `DOCK-012-SENSITIVE-PORT`: Exposure of sensitive ports (22, 3306, 5432, 6379, 27017, 2375).
  - `DOCK-013-HARDCODED-SECRET`: Plaintext secrets in `environment` variables.
  - `DOCK-014-PRIVILEGED-MODE`: Risky `privileged: true` host bypasses.
  - `DOCK-015-DANGEROUS-MOUNT`: Mounting `/var/run/docker.sock` or host root directories.
  - `DOCK-016-MISSING-HEALTHCHECK`: Unchecked stateful dependency services.
  - `DOCK-017-MISSING-RESTART-POLICY`: Unset restart policies for services.
  - `DOCK-018-ENV-FILE-REFERENCE`: External environment file auditing.
- Severity classification (`error`, `warning`, `info`) with remediation guidance.

### 6. Log Explorer & Stream Classification
- Log retrieval through the Docker SDK with configurable tail buffers (50, 100, 250, 500 lines).
- Stream classification into `[STDOUT]` and `[STDERR]` with ISO timestamp parsing.
- Real-time text search and log filtering.
- Controlled auto-refresh (off by default; user-activated 3s intervals).
- One-click copy to clipboard and `.txt` file export.

### 7. Collapsible DevOps Inspection Console
- Docked bottom console logging all background API calls, inspection events, and diagnostic warnings in real time.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Flow (`@xyflow/react`), Lucide React, Custom CSS Design System |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Docker SDK for Python (`docker`), PyYAML, Pydantic v2 |
| **Testing** | pytest, pytest-asyncio, HTTPX, unittest.mock, Vite build verification |
| **Security** | 127.0.0.1 localhost binding, regex credential redaction, strict 2MB upload limits, CORS lockdown |

---

## 🚀 Setup & Execution Instructions (Windows 11)

### Prerequisites
- Python 3.11+
- Node.js v20+ and npm
- (Optional) Docker Desktop for Windows

### Step 1: Clone and Navigate
```powershell
cd c:\Users\speedy\Desktop\DAY4
```

### Step 2: Setup Python Virtual Environment & Backend
```powershell
# Create virtual environment
python -m venv backend/venv

# Activate virtual environment
.\backend\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Setup Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

### Step 4: Start the FastAPI Backend Server
```powershell
# Runs on http://127.0.0.1:8000
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

### Step 5: Start the Vite Development Server (in a new terminal)
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** in your browser.

---

## 🧪 Running Tests

All automated tests use mocked Docker clients and do **not** require a running Docker daemon.

### Backend Test Suite (pytest)
```powershell
.\backend\venv\Scripts\pytest.exe backend\tests -v
```
**Test Results:**
```
collected 14 items
backend/tests/test_compose_and_diagnostics.py::test_valid_compose_validation PASSED
backend/tests/test_compose_and_diagnostics.py::test_invalid_yaml_syntax PASSED
backend/tests/test_compose_and_diagnostics.py::test_missing_dependency_detected PASSED
backend/tests/test_compose_and_diagnostics.py::test_port_conflict_detection PASSED
backend/tests/test_compose_and_diagnostics.py::test_security_rules_privileged_and_mounts_and_secrets PASSED
backend/tests/test_compose_and_diagnostics.py::test_file_upload_size_limit PASSED
backend/tests/test_containers_and_images.py::test_containers_list_mocked PASSED
backend/tests/test_containers_and_images.py::test_container_inspect_redaction PASSED
backend/tests/test_containers_and_images.py::test_container_action_confirmation_required PASSED
backend/tests/test_containers_and_images.py::test_images_list_mocked PASSED
backend/tests/test_health_and_docker.py::test_health_endpoint PASSED
backend/tests/test_health_and_docker.py::test_docker_status_disconnected PASSED
backend/tests/test_health_and_docker.py::test_docker_status_connected PASSED
backend/tests/test_health_and_docker.py::test_demo_endpoints PASSED
======================= 14 passed in 0.37s ========================
```

### Frontend Production Build Verification
```powershell
cd frontend
npm run build
```
**Build Results:**
```
✓ 2105 modules transformed.
dist/index.html                   1.21 kB │ gzip:   0.65 kB
dist/assets/index-C68TubcW.css   27.12 kB │ gzip:   5.07 kB
dist/assets/index-BlM0pfnJ.js   480.80 kB │ gzip: 146.00 kB
✓ built in 1.96s with 0 errors
```

---

## 🔒 Security Model & Architectural Safeguards

1. **Host-Level Binding:** The FastAPI application binds exclusively to `127.0.0.1`, preventing exposure to external networks.
2. **No Arbitrary Shell Execution:** The backend does not expose container command execution (`exec`), arbitrary bash commands, or raw terminal spawning.
3. **Environment Variable Redaction:** Any variable key or value containing sensitive patterns (e.g., `PASSWORD`, `SECRET`, `TOKEN`, `KEY`, `DATABASE_URL`, AWS access keys) is masked prior to sending data to the browser.
4. **Destructive Action Guards:** Stopping or restarting containers requires explicit user confirmation.
5. **Safe File Handling:** Compose file imports are limited to a maximum size of 2MB and verified for UTF-8 encoding.
6. **No Auto-Execution:** Imported Compose YAML documents are parsed and statically checked; they are never automatically deployed or pulled.

---

## 📚 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Application health check distinguishing app status from Docker daemon status |
| `GET` | `/api/docker/status` | Current Docker Engine connection telemetry, version, and container counts |
| `GET` | `/api/containers` | Lists live or demo containers with status and port mappings |
| `GET` | `/api/containers/{id}` | Inspects detailed container state, mounts, networks, and redacted env |
| `POST` | `/api/containers/{id}/action` | Executes safe container actions (`start`, `stop`, `restart`) |
| `GET` | `/api/containers/{id}/logs` | Fetches container log lines with tail limit and stream parsing |
| `GET` | `/api/images` | Lists cached local images and sizes |
| `GET` | `/api/images/{id}` | Inspects image metadata and layer history |
| `POST` | `/api/compose/validate` | Validates Compose YAML, extracts topology, builds graph, and runs diagnostics |
| `POST` | `/api/compose/upload` | Multipart file upload with size limit validation |
| `GET` | `/api/compose/samples` | Built-in sample Compose templates |
| `POST` | `/api/diagnostics/analyze` | Static configuration linting against 18 rules |
| `GET` | `/api/demo/*` | Dedicated sample data endpoints for offline sandbox mode |

---

## 💡 Troubleshooting & Known Limitations

### Windows 11 Docker Named Pipe
If Docker Desktop is running on Windows 11 but DockSight reports `Disconnected`:
1. Open Docker Desktop > Settings > Advanced.
2. Verify that **Enable default Docker socket** or named pipe is checked.
3. Check permissions in PowerShell: `Test-Path //./pipe/docker_engine`.
4. Ensure your user account is in the `docker-users` local group: `net localgroup docker-users`.

### Offline / Air-Gapped Mode
If Docker is not installed on the workstation, DockSight starts without errors. Click **Explore Demo Sandbox** in the top bar or sidebar to inspect simulated microservices, logs, and container states.

---

## ⚖️ License
Released under the MIT License. Developed for professional DevOps engineering and container observability.
