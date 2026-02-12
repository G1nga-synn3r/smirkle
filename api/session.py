"""
Session management endpoints for Vercel serverless deployment.

Note: Vercel Python functions use file-based routing. For dynamic routes,
we use query parameters or handle path parsing manually.
"""

import uuid
from datetime import datetime

# In-memory session storage for serverless environment
# Note: This will reset on each function invocation in serverless context
_session_store = {}

def get_session_state(session_id):
    """Get or create session state."""
    if session_id not in _session_store:
        _session_store[session_id] = {
            "consecutive_smirk_count": 0,
            "last_detection_time": None,
            "smirk_detected_at": None
        }
    return _session_store[session_id]

def reset_session_state(session_id):
    """Reset session state."""
    if session_id in _session_store:
        _session_store[session_id]["consecutive_smirk_count"] = 0
        _session_store[session_id]["last_detection_time"] = None
        _session_store[session_id]["smirk_detected_at"] = None

def main(request):
    """
    Session management endpoint.
    
    Query parameters:
    - action: "status" or "reset" (default: status)
    - session_id: Session identifier (required)
    
    Example:
    - GET /api/session?action=status&session_id=xxx -> Get session status
    - DELETE /api/session?session_id=xxx -> Reset session
    
    Args:
        request: Vercel request object
        
    Returns:
        JSON response with session information
    """
    # Get session_id from query params or body
    session_id = request.query.get("session_id") or (
        request.get_json().get("session_id") if request.method in ["POST", "PUT", "DELETE"] else None
    )
    
    # Determine action from query params or HTTP method
    action = request.query.get("action", "").lower() or (
        "reset" if request.method == "DELETE" else "status"
    )
    
    # Validate session ID
    if not session_id:
        return {
            "status": "error",
            "error": "MISSING_SESSION_ID",
            "message": "Session ID is required"
        }, 400
    
    try:
        uuid.UUID(session_id)
    except ValueError:
        return {
            "status": "error",
            "error": "INVALID_SESSION_ID",
            "message": "Invalid session ID format"
        }, 400
    
    session_state = get_session_state(session_id)
    
    if action == "reset":
        reset_session_state(session_id)
        return {
            "session_id": session_id,
            "status": "reset",
            "message": "Session detection state has been reset"
        }
    
    # Default: return status
    return {
        "session_id": session_id,
        "consecutive_smirk_count": session_state["consecutive_smirk_count"],
        "last_detection_time": session_state["last_detection_time"],
        "smirk_detected_at": session_state["smirk_detected_at"],
        "game_over": session_state["consecutive_smirk_count"] >= 3
    }
