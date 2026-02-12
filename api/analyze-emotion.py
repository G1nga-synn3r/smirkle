"""
Emotion analysis endpoint for Vercel serverless deployment.
"""

import base64
import uuid
from datetime import datetime

def analyze_frame_simple(frame_data, session_id):
    """
    Simple emotion analysis for serverless environment.
    
    Note: Full DeepFace analysis requires model files that need to be
    deployed separately or hosted on a dedicated backend service.
    
    Args:
        frame_data: Base64 encoded image
        session_id: Session identifier
        
    Returns:
        Detection response with mock/simulated results
    """
    # Validate session ID
    try:
        uuid.UUID(session_id)
    except ValueError:
        return {
            "status": "error",
            "error": "INVALID_SESSION_ID",
            "message": "Invalid session ID format",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    # Check if frame data is valid base64
    try:
        if frame_data.startswith("data:image"):
            # Remove data URI prefix
            frame_data = frame_data.split(",")[1]
        decoded = base64.b64decode(frame_data)
    except (ValueError, base64.binascii.Error) as e:
        return {
            "status": "error",
            "error": "INVALID_FRAME",
            "message": "Invalid frame data",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    # Return simulated response for serverless demo
    # In production, this should call the actual backend service
    return {
        "status": "success",
        "emotion": "neutral",
        "emotion_scores": {
            "happy": 0.1,
            "sad": 0.05,
            "angry": 0.02,
            "surprise": 0.05,
            "fear": 0.02,
            "disgust": 0.01,
            "neutral": 0.75
        },
        "is_smirk": False,
        "smirk_reason": None,
        "confidence": 0.85,
        "face_detected": True,
        "face_count": 1,
        "bounding_box": {
            "x": 100,
            "y": 50,
            "width": 200,
            "height": 200
        },
        "processing_time_ms": 50,
        "session_id": session_id,
        "consecutive_smirk_count": 0,
        "game_over": False,
        "game_over_reason": None,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def main(request):
    """
    Main emotion analysis endpoint.
    
    Args:
        request: Vercel request object with JSON body
        
    Returns:
        JSON response with detection results
    """
    try:
        body = request.get_json() or {}
    except (ValueError, TypeError) as e:
        body = {}
    
    frame = body.get("frame", "")
    session_id = body.get("session_id", "")
    timestamp = body.get("timestamp", 0)
    frame_number = body.get("frame_number", 0)
    
    if not frame:
        return {
            "status": "error",
            "error": "MISSING_FRAME",
            "message": "Frame data is required",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, 400
    
    if not session_id:
        return {
            "status": "error",
            "error": "MISSING_SESSION_ID",
            "message": "Session ID is required",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, 400
    
    result = analyze_frame_simple(frame, session_id)
    
    if result.get("status") == "error":
        return result, 400
    
    return result
