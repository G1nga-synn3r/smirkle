"""
Smirkle API Request/Response Schemas
Pydantic models for API validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class DetectionStatus(str, Enum):
    """Status of face/emotion detection."""
    SUCCESS = "success"
    ERROR = "error"
    NO_FACE_DETECTED = "no_face_detected"


class GameOverReason(str, Enum):
    """Reasons for game over."""
    SMIRK_DETECTED = "smirk_detected"
    FACE_LOST = "face_lost"
    TIMEOUT = "timeout"
    USER_REQUESTED = "user_requested"


class SmirkReason(str, Enum):
    """Reasons for smirk detection."""
    THRESHOLD_EXCEEDED = "threshold_exceeded"
    CONSECUTIVE_FRAMES = "consecutive_frames"
    PUNCHLINE_WINDOW = "punchline_window"


# =======================
# Request Schemas
# =======================

class FrameRequest(BaseModel):
    """Request to analyze a single frame for emotions."""
    frame: str = Field(
        ..., 
        description="Base64-encoded JPEG image frame from webcam",
        examples=["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."]
    )
    session_id: str = Field(
        ..., 
        description="Game session identifier",
        examples=["550e8400-e29b-41d4-a716-446655440000"]
    )
    timestamp: float = Field(
        ..., 
        description="Client-side timestamp in milliseconds",
        examples=[1699999999123.45]
    )
    frame_number: int = Field(
        default=0,
        description="Sequential frame number for ordering",
        examples=[42]
    )
    quality_check: bool = Field(
        default=True,
        description="Whether client performed quality check before sending"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": 1699999999123.45,
                "frame_number": 42,
                "quality_check": True
            }
        }


class MultipartFrameRequest(BaseModel):
    """Multipart file upload for frame analysis."""
    session_id: str = Field(..., description="Game session identifier")
    timestamp: float = Field(..., description="Client-side timestamp in milliseconds")
    frame_number: int = Field(default=0, description="Sequential frame number")
    quality_check: bool = Field(default=True)


class HealthRequest(BaseModel):
    """Optional request body for health check with model details."""
    include_model_info: bool = Field(
        default=False,
        description="Include detailed model information in response"
    )


# =======================
# Response Schemas
# =======================

class FaceData(BaseModel):
    """Face detection metadata."""
    bounding_box: Optional[Dict[str, float]] = Field(
        default=None,
        description="Face bounding box coordinates"
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
        description="Face detection confidence score"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "bounding_box": {"x": 150, "y": 80, "width": 200, "height": 240},
                "confidence": 0.95
            }
        }


class EmotionsResponse(BaseModel):
    """Emotion probability distribution."""
    happy: float = Field(..., ge=0, le=1, description="Happiness score")
    sad: float = Field(..., ge=0, le=1, description="Sadness score")
    angry: float = Field(..., ge=0, le=1, description="Anger score")
    surprise: float = Field(..., ge=0, le=1, description="Surprise score")
    fear: float = Field(..., ge=0, le=1, description="Fear score")
    disgust: float = Field(..., ge=0, le=1, description="Disgust score")
    neutral: float = Field(..., ge=0, le=1, description="Neutral score")
    
    class Config:
        json_schema_extra = {
            "example": {
                "happy": 0.12,
                "sad": 0.05,
                "angry": 0.02,
                "surprise": 0.03,
                "fear": 0.01,
                "disgust": 0.01,
                "neutral": 0.76
            }
        }


class DetectionResponse(BaseModel):
    """Response from emotion detection API."""
    status: DetectionStatus = Field(..., description="Detection status")
    session_id: str = Field(..., description="Game session identifier")
    detection_id: str = Field(..., description="Unique detection result ID")
    timestamp: float = Field(..., description="Server-side timestamp")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    
    # Face Detection
    face_detected: bool = Field(..., description="Whether a face was detected")
    face_data: Optional[FaceData] = Field(None, description="Face detection metadata")
    
    # Emotion Analysis
    emotions: Optional[EmotionsResponse] = Field(None, description="Emotion probabilities")
    happiness: Optional[float] = Field(None, ge=0, le=1, description="Primary happiness score")
    
    # Smirk Detection
    is_smirk: bool = Field(default=False, description="Whether smirk was detected")
    smirk_reason: Optional[SmirkReason] = Field(None, description="Reason for smirk detection")
    consecutive_smirk_count: int = Field(default=0, description="Consecutive smirk frames")
    
    # Game Control
    game_over: bool = Field(default=False, description="Whether game should end")
    game_over_reason: Optional[GameOverReason] = Field(None, description="Game over reason")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "detection_id": "550e8400-e29b-41d4-a716-446655440001",
                "timestamp": 1699999999456.78,
                "processing_time_ms": 15.2,
                "face_detected": True,
                "face_data": {
                    "bounding_box": {"x": 150, "y": 80, "width": 200, "height": 240},
                    "confidence": 0.95
                },
                "emotions": {
                    "happy": 0.12,
                    "sad": 0.05,
                    "angry": 0.02,
                    "surprise": 0.03,
                    "fear": 0.01,
                    "disgust": 0.01,
                    "neutral": 0.76
                },
                "happiness": 0.12,
                "is_smirk": False,
                "consecutive_smirk_count": 0,
                "game_over": False,
                "game_over_reason": None
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Overall service health")
    model_loaded: bool = Field(..., description="Whether emotion model is loaded")
    model_name: str = Field(..., description="Name of loaded model")
    model_version: Optional[str] = Field(None, description="Model version")
    uptime_seconds: float = Field(..., description="Server uptime in seconds")
    detection_threshold: float = Field(..., description="Smirk detection threshold")
    supported_emotions: List[str] = Field(..., description="Supported emotion labels")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "model_loaded": True,
                "model_name": "VGG-Face",
                "model_version": "1.0",
                "uptime_seconds": 3600.5,
                "detection_threshold": 0.3,
                "supported_emotions": ["happy", "sad", "angry", "surprise", "fear", "disgust", "neutral"],
                "timestamp": "2026-02-11T09:23:35.411Z"
            }
        }


class ErrorResponse(BaseModel):
    """Error response."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "NO_FACE_DETECTED",
                "message": "No face was detected in the provided image",
                "details": {"frame_quality": "good"},
                "timestamp": "2026-02-11T09:23:35.411Z"
            }
        }


class ModelInfoResponse(BaseModel):
    """Information about available emotion recognition models."""
    available_models: List[Dict[str, str]] = Field(..., description="Available recognition models")
    available_detectors: List[str] = Field(..., description="Available face detectors")
    current_model: str = Field(..., description="Currently loaded model")
    current_detector: str = Field(..., description="Currently loaded detector")
    
    class Config:
        json_schema_extra = {
            "example": {
                "available_models": [
                    {"name": "VGG-Face", "accuracy": "high"},
                    {"name": "Facenet", "accuracy": "high"},
                    {"name": "ArcFace", "accuracy": "high"}
                ],
                "available_detectors": ["opencv", "ssd", "dlib", "mtcnn", "retinaface"],
                "current_model": "VGG-Face",
                "current_detector": "opencv"
            }
        }
