"""
Smirkle Emotion Recognition API

FastAPI-based backend service for facial emotion detection using DeepFace.
Provides REST and WebSocket endpoints for real-time smirk detection.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .api.routes import router as api_router
from .services.deepface_service import get_deepface_service, init_deepface_service

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Smirkle Emotion Recognition API...")
    logger.info(f"Model: {settings.deepface_model}")
    logger.info(f"Detector: {settings.deepface_detector}")
    logger.info(f"Smirk Threshold: {settings.smirk_threshold}")
    
    # Initialize DeepFace model
    service = get_deepface_service()
    if init_deepface_service():
        logger.info("DeepFace model loaded successfully")
    else:
        logger.warning("Failed to load DeepFace model on startup. Will load on first request.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Smirkle Emotion Recognition API...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Smirkle Emotion Recognition API - Backend for Smirkle "Try Not to Laugh" Game
    
    ## Overview
    
    This API provides facial emotion detection for the Smirkle game, 
    analyzing webcam frames to detect smiles/smirks and trigger game events.
    
    ## Features
    
    - **Real-time Emotion Analysis**: Detect happiness, sadness, anger, surprise, 
      fear, disgust, and neutral expressions
    - **Smirk Detection**: Identify when users smile/smirk (happiness >= 0.3)
    - **Consecutive Frame Validation**: Require multiple consecutive detections 
      to prevent false positives
    - **WebSocket Support**: Real-time streaming for lower latency
    - **Session Management**: Track game sessions and detection history
    
    ## Smirk Detection Logic
    
    1. Frontend captures webcam frames (JPEG, ~70% quality)
    2. Frames are sent to `/analyze-emotion` endpoint
    3. Backend uses DeepFace to analyze emotions
    4. Happiness score is extracted (0.0 - 1.0)
    5. If happiness >= 0.3, smirk is flagged
    6. Game ends after 3 consecutive smirk detections
    
    ## Integration
    
    See the [frontend integration guide](https://github.com/smirkle/smirkle-docs) 
    for React component examples.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle uncaught exceptions."""
    logger.error(f"Uncaught exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.debug else None
        }
    )


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get(
    "/",
    tags=["Root"],
    summary="API Root",
    description="API root endpoint with basic information."
)
async def root():
    """Return basic API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# Development endpoint: Reload model
@app.post(
    "/api/v1/admin/reload-model",
    tags=["Admin"],
    summary="Reload Model",
    description="Reload the DeepFace model (admin endpoint)."
)
async def reload_model():
    """Reload the DeepFace model."""
    service = get_deepface_service()
    success = init_deepface_service()
    
    if success:
        return {
            "status": "success",
            "message": "Model reloaded successfully",
            "model_name": service.model_name
        }
    else:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Failed to reload model"
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
