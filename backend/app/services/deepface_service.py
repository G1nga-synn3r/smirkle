"""
DeepFace Service - Emotion Recognition

Wrapper around DeepFace library for facial emotion detection.
Handles model loading, frame processing, and smirk detection.
"""

import base64
import io
import uuid
import time
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime

import numpy as np
from PIL import Image
from deepface import DeepFace

from ..config import settings

logger = logging.getLogger(__name__)

# Emotion labels supported by DeepFace
SUPPORTED_EMOTIONS = ["happy", "sad", "angry", "surprise", "fear", "disgust", "neutral"]

# Available model names
AVAILABLE_MODELS = ["VGG-Face", "Facenet", "Facenet512", "OpenFace", "DeepFace", "DeepID", "ArcFace", "Dlib"]

# Available detector backends
AVAILABLE_DETECTORS = ["opencv", "ssd", "dlib", "mtcnn", "retinaface", "mediapipe", "yolov8"]


class DeepFaceService:
    """
    Service for facial emotion detection using DeepFace.
    
    Provides:
    - Frame analysis for emotion detection
    - Smirk detection based on happiness threshold
    - Consecutive frame validation
    - Face bounding box extraction
    """
    
    def __init__(
        self,
        model_name: str = None,
        detector_backend: str = None,
        smirk_threshold: float = None,
        consecutive_frames_required: int = None
    ):
        """
        Initialize the DeepFace service.
        
        Args:
            model_name: DeepFace model to use (default: from settings)
            detector_backend: Face detector backend (default: from settings)
            smirk_threshold: Happiness threshold for smirk detection (default: 0.3)
            consecutive_frames_required: Frames required for confirmation (default: 3)
        """
        self.model_name = model_name or settings.deepface_model
        self.detector_backend = detector_backend or settings.deepface_detector
        self.smirk_threshold = smirk_threshold or settings.smirk_threshold
        self.consecutive_frames_required = consecutive_frames_required or settings.consecutive_frames_required
        
        self._model = None
        self._model_loaded = False
        self._start_time = None
        
    @property
    def is_model_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self._model_loaded
    
    @property
    def uptime_seconds(self) -> float:
        """Get service uptime in seconds."""
        if self._start_time is None:
            return 0.0
        return time.time() - self._start_time
    
    def load_model(self) -> bool:
        """
        Load the DeepFace model.
        
        Returns:
            True if model loaded successfully, False otherwise.
        """
        try:
            logger.info(f"Loading DeepFace model: {self.model_name}")
            self._model = DeepFace.build_model(self.model_name)
            self._model_loaded = True
            self._start_time = time.time()
            logger.info(f"DeepFace model {self.model_name} loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to load DeepFace model: {e}")
            self._model_loaded = False
            return False
    
    def _decode_base64_image(self, base64_string: str) -> np.ndarray:
        """
        Decode a base64-encoded image string to numpy array.
        
        Args:
            base64_string: Base64-encoded image (with or without data URI prefix)
            
        Returns:
            numpy.ndarray image array
        """
        # Remove data URI prefix if present
        if base64_string.startswith("data:image"):
            base64_string = base64_string.split(",")[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Convert to numpy array
        return np.array(image)
    
    def _normalize_emotions(self, emotion_dict: Dict[str, float]) -> Dict[str, float]:
        """
        Normalize emotion probabilities to 0-1 range.
        DeepFace returns percentages, convert to probabilities.
        
        Args:
            emotion_dict: Dictionary of emotion labels to percentages
            
        Returns:
            Dictionary of emotion labels to probabilities (0-1)
        """
        return {
            label: round(value / 100.0, 4)
            for label, value in emotion_dict.items()
        }
    
    def _extract_bounding_box(self, region: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract bounding box coordinates from DeepFace region data.
        
        Args:
            region: Region dictionary from DeepFace analysis
            
        Returns:
            Dictionary with x, y, width, height
        """
        return {
            "x": float(region.get("x", 0)),
            "y": float(region.get("y", 0)),
            "w": float(region.get("w", 0)),
            "h": float(region.get("h", 0))
        }
    
    def analyze_frame(
        self,
        frame_data: str,
        session_id: str,
        client_timestamp: float,
        frame_number: int = 0
    ) -> Dict[str, Any]:
        """
        Analyze a single frame for facial emotions.
        
        Args:
            frame_data: Base64-encoded image frame from webcam
            session_id: Game session identifier
            client_timestamp: Client-side timestamp in milliseconds
            frame_number: Sequential frame number
            
        Returns:
            Dictionary containing detection results
        """
        start_time = time.time()
        detection_id = str(uuid.uuid4())
        server_timestamp = datetime.utcnow().isoformat() + "Z"
        
        try:
            # Decode the image
            image = self._decode_base64_image(frame_data)
            
            # Perform emotion analysis with DeepFace
            result = DeepFace.analyze(
                img_path=image,
                actions=["emotion"],
                enforce_detection=settings.enforce_detection,
                detector_backend=self.detector_backend,
                silent=True
            )
            
            # Handle list result (DeepFace may return list for multiple faces)
            if isinstance(result, list):
                result = result[0]  # Use first face for single-player game
            
            # Extract emotion data
            raw_emotions = result.get("emotion", {})
            normalized_emotions = self._normalize_emotions(raw_emotions)
            happiness = normalized_emotions.get("happy", 0.0)
            
            # Check for smirk (happiness >= threshold)
            is_smirk = happiness >= self.smirk_threshold
            
            # Extract face bounding box
            face_region = result.get("region", {})
            face_data = {
                "bounding_box": self._extract_bounding_box(face_region),
                "confidence": float(result.get("confidence", 1.0))
            }
            
            processing_time_ms = (time.time() - start_time) * 1000
            
            return {
                "status": "success",
                "session_id": session_id,
                "detection_id": detection_id,
                "timestamp": client_timestamp,
                "server_timestamp": server_timestamp,
                "processing_time_ms": round(processing_time_ms, 2),
                "face_detected": True,
                "face_data": face_data,
                "emotions": normalized_emotions,
                "happiness": happiness,
                "is_smirk": is_smirk,
                "smirk_reason": "threshold_exceeded" if is_smirk else None,
                "consecutive_smirk_count": 0,  # Caller should track this
                "game_over": False,
                "game_over_reason": None
            }
            
        except ValueError as e:
            # No face detected
            error_message = str(e).lower()
            if "no face detected" in error_message or "face could not be detected" in error_message:
                processing_time_ms = (time.time() - start_time) * 1000
                return {
                    "status": "no_face_detected",
                    "session_id": session_id,
                    "detection_id": detection_id,
                    "timestamp": client_timestamp,
                    "server_timestamp": server_timestamp,
                    "processing_time_ms": round(processing_time_ms, 2),
                    "face_detected": False,
                    "face_data": None,
                    "emotions": None,
                    "happiness": None,
                    "is_smirk": False,
                    "smirk_reason": None,
                    "consecutive_smirk_count": 0,
                    "game_over": False,
                    "game_over_reason": None,
                    "error_details": {
                        "message": "No face detected in the image",
                        "quality_check_recommended": True
                    }
                }
            raise
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            processing_time_ms = (time.time() - start_time) * 1000
            return {
                "status": "error",
                "session_id": session_id,
                "detection_id": detection_id,
                "timestamp": client_timestamp,
                "server_timestamp": server_timestamp,
                "processing_time_ms": round(processing_time_ms, 2),
                "face_detected": False,
                "face_data": None,
                "emotions": None,
                "happiness": None,
                "is_smirk": False,
                "smirk_reason": None,
                "consecutive_smirk_count": 0,
                "game_over": False,
                "game_over_reason": None,
                "error_details": {
                    "message": str(e),
                    "type": type(e).__name__
                }
            }
    
    def analyze_image_file(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze an image file for facial emotions.
        Useful for testing and debugging.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary containing detection results
        """
        try:
            result = DeepFace.analyze(
                img_path=image_path,
                actions=["emotion"],
                enforce_detection=settings.enforce_detection,
                detector_backend=self.detector_backend,
                silent=True
            )
            
            if isinstance(result, list):
                result = result[0]
            
            raw_emotions = result.get("emotion", {})
            normalized_emotions = self._normalize_emotions(raw_emotions)
            
            return {
                "status": "success",
                "emotions": normalized_emotions,
                "happiness": normalized_emotions.get("happy", 0.0),
                "is_smirk": normalized_emotions.get("happy", 0.0) >= self.smirk_threshold,
                "face_region": result.get("region")
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model configuration.
        
        Returns:
            Dictionary with model information
        """
        return {
            "current_model": self.model_name,
            "current_detector": self.detector_backend,
            "model_loaded": self._model_loaded,
            "smirk_threshold": self.smirk_threshold,
            "consecutive_frames_required": self.consecutive_frames_required,
            "supported_emotions": SUPPORTED_EMOTIONS,
            "available_models": AVAILABLE_MODELS,
            "available_detectors": AVAILABLE_DETECTORS,
            "uptime_seconds": round(self.uptime_seconds, 2)
        }


# Singleton instance
_deepface_service: Optional[DeepFaceService] = None


def get_deepface_service() -> DeepFaceService:
    """Get or create the DeepFace service singleton."""
    global _deepface_service
    if _deepface_service is None:
        _deepface_service = DeepFaceService()
    return _deepface_service


def init_deepface_service() -> bool:
    """Initialize the DeepFace service and load the model."""
    service = get_deepface_service()
    return service.load_model()
