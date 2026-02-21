"""
Varity Credential Proxy - Security Middleware

SECURITY CRITICAL: Handles authentication, rate limiting, and abuse detection.
"""

import hashlib
import logging
from typing import Optional
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    from .config import SecurityConfig
except ImportError:
    from config import SecurityConfig

# Configure logging (with credential filter)
logger = logging.getLogger(__name__)


class CredentialFilter(logging.Filter):
    """Filter to prevent credential leakage in logs"""

    SENSITIVE_PATTERNS = [
        'secret_key',
        'VARITY_THIRDWEB_SECRET_KEY',
        'THIRDWEB_SECRET_KEY',
        'api_key',
        'authorization',
    ]

    def filter(self, record):
        """Block log entries containing sensitive data"""
        message = str(record.msg).lower()
        for pattern in self.SENSITIVE_PATTERNS:
            if pattern.lower() in message:
                return False  # Block this log entry
        return True


# Apply filter to prevent credential leaks
logger.addFilter(CredentialFilter())


def get_client_ip(request: Request) -> str:
    """Safely get client IP, handling None for proxied/test environments."""
    return request.client.host if request.client else "unknown"


# Security scheme
security = HTTPBearer()


class RequestFingerprint:
    """Create unique fingerprints for request tracking"""

    @staticmethod
    def create(request: Request) -> str:
        """
        Create unique fingerprint for request

        Args:
            request: FastAPI request object

        Returns:
            SHA256 hash of request metadata
        """
        fingerprint_data = (
            f"{get_client_ip(request)}|"
            f"{request.headers.get('user-agent', '')}|"
            f"{request.headers.get('accept-language', '')}"
        )
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()


class UsageTracker:
    """Track credential usage for abuse detection"""

    def __init__(self):
        # In-memory storage (use Redis in production)
        self._usage: dict = defaultdict(list)

    def track(self, fingerprint: str, tier: str):
        """
        Track credential request

        Args:
            fingerprint: Request fingerprint
            tier: API key tier (production, beta, dev)
        """
        now = datetime.utcnow()

        # Add request to tracking
        self._usage[fingerprint].append({
            'timestamp': now,
            'tier': tier
        })

        # Clean old entries (older than 24 hours)
        cutoff = now - timedelta(hours=24)
        self._usage[fingerprint] = [
            req for req in self._usage[fingerprint]
            if req['timestamp'] > cutoff
        ]

    def is_suspicious(self, fingerprint: str) -> bool:
        """
        Check if request pattern is suspicious

        Args:
            fingerprint: Request fingerprint

        Returns:
            True if suspicious activity detected
        """
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)

        # Count requests in last hour
        recent_requests = [
            req for req in self._usage.get(fingerprint, [])
            if req['timestamp'] > one_hour_ago
        ]

        if len(recent_requests) > SecurityConfig.SUSPICIOUS_REQUESTS_PER_HOUR:
            logger.warning(
                f"Suspicious activity: {len(recent_requests)} requests "
                f"in 1 hour from fingerprint {fingerprint[:16]}..."
            )
            return True

        return False


# Global usage tracker
usage_tracker = UsageTracker()


async def verify_api_key(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Verify API key and return tier

    Args:
        request: FastAPI request
        credentials: HTTP Bearer token

    Returns:
        API key tier (production, beta, dev)

    Raises:
        HTTPException: If authentication fails
    """
    # Extract token
    token = credentials.credentials

    # Verify token
    tier = SecurityConfig.verify_api_key(token)

    if not tier:
        logger.warning(
            f"Invalid API key from IP: {get_client_ip(request)}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    # Create request fingerprint
    fingerprint = RequestFingerprint.create(request)

    # Check for suspicious activity
    if usage_tracker.is_suspicious(fingerprint):
        logger.error(
            f"Blocking suspicious request from {fingerprint[:16]}..."
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests - suspicious activity detected"
        )

    # Track this request
    usage_tracker.track(fingerprint, tier)

    # Log successful auth (no credential details)
    logger.info(
        f"Credential request authenticated: tier={tier}, "
        f"ip={get_client_ip(request)}, "
        f"fingerprint={fingerprint[:16]}..."
    )

    return tier


async def enforce_https(request: Request, call_next):
    """
    Middleware to enforce HTTPS in production

    Note: When behind a reverse proxy (like Akash ingress), the proxy handles
    HTTPS termination and forwards HTTP to the container. We check the
    X-Forwarded-Proto header to determine the original protocol.

    Args:
        request: FastAPI request
        call_next: Next middleware/route handler

    Raises:
        HTTPException: If HTTP used in production (when not behind proxy)
    """
    # Check if behind a reverse proxy (common in Kubernetes/Akash)
    forwarded_proto = request.headers.get("x-forwarded-proto", "").lower()

    # If behind proxy, trust the X-Forwarded-Proto header
    if forwarded_proto:
        # Proxy is handling HTTPS, we're good
        response = await call_next(request)
        return response

    # Not behind proxy - check if HTTPS is required
    if SecurityConfig.REQUIRE_HTTPS and request.url.scheme != "https":
        # Allow health checks without HTTPS (for Docker health checks, monitoring)
        if request.url.path == "/health":
            response = await call_next(request)
            return response

        # Allow private/internal network IPs (Docker, Kubernetes, etc.)
        if request.client and request.client.host:
            host = request.client.host
            # Check for localhost and private networks
            if (host in ["127.0.0.1", "localhost", "::1"] or
                host.startswith("10.") or
                host.startswith("172.") or  # Docker bridge
                host.startswith("192.168.")):
                response = await call_next(request)
                return response

        # External HTTP request in production - block it
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HTTPS required in production"
        )

    response = await call_next(request)
    return response
