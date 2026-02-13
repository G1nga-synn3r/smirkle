"""
Backend API tests for the FastAPI backend.
"""
import pytest
import sys
import os

# Add backend directory to path for imports
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint returns basic API info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    # Verify key fields exist
    assert "name" in data
    assert data["status"] == "running"


def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_info_endpoint():
    """Test the info endpoint returns version info."""
    response = client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "api_version" in data
    assert data["api_version"] == "v1"


def test_session_creation():
    """Test creating a new session."""
    response = client.post("/api/v1/session/create", json={"user_id": "test_user"})
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "active"


def test_session_status():
    """Test getting session status with valid UUID."""
    import uuid
    session_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/session/{session_id}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id
    assert data["status"] == "active"


def test_session_status_invalid_uuid():
    """Test session status with invalid UUID returns 400."""
    response = client.get("/api/v1/session/invalid-uuid/status")
    assert response.status_code == 400


def test_end_session():
    """Test ending a session."""
    import uuid
    session_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/session/{session_id}/end")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id
    assert data["status"] == "ended"
