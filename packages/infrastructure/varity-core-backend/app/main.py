"""
Varity Core Backend - FastAPI Application

Main entry point for the Varity gas tracking and billing API.

Start with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime

# Import API routes
from app.api.v1 import gas_tracking

# Create FastAPI app
app = FastAPI(
    title="Varity Core Backend API",
    description="Gas tracking and billing API for Varity SDK",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev
        "http://localhost:5173",      # Vite dev
        "https://*.varity.so",        # Production
        "https://*.vercel.app",       # Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(
    gas_tracking.router,
    prefix="/v1",
    tags=["Gas Tracking"],
)


# =====================================================================
# Root Endpoints
# =====================================================================

@app.get("/")
async def root():
    """
    API root endpoint

    Returns service information and available endpoints.
    """
    return {
        "service": "Varity Core Backend API",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "gas_tracking": {
                "track": "POST /v1/gas-tracking",
                "app_usage": "GET /v1/gas-tracking/{app_id}/usage",
                "developer_summary": "GET /v1/billing/{developer_wallet}/summary",
                "health": "GET /v1/gas-tracking/health",
            },
        },
    }


@app.get("/health")
async def health_check():
    """
    Service health check

    Used by load balancers and monitoring systems.
    """
    return {
        "status": "healthy",
        "service": "varity-core-backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "N/A",  # TODO: Track uptime
    }


# =====================================================================
# Error Handlers
# =====================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 Not Found errors"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"The requested endpoint does not exist: {request.url.path}",
            "docs": "/docs",
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 Internal Server errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )


# =====================================================================
# Startup/Shutdown Events
# =====================================================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup

    Initialize database connections, load configurations, etc.
    """
    print("=" * 60)
    print("🚀 Varity Core Backend API - Starting up...")
    print("=" * 60)
    print(f"Environment: {os.getenv('ENV', 'development')}")
    print(f"API Version: 1.0.0")
    print(f"Docs: http://localhost:8000/docs")
    print("=" * 60)

    # TODO: Initialize MongoDB connection
    # from app.models.gas_usage import setup_database
    # await setup_database(db)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown

    Close database connections, cleanup resources, etc.
    """
    print("=" * 60)
    print("👋 Varity Core Backend API - Shutting down...")
    print("=" * 60)

    # TODO: Close MongoDB connection


# =====================================================================
# Development Server
# =====================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
