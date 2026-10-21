import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import Base, engine, SessionLocal, get_db
from app.seed import seed_database
from app.routers import tickets, messages, dashboard, agents

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="HelpDeskX API",
    description="Customer Support Ticket Management Platform Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Narrow CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(tickets.router)
app.include_router(messages.router)
app.include_router(dashboard.router)
app.include_router(agents.router)


@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint validating database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "app": "HelpDeskX",
        "version": "1.0.0",
        "database": db_status,
    }


# Mount static assets
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", include_in_schema=False)
def serve_agent_dashboard():
    """Serve the primary Support Agent Dashboard."""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return JSONResponse(status_code=404, content={"detail": "index.html not found"})


@app.get("/customer", include_in_schema=False)
@app.get("/customer.html", include_in_schema=False)
def serve_customer_portal():
    """Serve the Customer Support Portal."""
    customer_file = STATIC_DIR / "customer.html"
    if customer_file.exists():
        return FileResponse(str(customer_file))
    return JSONResponse(status_code=404, content={"detail": "customer.html not found"})


@app.get("/index.html", include_in_schema=False)
def serve_index_redirect():
    return serve_agent_dashboard()
