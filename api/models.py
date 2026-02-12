"""
Model information endpoint for Vercel serverless deployment.
"""

def main(request):
    """
    Get model information endpoint.
    
    Args:
        request: Vercel request object
        
    Returns:
        JSON response with model details
    """
    return {
        "available_models": [
            {"name": "VGG-Face", "accuracy": "high"},
            {"name": "Facenet", "accuracy": "high"},
            {"name": "ArcFace", "accuracy": "high"},
            {"name": "DeepFace", "accuracy": "medium"},
            {"name": "OpenFace", "accuracy": "medium"},
            {"name": "DeepID", "accuracy": "medium"}
        ],
        "available_detectors": ["opencv", "ssd", "dlib", "mtcnn", "retinaface"],
        "current_model": "emotion",
        "current_detector": "opencv"
    }
