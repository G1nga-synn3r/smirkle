"""
Emotion analysis endpoint for Vercel serverless deployment.

IMPORTANT: This endpoint is deprecated for actual emotion detection.
Emotion detection is now performed client-side using MediaPipe FaceLandmarker.
This endpoint is kept for session management and validation purposes.
"""

import base64
import uuid
from datetime import datetime, timezone

def analyze_frame_simple(frame_data, session_id):
    """
    Session validation and echo endpoint.
    
    Note: This endpoint no longer performs emotion detection.
    Client-side MediaPipe handles all detection in real-time.
    This endpoint exists for backward compatibility and session validation.
    
    Args:
        frame_data: Base64 encoded image (ignored - not used)
        session_id: Session identifier
        
    Returns:
        Session validation response with acknowledgment
    """
    # Validate session ID
    try:
        uuid.UUID(session_id)
    except ValueError:
        return {
            "status": "error",
            "error": "INVALID_SESSION_ID",
            "message": "Invalid session ID format",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }
    
    # Check if frame data is valid base64 (validation only)
    try:
        if frame_data.startswith("data:image"):
            frame_data = frame_data.split(",")[1]
        decoded = base64.b64decode(frame_data)
    except (ValueError, base64.binascii.Error) as e:
        return {
            "status": "error",
            "error": "INVALID_FRAME",
            "message": "Invalid frame data",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }
    
    # Return acknowledgment - actual detection happens client-side
    return {
        "status": "success",
        "message": "Session validated",
        "note": "Emotion detection is performed client-side",
        "detection_mode": "client-side-mediapipe",
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
    }

def main(request):
    """
    Main endpoint for session validation.
    
    Args:
        request: Vercel request object with JSON body
        
    Returns:
        JSON response with session validation results
    """
    try:
        body = request.get_json() or {}
    except (ValueError, TypeError) as e:
        body = {}
    
    frame = body.get("frame", "")
    session_id = body.get("session_id", "")
    
    if not frame:
        return {
            "status": "error",
            "error": "MISSING_FRAME",
            "message": "Frame data is required",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }, 400
    
    if not session_id:
        return {
            "status": "error",
            "error": "MISSING_SESSION_ID",
            "message": "Session ID is required",
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }, 400
    
    result = analyze_frame_simple(frame, session_id)
    
    if result.get("status") == "error":
        return result, 400
    
    return result
