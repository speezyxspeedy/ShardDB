import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Agent, TicketCounter

# Use an in-memory SQLite database with shared cache or a dedicated test db file
TEST_DATABASE_URL = "sqlite:///./test_helpdeskx.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Clean previous test database if exists
    if os.path.exists("./test_helpdeskx.db"):
        try:
            os.remove("./test_helpdeskx.db")
        except OSError:
            pass

    Base.metadata.create_all(bind=test_engine)
    
    # Pre-seed test agent
    db = TestingSessionLocal()
    agent = Agent(
        name="Test Agent",
        email="testagent@helpdeskx.io",
        role="Senior Specialist",
        avatar_color="#2563eb",
        is_active=True,
    )
    db.add(agent)
    counter = TicketCounter(id=1, next_number=1001)
    db.add(counter)
    db.commit()
    db.close()

    yield

    # Cleanup after test suite
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_helpdeskx.db"):
        try:
            os.remove("./test_helpdeskx.db")
        except OSError:
            pass


@pytest.fixture
def db_session():
    """Provides a transactional database session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
