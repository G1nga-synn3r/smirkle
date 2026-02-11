"""
Smirkle Backend Configuration
Environment-based settings for the emotion recognition service.
"""

from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Smirkle Emotion Recognition API"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # DeepFace Configuration
    deepface_model: str = "VGG-Face"
    deepface_detector: str = "opencv"
    enforce_detection: bool = True
    
    # Smirk Detection
    smirk_threshold: float = 0.3
    smile_threshold: float = 0.5
    consecutive_frames_required: int = 3
    
    # Image Processing
    image_quality: int = 70  # JPEG quality (0-100)
    max_image_size: int = 1024  # Maximum image dimension
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Model Paths
    models_dir: str = "./models"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance
settings = get_settings()
