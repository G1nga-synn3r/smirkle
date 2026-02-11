"""
Smirkle API Routes

FastAPI route handlers for emotion recognition and game-related endpoints.
"""

import base64
import uuid
import time
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse

from .schemas import (
    FrameRequest,
    DetectionResponse,
    HealthResponse,
    ErrorResponse,
    ModelInfoResponse,
    DetectionStatus
)
from .services.deepface_service import (
    get_deepface_service,
    init_deepface_service,
    SUPPORTED_EMOTIONS
)
from ..config import settings

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


# Store for tracking consecutive smirk frames per session
_session_state = {}


def get_session_state(session_id: str) -> dict:
    """Get or create session state for tracking detection history."""
    if session_id not in _session_state:
        _session_state[session_id] = {
            "consecutive_smirk_count": 0,
            "last_detection_time": None,
            "smirk_detected_at": None
        }
    return _session_state[session_id]


def reset_session_state(session_id: str) -> None:
    """Reset session state (e.g., on non-smirk detection)."""
    if session_id in _session_state:
        _session_state[session_id]["consecutive_smirk_count"] = 0


# =======================
# Health & Info Endpoints
# =======================

@router.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health Check",
    description="Check if the API and DeepFace model are healthy and ready."
)
async def health_check():
    """
    Health check endpoint to verify API and model status.
    
    Returns:
        HealthResponse with service status and model information
    """
    service = get_deepface_service()
    
    return {
        "status": "healthy" if service.is_model_loaded else "unhealthy",
        "model_loaded": service.is_model_loaded,
        "model_name": service.model_name,
        "model_version": "1.0",
        "uptime_seconds": service.uptime_seconds,
        "detection_threshold": settings.smirk_threshold,
        "supported_emotions": SUPPORTED_EMOTIONS,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.get(
    "/models",
    response_model=ModelInfoResponse,
    tags=["Info"],
    summary="Model Information",
    description="Get information about available DeepFace models and current configuration."
)
async def get_model_info():
    """
    Get information about available DeepFace models and current configuration.
    
    Returns:
        ModelInfoResponse with model details
    """
    service = get_deepface_service()
    info = service.get_model_info()
    
    return {
        "available_models": [
            {"name": m, "accuracy": "high" if m in ["VGG-Face", "Facenet", "ArcFace"] else "medium"}
            for m in info["available_models"]
        ],
        "available_detectors": info["available_detectors"],
        "current_model": info["current_model"],
        "current_detector": info["current_detector"]
    }


# =======================
# Emotion Detection Endpoints
# =======================

@router.post(
    "/analyze-emotion",
    response_model=DetectionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Processing error"}
    },
    tags=["Detection"],
    summary="Analyze Emotion",
    description="Analyze a webcam frame for facial emotions and detect smirks."
)
async def analyze_emotion(request: FrameRequest):
    """
    Analyze a single frame from the webcam for facial emotions.
    
    This endpoint processes a base64-encoded image frame and returns
    emotion detection results including happiness score and smirk status.
    
    Args:
        request: FrameRequest with base64-encoded frame and metadata
        
    Returns:
        DetectionResponse with emotion analysis results
        
    Raises:
        HTTPException 400: If request is invalid
        HTTPException 500: If processing fails
    """
    # Validate session ID format
    try:
        uuid.UUID(request.session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_SESSION_ID",
                "message": "Invalid session ID format",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
    
    # Get DeepFace service
    service = get_deepface_service()
    
    if not service.is_model_loaded:
        # Try to load model on first request
        if not init_deepface_service():
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "MODEL_NOT_LOADED",
                    "message": "Emotion recognition model is not loaded. Please retry.",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
    
    try:
        # Analyze the frame
        result = service.analyze_frame(
            frame_data=request.frame,
            session_id=request.session_id,
            client_timestamp=request.timestamp,
            frame_number=request.frame_number
        )
        
        # Handle consecutive smirk detection
        session_state = get_session_state(request.session_id)
        
        if result["status"] == "success":
            if result["is_smirk"]:
                session_state["consecutive_smirk_count"] += 1
            else:
                session_state["consecutive_smirk_count"] = 0
            
            session_state["last_detection_time"] = request.timestamp
            
            # Check if consecutive threshold is met
            if session_state["consecutive_smirk_count"] >= settings.consecutive_frames_required:
                result["is_smirk"] = True
                result["smirk_reason"] = "consecutive_frames"
                result["game_over"] = True
                result["game_over_reason"] = "smirk_detected"
                session_state["smirk_detected_at"] = request.timestamp
        else:
            # Reset counter on no face or error
            session_state["consecutive_smirk_count"] = 0
        
        # Add consecutive count to response
        result["consecutive_smirk_count"] = session_state["consecutive_smirk_count"]
        
        # Validate response against schema
        response = DetectionResponse(**result)
        
        return response
        
    except Exception as e:
        logger.error(f"Error analyzing frame: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "PROCESSING_ERROR",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )


@router.post(
    "/analyze-emotion/upload",
    response_model=DetectionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Processing error"}
    },
    tags=["Detection"],
    summary="Analyze Emotion (Multipart)",
    description="Analyze an uploaded image file for facial emotions."
)
async def analyze_emotion_upload(
    session_id: str = Form(...),
    timestamp: float = Form(...),
    frame_number: int = Form(default=0),
    quality_check: bool = Form(default=True),
    file: UploadFile = File(...)
):
    """
    Analyze an uploaded image file for facial emotions.
    
    Alternative to base64 upload - accepts multipart file upload.
    
    Args:
        session_id: Game session identifier
        timestamp: Client-side timestamp in milliseconds
        frame_number: Sequential frame number
        quality_check: Whether client performed quality check
        file: Uploaded image file
        
    Returns:
        DetectionResponse with emotion analysis results
    """
    # Read file content
    content = await file.read()
    
    # Convert to base64
    base64_content = base64.b64encode(content).decode("utf-8")
    
    # Determine mime type and create data URI
    content_type = file.content_type or "image/jpeg"
    data_uri = f"data:{content_type};base64,{base64_content}"
    
    # Create request object
    request = FrameRequest(
        frame=data_uri,
        session_id=session_id,
        timestamp=timestamp,
        frame_number=frame_number,
        quality_check=quality_check
    )
    
    # Reuse the main endpoint logic
    return await analyze_emotion(request)


@router.get(
    "/session/{session_id}/status",
    tags=["Session"],
    summary="Session Status",
    description="Get the current status of a game session including smirk detection state."
)
async def get_session_status(session_id: str):
    """
    Get the current status of a game session.
    
    Args:
        session_id: Game session identifier
        
    Returns:
        Session status including consecutive smirk count
    """
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_SESSION_ID",
                "message": "Invalid session ID format"
            }
        )
    
    session_state = get_session_state(session_id)
    
    return {
        "session_id": session_id,
        "consecutive_smirk_count": session_state["consecutive_smirk_count"],
        "last_detection_time": session_state["last_detection_time"],
        "smirk_detected_at": session_state["smirk_detected_at"],
        "game_over": session_state["consecutive_smirk_count"] >= settings.consecutive_frames_required
    }


@router.delete(
    "/session/{session_id}/reset",
    tags=["Session"],
    summary="Reset Session",
    description="Reset a game session's detection state."
)
async def reset_session(session_id: str):
    """
    Reset a game session's detection state.
    
    Args:
        session_id: Game session identifier
        
    Returns:
        Confirmation of reset
    """
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_SESSION_ID",
                "message": "Invalid session ID format"
            }
        )
    
    reset_session_state(session_id)
    
    return {
        "session_id": session_id,
        "status": "reset",
        "message": "Session detection state has been reset"
    }


# =======================
# WebSocket Endpoint (Optional)
# =======================

async def websocket_endpoint(websocket):
    """
    WebSocket endpoint for real-time emotion detection.
    
    This enables streaming frame analysis for lower latency.
    
    Protocol:
    - Client sends: {"type": "frame", "frame": "<base64>", "timestamp": <ms>, "frame_number": <int>}
    - Server sends: {"type": "detection_result", ...<DetectionResponse>...}
    """
    await websocket.accept()
    
    service = get_deepface_service()
    
    if not service.is_model_loaded:
        await init_deepface_service()
    
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_json()
            
            if data.get("type") == "frame":
                frame_data = data.get("frame", "")
                session_id = data.get("session_id", "ws-session")
                timestamp = data.get("timestamp", time.time() * 1000)
                frame_number = data.get("frame_number", 0)
                
                # Analyze frame
                result = service.analyze_frame(
                    frame_data=frame_data,
                    session_id=session_id,
                    client_timestamp=timestamp,
                    frame_number=frame_number
                )
                
                # Handle consecutive detection
                session_state = get_session_state(session_id)
                
                if result["status"] == "success":
                    if result["is_smirk"]:
                        session_state["consecutive_smirk_count"] += 1
                    else:
                        session_state["consecutive_smirk_count"] = 0
                
                result["consecutive_smirk_count"] = session_state["consecutive_smirk_count"]
                
                # Send result
                await websocket.send_json({
                    "type": "detection_result",
                    "payload": result
                })
                
            elif data.get("type") == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": time.time() * 1000
                })
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()
