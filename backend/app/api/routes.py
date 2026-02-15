"""
Smirkle API Routes

FastAPI route handlers for non-ML backend services.
All ML tasks (face/emotion/smile detection) are now handled client-side.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


# =======================
# Health & Info Endpoints
# =======================

class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    version: str
    timestamp: str
    service: str = "smirkle-backend"


class VersionInfo(BaseModel):
    """Version information response."""
    version: str
    api_version: str
    environment: str


@router.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health Check",
    description="Check if the API is healthy and running."
)
async def health_check():
    """
    Health check endpoint to verify API status.

    Returns:
        HealthResponse with service status
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "service": "smirkle-backend",
    }


@router.get(
    "/info",
    response_model=VersionInfo,
    tags=["Info"],
    summary="Version Information",
    description="Get version information about the API."
)
async def get_version_info():
    """
    Get version and environment information.
    
    Returns:
        VersionInfo with version details
    """
    return {
        "version": "1.0.0",
        "api_version": "v1",
        "environment": "production"
    }


# =======================
# Placeholder Endpoints (for future non-ML features)
# =======================

class SessionCreateRequest(BaseModel):
    """Session creation request."""
    user_id: str
    game_type: str = "standard"


class SessionCreateResponse(BaseModel):
    """Session creation response."""
    session_id: str
    created_at: str
    status: str


@router.post(
    "/session/create",
    response_model=SessionCreateResponse,
    tags=["Session"],
    summary="Create Game Session",
    description="Create a new game session for tracking gameplay."
)
async def create_session(request: SessionCreateRequest):
    """
    Create a new game session.

    Args:
        request: Session creation request with user_id and game_type

    Returns:
        SessionCreateResponse with session_id and status
    """
    session_id = str(uuid.uuid4())

    return {
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status": "active",
    }


@router.get(
    "/session/{session_id}/status",
    tags=["Session"],
    summary="Session Status",
    description="Get the current status of a game session."
)
async def get_session_status(session_id: str):
    """
    Get the current status of a game session.

    Args:
        session_id: Game session identifier

    Returns:
        Session status information
    """
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_SESSION_ID",
                "message": "Invalid session ID format",
            },
        )

    return {
        "session_id": session_id,
        "status": "active",
        "message": "Session is active. ML detection is handled client-side.",
    }


@router.delete(
    "/session/{session_id}/end",
    tags=["Session"],
    summary="End Session",
    description="End a game session."
)
async def end_session(session_id: str):
    """
    End a game session.

    Args:
        session_id: Game session identifier

    Returns:
        Confirmation of session end
    """
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_SESSION_ID",
                "message": "Invalid session ID format",
            },
        )

    return {
        "session_id": session_id,
        "status": "ended",
        "message": "Session has been ended successfully",
    }
