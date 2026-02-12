"""
Health check endpoint for Vercel serverless deployment.
"""

from datetime import datetime

def main(request):
    """
    Health check endpoint.
    
    Args:
        request: Vercel request object
        
    Returns:
        JSON response with health status
    """
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_name": "emotion",
        "model_version": "1.0",
        "uptime_seconds": 0,
        "detection_threshold": 0.5,
        "supported_emotions": ["happy", "sad", "angry", "surprise", "fear", "disgust", "neutral"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
