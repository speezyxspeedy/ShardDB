# QueryLens 🔬
### Interactive SQL Playground, Query Plan Visualizer & Performance Optimizer

**QueryLens** is an interactive developer tool and learning workstation designed for exploring, debugging, and optimizing SQLite database queries. It brings SQLite execution mechanics to life with connected query plan graphs, automated full-table scan detectors, plain-language operational explanations, and instant before/after indexing comparisons.

---

## 🌌 Art Direction: "Graphite Observatory"

QueryLens is styled with the **Graphite Observatory** aesthetic:
- **Main Background**: `#111418` (Obsidian Deep Space)
- **Secondary Background**: `#181D23` (Dark Slate Workspace)
- **Elevated Panels**: `#202730` (Graphite Console)
- **Borders & Dividers**: `#323B46`
- **Primary Text**: `#EDF2F7` (Crisp Lunar White)
- **Secondary Text**: `#98A6B6`
- **Accents**:
  - Main Accent: **Ice Blue** (`#56C8F5`)
  - Secondary Accent: **Electric Violet** (`#A78BFA`)
  - Warning: **Amber** (`#F4BD50`)
  - Error / Hazard: **Crimson** (`#FF7373`)
  - Success: **Emerald** (`#55D6A5`)
- **Typography**: Interface in clean sans-serif (*Inter*), technical data, queries, execution plans, and IDs in high-readability monospace (*JetBrains Mono*).

---

## 🛠️ Technology Stack & Versions

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6.3
- **Build Tool**: Vite 6.4.5
- **Editor**: CodeMirror 6 (`@uiw/react-codemirror` 4.23.7, `@codemirror/lang-sql` 6.8.0, `@codemirror/theme-one-dark` 6.1.2)
- **Query Plan Tree**: React Flow (`@xyflow/react` 12.3.6)
- **Icons**: Lucide React 0.469.0
- **SQL Formatter**: `sql-formatter` 15.4.9

### Backend
- **Language**: Python 3.11+ (tested on Python 3.14.5)
- **Web Framework**: FastAPI 0.136.3
- **ASGI Server**: Uvicorn 0.48.0
- **Data Validation**: Pydantic 2.13.4
- **Database Engine**: Python's native `sqlite3` (no heavy ORMs, true SQLite-native execution)
- **SQL Parser**: `sqlparse` 0.6.0
- **Testing**: `pytest` 8.4.2

---

## 🚀 Key Features

### 1. Database Explorer
- **Managed Workspace**: Safe sandboxed access to application SQLite databases (`backend/data/databases/`).
- **Pre-populated Sample Databases**:
  - `ecommerce.db`: 8,000 orders, 20,000 order items, 1,500 customers, 800 products, 3,000 reviews. Pre-configured with intentional indexing gaps so you can see a 10,000-row table scan and fix it in real-time.
  - `university.db`: Departments, courses, professors, students, and enrollments for testing multi-table joins, subqueries, and grouping.
- **Database Management**: Create new custom databases, or reset bundled sample databases to their pristine populated state with one click.
- **Deep Schema Introspection**: Expand tables to inspect declared columns, data types, primary keys, nullability flags, and index definitions with indexed columns.
- **Sample Data Preview**: Instant modal previewing real rows from any table with pagination and column typing.
- **One-Click Index Creator**: "+ Index" helper modal to quickly create an index on any column without writing raw DDL.

### 2. SQL Editor
- **CodeMirror 6 Worksheets**: Full SQL syntax highlighting, line numbers, automatic bracket closing, and active line glow.
- **Worksheet Tabs**: Create multiple query tabs (`Worksheet 1`, `Worksheet 2`, ...) without losing unsaved code.
- **Smart Mode Indicator**: Automatically detects whether a query is `READ-ONLY`, `MUTATION`, or `DESTRUCTIVE`.
- **Keyboard Shortcuts**:
  - `Ctrl + Enter` / `Cmd + Enter`: Execute current query
  - `Ctrl + S` / `Cmd + S`: Save query with title and tags
  - `Ctrl + Shift + F`: Auto-format SQL with uppercase keywords and standardized indentation
  - `Ctrl + F`: Search / Find in editor

### 3. Safe Execution Engine
- **Single-Statement Enforcement**: Blocks multi-statement script injections (e.g. `SELECT 1; DROP TABLE users;`).
- **PRAGMA Restrictions**: Strictly forbids security-altering PRAGMAs (`writable_schema`, `load_extension`, `cache_spill`). Only safe introspection PRAGMAs are permitted.
- **Filesystem Isolation**: Forbids `ATTACH`, `DETACH`, and path traversal.
- **Execution Timeouts**: SQLite virtual machine progress handler interrupts tight loops or runaway queries after 5.0 seconds.
- **Result Row Limits**: Returns up to 1,000 rows with clear `has_more` indicators to prevent browser crashes on huge datasets.
- **Transactional Safety**: Write queries run inside explicit transactions (`BEGIN IMMEDIATE`) with automatic rollback on error.
- **Destructive Operation Confirmations**: Prompts user confirmation for `DROP TABLE`, `DROP INDEX`, or `DELETE` without `WHERE`.

### 4. Interactive Query Plan Visualizer & Optimizer
- **Dual Visual Modes**:
  - **Interactive Flow Graph**: Connected React Flow graph with custom nodes, glowing severity borders, bezier edges, and zoom/pan controls.
  - **Tree List**: Hierarchical expandable tree view with collapsible nodes and indentation guides.
- **Plan Node Classifications**:
  - `SCAN` (Critical): Full sequential table scan (O(N) operation).
  - `SEARCH INDEX` (Good): B-Tree index lookup (O(log N) access).
  - `COVERING INDEX` (Optimal): Covering index search satisfying query directly from index pages without table heap fetches.
  - `ROWID LOOKUP` (Optimal): Direct integer primary key lookup.
  - `TEMP B-TREE` (Warning): In-memory temporary B-Tree sort or aggregation.
  - `SUBQUERY` (Critical): Correlated subquery warning.
- **Plain-Language Explanations**: Node inspection card explaining what the SQLite Virtual Machine is actually doing at each step.
- **Health Score & Advisor**:
  - Comprehensive 0-100 Plan Health Score.
  - Actionable recommendations (e.g., `CREATE INDEX idx_orders_status ON orders(status);`).
  - **One-Click "Apply Suggested Index"**: Instantly executes the recommended index DDL and automatically re-evaluates the query plan, letting you watch the health score jump from 55 to 95!
- **Plan Comparison**:
  - Save any plan as **Baseline**.
  - Compare baseline vs updated plan side-by-side with diff metrics (Table Scans eliminated, Indexes added, Score improvement, and Optimization Verdict).

### 5. Results & Exports
- **Interactive Results Table**: Column sorting, pagination, and instant client-side text filtering.
- **CSV Export**: One-click export downloading query results as a CSV file.
- **Execution Metadata Bar**: Displays execution ID, monotonic runtime in milliseconds, rows affected/returned, statement type, and timestamp.
- **Saved Queries & History**: Persistent storage in `querylens_meta.db` with one-click reload into active worksheet tabs.

---

## 🏃 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Run the Backend Server
```bash
python run.py
```
*Backend runs on `http://127.0.0.1:8000` (Swagger docs available at `http://127.0.0.1:8000/docs`).*

### 4. Run the Frontend Dev Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Running Automated Tests

QueryLens includes an automated test suite verifying query execution, plan analysis, security boundaries, and API endpoints:

```bash
cd backend
python -m pytest -v
```

**Test Coverage Summary**:
- `test_select_query_execution`: Verified read-only execution with PRAGMA query_only=ON.
- `test_multi_statement_blocked`: Verified multiple statements in a single execution are blocked.
- `test_attach_database_blocked`: Verified ATTACH DATABASE is forbidden.
- `test_load_extension_blocked`: Verified load_extension is blocked.
- `test_destructive_confirmation_required`: Verified DROP TABLE requires explicit confirmation.
- `test_write_and_rollback`: Verified transactional rollback and write safety.
- `test_explain_table_scan`: Verified detection of table scan on `orders` and suggestion generation.
- `test_explain_indexed_search`: Verified detection of indexed search on `customer_id`.
- `test_explain_temp_btree_sort`: Verified detection of temporary B-tree for ORDER BY.
- `test_plan_comparison`: Verified side-by-side diff calculations between two plans.
- `test_api_health`, `test_list_databases`, `test_get_database_detail`, `test_execute_endpoint`, `test_explain_endpoint`, `test_saved_queries_crud`, `test_format_sql`: Verified all HTTP API endpoints.

---

## 📐 Project Structure

```
DAY4/
├── run.py                          # Root runner script for FastAPI backend
├── README.md                       # Complete documentation and setup guide
├── backend/
│   ├── pytest.ini                  # Pytest configuration
│   ├── requirements.txt            # Python dependencies
│   ├── app/
│   │   ├── main.py                 # FastAPI application entrypoint
│   │   ├── core/
│   │   │   ├── config.py           # Workstation configuration & bounds
│   │   │   └── security.py         # Statement parser, sanitizer, & security validator
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic models for API & execution engine
│   │   ├── services/
│   │   │   ├── db_manager.py       # SQLite database & table introspection
│   │   │   ├── executor.py         # Safe execution service with timeout & transaction control
│   │   │   ├── plan_analyzer.py    # SQLite query plan parser, AST analysis, & optimization advisor
│   │   │   └── sample_data.py      # E-commerce and University sample DB generators
│   │   └── api/
│   │       ├── databases.py        # Database listing, creation, reset, schema introspection
│   │       ├── execute.py          # Query execution endpoint
│   │       ├── explain.py          # Query plan analysis & comparison endpoints
│   │       ├── saved_queries.py    # Saved queries CRUD
│   │       ├── history.py          # Execution history endpoints
│   │       └── format.py           # SQL formatting endpoint
│   ├── data/
│   │   ├── databases/              # Sandboxed SQLite databases (ecommerce.db, university.db)
│   │   └── querylens_meta.db       # QueryLens metadata (saved queries & history)
│   └── tests/
│       ├── test_executor.py        # Security & execution unit tests
│       ├── test_plan_analyzer.py   # Plan parsing & comparison tests
│       └── test_api.py             # FastAPI integration tests
└── frontend/
    ├── package.json                # Frontend dependencies & scripts
    ├── vite.config.ts              # Vite configuration with proxy
    ├── tsconfig.json               # TypeScript configuration
    ├── index.html                  # HTML template with Google Fonts
    └── src/
        ├── index.css               # Graphite Observatory CSS design system
        ├── main.tsx                # React root mount
        ├── App.tsx                 # Desktop 3-region workspace layout
        ├── types/                  # TypeScript interface definitions
        ├── api/                    # Typed API client
        └── components/
            ├── DatabaseExplorer/   # DatabaseSelector, TableList, SavedQueriesDrawer, HistoryDrawer
            ├── SqlEditor/          # QueryTabs, EditorToolbar, SqlCodeEditor
            ├── ResultsPanel/       # ResultsTable, ExecutionMetadataBar
            ├── QueryPlanInspector/ # PlanVisualizer, PlanFlowGraph, PlanTreeView, PlanNodeDetails, PlanLegend, OptimizationAdviser
            └── Modals/             # TableSampleModal, NewDatabaseModal, AddIndexModal, SaveQueryModal, ShortcutsModal, ConfirmDestructiveModal, PlanComparisonModal
```

---

## 🛡️ Security Architecture

QueryLens implements strict defense-in-depth controls for database exploration:
1. **Sandboxed Directory**: All database access is confined to `backend/data/databases/`. Path traversal sequences (`..`, `/`, `\`) are blocked before database file resolution.
2. **Read-Only Enforced Pragmas**: Read-only queries (`SELECT`, `WITH`, `VALUES`) enable `PRAGMA query_only = ON;` at the SQLite engine level before evaluation.
3. **Hardware & VM Timeout**: A custom progress handler (`conn.set_progress_handler(..., 500)`) interrupts query execution if runtime exceeds 5.0 seconds.
4. **Result Quotas**: Fetches are capped at 1,000 rows with a `has_more` flag to prevent memory exhaustion.
5. **No Dangerous Pragmas**: Modifying SQLite configuration or loading dynamic shared libraries (`load_extension`) is rejected at statement parsing time.

---

## 📜 License
QueryLens is built as an open-source database developer tool.
# query-lens
