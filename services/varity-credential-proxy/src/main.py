"""
Varity Credential Proxy - Main Application

SECURITY CRITICAL: This service provides Varity's internal infrastructure credentials
to the CLI for zero-config deployments.

Security Layers:
1. API Key Authentication
2. Rate Limiting
3. HTTPS Enforcement
4. Request Fingerprinting
5. Usage Tracking
6. Credential Obfuscation
7. No Logging of Secrets

Author: Varity Labs
Version: 1.0.0
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel

try:
    # Module import (when running as package)
    from .config import SecurityConfig, CredentialConfig, ServiceConfig
    from .middleware import verify_api_key, logger
except ImportError:
    # Direct import (when running as script)
    from config import SecurityConfig, CredentialConfig, ServiceConfig
    from middleware import verify_api_key, logger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management"""
    # Startup
    logger.info(f"Starting {ServiceConfig.SERVICE_NAME} v{ServiceConfig.VERSION}")

    # Validate credentials are configured
    if not CredentialConfig.validate():
        logger.error("❌ Credential validation failed - service may not work correctly")
    else:
        logger.info("✅ All credentials validated")

    # Log environment
    logger.info(f"Environment: {SecurityConfig.ENV}")
    if SecurityConfig.IS_PRODUCTION:
        logger.info("🔒 Production mode: Behind reverse proxy (HTTPS handled by ingress)")

    yield

    # Shutdown
    logger.info("Shutting down credential proxy")


# Create FastAPI app
app = FastAPI(
    title="Varity Credential Proxy",
    description="Secure credential management for Varity infrastructure",
    version=ServiceConfig.VERSION,
    lifespan=lifespan,
    docs_url=None if SecurityConfig.IS_PRODUCTION else "/docs",  # Disable docs in production
    redoc_url=None if SecurityConfig.IS_PRODUCTION else "/redoc",
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware (CLI can be anywhere)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ServiceConfig.CORS_ORIGINS,
    allow_credentials=ServiceConfig.CORS_ALLOW_CREDENTIALS,
    allow_methods=ServiceConfig.CORS_ALLOW_METHODS,
    allow_headers=ServiceConfig.CORS_ALLOW_HEADERS,
)

# HTTPS enforcement disabled - handled by reverse proxy (Akash ingress, Cloudflare, etc.)
# app.middleware("http")(enforce_https)


# Response Models
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class ThirdwebCredentialsResponse(BaseModel):
    secret_key: str
    client_id: str


class PrivyCredentialsResponse(BaseModel):
    app_id: str


# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns service status and version information.
    """
    return HealthResponse(
        status="healthy",
        service=ServiceConfig.SERVICE_NAME,
        version=ServiceConfig.VERSION,
        environment=SecurityConfig.ENV
    )


@app.get("/api/credentials/thirdweb", response_model=ThirdwebCredentialsResponse)
@limiter.limit(f"{SecurityConfig.RATE_LIMIT_PER_MINUTE}/minute")
@limiter.limit(f"{SecurityConfig.RATE_LIMIT_PER_HOUR}/hour")
@limiter.limit(f"{SecurityConfig.RATE_LIMIT_PER_DAY}/day")
async def get_thirdweb_credentials(
    request: Request,
    tier: str = Depends(verify_api_key)
):
    """
    Get Varity's hosting credentials for app deployments

    **Security:**
    - Requires valid API key (Bearer token)
    - Rate limited: 10/min, 100/hour, 500/day per IP
    - HTTPS required in production
    - Tracks usage for abuse detection
    - Dev tier only receives public client_id (NO secret key)

    **Authentication:**
    ```
    Authorization: Bearer <API_KEY>
    ```

    **Returns:**
    - `secret_key`: Hosting secret key for server-side operations (production/beta only)
    - `client_id`: Hosting client ID for client-side operations
    """
    if not CredentialConfig.THIRDWEB_SECRET_KEY:
        logger.error("Hosting secret key not configured!")
        return JSONResponse(
            status_code=500,
            content={"detail": "Credentials not configured on server"}
        )

    # SECURITY: Dev tier only gets the public client ID, NOT the secret key.
    # This prevents abuse if the dev key is discovered.
    if tier == "dev":
        logger.info(f"Providing public credentials only: tier={tier}")
        return ThirdwebCredentialsResponse(
            secret_key="",
            client_id=CredentialConfig.THIRDWEB_CLIENT_ID
        )

    # Production and beta tiers get full credentials
    logger.info(f"Providing full credentials: tier={tier}")

    return ThirdwebCredentialsResponse(
        secret_key=CredentialConfig.THIRDWEB_SECRET_KEY,
        client_id=CredentialConfig.THIRDWEB_CLIENT_ID
    )


@app.get("/api/credentials/privy", response_model=PrivyCredentialsResponse)
@limiter.limit(f"{SecurityConfig.RATE_LIMIT_PER_MINUTE}/minute")
@limiter.limit(f"{SecurityConfig.RATE_LIMIT_PER_HOUR}/hour")
@limiter.limit(f"{SecurityConfig.RATE_LIMIT_PER_DAY}/day")
async def get_privy_credentials(
    request: Request,
    tier: str = Depends(verify_api_key)
):
    """
    Get Varity's Privy app ID for authentication

    **Security:**
    - Requires valid API key (Bearer token)
    - Rate limited: 10/min, 100/hour, 500/day per IP
    - HTTPS required in production
    - Tracks usage for abuse detection
    - Privy app ID is public by design (safe for all tiers)

    **Authentication:**
    ```
    Authorization: Bearer <API_KEY>
    ```

    **Returns:**
    - `app_id`: Privy application ID
    """
    if not CredentialConfig.PRIVY_APP_ID:
        logger.error("Privy app ID not configured!")
        return JSONResponse(
            status_code=500,
            content={"detail": "Credentials not configured on server"}
        )

    # Privy app ID is public by design — safe for all tiers
    logger.info(f"Providing Privy credentials: tier={tier}")

    return PrivyCredentialsResponse(
        app_id=CredentialConfig.PRIVY_APP_ID
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler - never leak credentials in errors"""
    logger.error(f"Unhandled exception: {type(exc).__name__}")

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=ServiceConfig.HOST,
        port=ServiceConfig.PORT,
        reload=not SecurityConfig.IS_PRODUCTION,
        log_level="info"
    )
