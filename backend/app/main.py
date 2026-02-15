"""
Smirkle Backend API

Minimal FastAPI backend service compatible with Vercel Python 3.14 runtime.
All ML tasks (face/emotion/smile detection) are handled client-side.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import router as api_router
from .config import settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Smirkle Backend API...")
    logger.info("ML detection is handled client-side")

    yield

    # Shutdown
    logger.info("Shutting down Smirkle Backend API...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Smirkle Backend API - Minimal Backend for Smirkle "Try Not to Laugh" Game

    ## Overview

    This is a minimal backend API that supports the Smirkle game.
    All ML tasks (face/emotion/smile detection) are now handled client-side
    using TensorFlow.js in the browser for Vercel Python 3.14 compatibility.

    ## Features

    - **Health Checks**: Verify API status
    - **Session Management**: Create and manage game sessions
    - **CORS Support**: Enable cross-origin requests for frontend

    ## Architecture

    - Frontend: React + TensorFlow.js (client-side ML)
    - Backend: FastAPI on Vercel (non-ML operations)

    ## Integration

    See the frontend repository for React component examples.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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
            "detail": str(exc) if settings.debug else None,
        },
    )


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get(
    "/",
    tags=["Root"],
    summary="API Root",
    description="API root endpoint with basic information.",
)
async def root():
    """Return basic API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health",
        "note": "ML detection is handled client-side",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
