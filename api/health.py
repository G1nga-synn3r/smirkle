"""
Health check endpoint for Vercel serverless deployment.
"""

from datetime import datetime, timezone


def main(request):
    """
    Health check endpoint.

    Note: This backend provides session management and API routing.
    Actual emotion detection runs client-side using MediaPipe.

    Args:
        request: Vercel request object

    Returns:
        JSON response with health status
    """
    return {
        "status": "healthy",
        "model_loaded": False,
        "model_name": "client-side-mediapipe",
        "model_version": "1.0",
        "uptime_seconds": 0,
        "detection_threshold": 0.5,
        "supported_emotions": [
            "happy",
            "sad",
            "angry",
            "surprise",
            "fear",
            "disgust",
            "neutral",
        ],
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "note": "Emotion detection is performed client-side using MediaPipe FaceLandmarker",
    }
