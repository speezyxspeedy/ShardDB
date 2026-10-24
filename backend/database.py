"""
Database configuration and session management for NodeFlow.
Uses SQLite with SQLAlchemy.
"""

import os
# pyrefly: ignore[missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore[missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nodeflow.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# check_same_thread=False allows FastAPI multi-threaded requests with SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
    # connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
