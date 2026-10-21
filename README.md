# HelpDeskX — Customer Support Ticket Management Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0%2B-red.svg)](https://www.sqlalchemy.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**HelpDeskX** is a full-stack customer support ticket management platform with two distinct interfaces: a **Support Agent Dashboard** equipped with real-time analytics and audit history, and a self-service **Customer Portal** for submitting inquiries and tracking issue resolution.

Built with Python (FastAPI, SQLAlchemy, Pydantic, SQLite) on the backend and pure HTML5, modern CSS3, and Vanilla JavaScript on the frontend.

---

## 🌟 Key Features

### 1. Dual Portal Architecture
- **Support Agent Dashboard (`/`)**:
  - Live analytics cards (Total, Open, In Progress, Waiting, Resolved, Urgent/High)
  - Interactive Chart.js visualizations (7-Day creation trend, status doughnut, priority breakdown)
  - Full ticket management table with debounced search, multiple filters (Status, Priority, Category, Assignee), and sorting
  - Interactive slide-out **Ticket Detail Drawer**
  - Public customer replies and highlighted **Internal Notes** (gold badges, team-only)
  - Comprehensive chronological **Activity Audit Trail** (records ticket creation, status changes, priority changes, reassignments)
  - Quick action buttons (Resolve, Close, Reopen, Assign, Delete with confirmation)
- **Customer Portal (`/customer`)**:
  - Dedicated self-service interface for end-users
  - Ticket submission form with validation (title, category, priority, description)
  - Filtered list of tickets submitted by the active customer
  - Full conversation thread with support engineers (internal notes are strictly omitted)
  - Customer public reply composer (automatically resets waiting status to In Progress upon response)

### 2. Robust Backend & Database Architecture
- **FastAPI Backend**: Clean separation across routers, models, schemas, and service layer.
- **SQLite with Foreign Keys**: Atomic sequential ticket numbering (`HDX-1001`, `HDX-1002`, ...), CASCADE deletes, and indexed query columns.
- **Audit Logging**: Every ticket mutation writes an immutable row into `ticket_activities`.
- **Pre-seeded Initial Data**: First launch automatically provisions realistic agents, tickets, conversations, and audit records.
- **Validation**: Strict Pydantic V2 schemas validating email formats, non-empty text, and role permissions.

### 3. Premium UI / UX
- Sleek dark navy palette with a one-click Light/Dark theme toggle (persisted to `localStorage`).
- Responsive layout adapting from widescreen desktops down to tablets and mobile devices.
- Non-intrusive toast notifications for successes and errors.
- Clean inline SVG icons throughout (no emojis used for primary interface elements).

---

## 📐 Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0 ORM, SQLite, Pydantic V2 |
| **Frontend** | HTML5, Modern CSS3 (CSS Variables, Flexbox/Grid), Vanilla JavaScript (ES6+), Fetch API, Chart.js 4.4 |
| **Testing** | pytest, pytest-asyncio, HTTPX, FastAPI TestClient |
| **OS Target** | Windows 11 / 10, macOS, Linux |

---

## 📂 Project Structure

```text
DAY4/
├── app/
│   ├── main.py                     # FastAPI application setup, lifespan, static mounting
│   ├── database.py                 # SQLite engine, connection pragmas, and sessionmaker
│   ├── models.py                   # SQLAlchemy ORM models (Ticket, Agent, TicketMessage, etc.)
│   ├── schemas.py                  # Pydantic validation and serialization schemas
│   ├── seed.py                     # Automatic demo data provisioning on initial launch
│   ├── routers/
│   │   ├── tickets.py              # Ticket CRUD, lifecycle, filters, and assignment endpoints
│   │   ├── messages.py             # Public replies and internal note endpoints
│   │   ├── dashboard.py            # Analytics metrics and activity feed endpoints
│   │   └── agents.py               # Support agent listing and retrieval
│   ├── services/
│   │   ├── ticket_service.py       # Core ticket logic, atomic numbering, and audit logs
│   │   └── dashboard_service.py    # Analytics aggregations and metrics calculations
│   └── static/
│       ├── index.html              # Support Agent Dashboard
│       ├── customer.html           # Customer Support Portal
│       ├── css/
│       │   └── styles.css          # Design system, CSS variables, dark/light themes
│       └── js/
│           ├── api.js              # Fetch client, toast system, theme, and identity store
│           ├── dashboard.js        # Analytics charts (Chart.js) and workload list
│           ├── tickets.js          # Ticket table, debounced search, and pagination
│           ├── ticket-detail.js    # Slide-out drawer, message composer, and audit trail
│           └── customer.js         # Customer portal ticket list, creation, and replies
├── tests/
│   ├── conftest.py                 # Pytest fixtures and isolated temporary test database
│   ├── test_health.py              # Health check endpoint tests
│   ├── test_tickets.py             # Ticket creation, retrieval, filtering, and deletion tests
│   ├── test_messages.py            # Replies, internal note constraints, and validation tests
│   └── test_dashboard.py           # Metrics calculation and analytics tests
├── requirements.txt                # Python backend and test dependencies
├── run.bat                         # Automated Windows 11 one-click launcher
├── .env.example                    # Environment template file
├── .gitignore                      # Git ignore rules
└── README.md                       # Complete documentation
```

---

## 🚀 Windows 11 Setup & Quick Start

### Prerequisites
- Windows 11 or 10
- Python 3.10 or higher installed with **"Add Python to PATH"** checked during installation.

### Option A: One-Click Launcher (`run.bat`)
Double-click `run.bat` in File Explorer or run it from Command Prompt / PowerShell:
```bat
run.bat
```
*The batch file will automatically create a virtual environment (`venv`), install dependencies, and launch the server at `http://127.0.0.1:8000`.*

---

### Option B: Manual Setup via VS Code / Terminal

1. **Open the project folder in VS Code**:
   ```powershell
   cd c:\Users\speedy\Desktop\DAY4
   code .
   ```

2. **Create and activate a virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *(If script execution is disabled in PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

3. **Install dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Start the application**:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. **Access the Application**:
   - **Support Agent Dashboard**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - **Customer Portal**: [http://127.0.0.1:8000/customer](http://127.0.0.1:8000/customer)
   - **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Running Automated Tests

HelpDeskX includes an automated test suite verifying ticket lifecycle, message validation, role constraints, and dashboard calculations against an isolated temporary SQLite database.

Run the test suite with:
```powershell
python -m pytest -v
```

Expected output:
```text
tests/test_dashboard.py::test_dashboard_stats PASSED                     [  7%]
tests/test_dashboard.py::test_recent_activity_endpoint PASSED            [ 14%]
tests/test_health.py::test_health_check PASSED                           [ 21%]
tests/test_messages.py::test_public_reply_and_internal_note PASSED       [ 28%]
tests/test_messages.py::test_customer_cannot_add_internal_note PASSED    [ 35%]
tests/test_messages.py::test_empty_message_rejected PASSED               [ 42%]
tests/test_tickets.py::test_create_ticket_success PASSED                 [ 50%]
tests/test_tickets.py::test_create_ticket_validation_failures PASSED     [ 57%]
tests/test_tickets.py::test_get_ticket_details PASSED                    [ 64%]
tests/test_tickets.py::test_get_unknown_ticket_404 PASSED                [ 71%]
tests/test_tickets.py::test_list_and_filter_tickets PASSED               [ 78%]
tests/test_tickets.py::test_update_ticket_status_and_priority PASSED     [ 85%]
tests/test_tickets.py::test_assign_agent PASSED                          [ 92%]
tests/test_tickets.py::test_delete_ticket PASSED                         [100%]
======================= 14 passed in 4.15s =======================
```

---

## 👥 Demo Identities & Walkthrough

### Pre-Configured Demo Support Agents
- **Alex Rivera** (`alex@helpdeskx.io`) — Senior Support Engineer
- **Sarah Chen** (`sarah@helpdeskx.io`) — Technical Specialist
- **Marcus Vance** (`marcus@helpdeskx.io`) — Customer Success Lead

### Pre-Configured Demo Customers
- **Jane Doe** (`jane@acme.com`) — Acme Corp
- **John Smith** (`john@globallogistics.org`) — Global Logistics
- **Emily Watson** (`emily@nexusmedia.co`) — Nexus Media

> [!NOTE]
> **Demo Identity Notice**: The demo identity dropdowns located in the Agent sidebar and the Customer portal header allow you to quickly test role-based perspectives without an authentication barrier. In production, these should be replaced with real OAuth2/JWT authentication and session-based authorization.

### Complete End-to-End Workflow Verification
1. **Open Customer Portal** ([http://127.0.0.1:8000/customer](http://127.0.0.1:8000/customer)). Select *Jane Doe*.
2. Click **Submit Support Ticket**, enter a subject (e.g. "Payment failure on auto-renew"), select **Billing** and **High**, and submit.
3. Switch to the **Support Agent Dashboard** ([http://127.0.0.1:8000/](http://127.0.0.1:8000/)).
4. Notice the new ticket in **All Tickets** with its unique consecutive number (e.g., `HDX-1006`).
5. Click on the ticket to open the **Detail Drawer**.
6. Assign the ticket to an agent (e.g., *Alex Rivera*) and set Status to **In Progress**.
7. In the composer, toggle to **Internal Note** and log: *"Checked Stripe charges, card declined by bank."* Notice the distinct golden background and badge.
8. Toggle to **Public Reply** and respond: *"Hello Jane, your issuing bank declined the transaction. Could you check with your bank or update payment details?"*
9. Change status to **Waiting for Customer**.
10. Switch back to the **Customer Portal** as *Jane Doe*. Open the ticket. Notice your reply is visible, while the internal note is kept confidential. Post a reply: *"Thanks Alex, updated the card!"*
11. Observe that the status automatically updates back to **In Progress** in the agent queue, and all actions are recorded in the **Activity Audit Trail**.
12. Verify the **Dashboard** charts update their real-time numbers accordingly.

---

## 🔒 Security & Known Limitations

- **Demo Identities**: Authentication is intentionally simulated via local storage persona switches to make local evaluation immediate and friction-free.
- **Internal Notes Confidentiality**: The customer portal interface filters out internal notes from display. Production deployments should enforce server-side message-type stripping based on authenticated JWT session claims.
- **Single Host Deployment**: The app serves frontend assets directly through FastAPI static mounts (`app/static`), preventing CORS configuration friction when running locally.

---

## 🚀 Future Roadmap
- JWT/OAuth2 user authentication with role-based access control (RBAC).
- File/screenshot attachment uploads with S3/MinIO backend.
- Email webhook triggers (SendGrid/Postmark) for email-to-ticket creation.
- WebSocket support for real-time ticket updates and notifications without page refresh.
