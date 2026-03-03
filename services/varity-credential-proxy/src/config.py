"""
Varity Credential Proxy - Configuration

SECURITY CRITICAL: This module handles Varity's internal infrastructure credentials.
"""

import os
import secrets
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SecurityConfig:
    """Security configuration and constants"""

    # Environment
    ENV = os.getenv("ENV", "development")  # development | production
    IS_PRODUCTION = ENV == "production"

    # API Keys (multi-tier for security)
    # SECURITY: No hardcoded defaults for any tier. All keys MUST be set via environment.
    # The dev tier only receives public credentials (no secret key).
    API_KEYS: Dict[str, str] = {
        "production": os.getenv("VARITY_CLI_PRODUCTION_KEY", ""),
        "beta": os.getenv("VARITY_CLI_BETA_KEY", ""),
        "dev": os.getenv("VARITY_CLI_DEV_KEY", ""),
    }

    # Rate Limits (requests per time period)
    RATE_LIMIT_PER_MINUTE = 10   # Max 10 credential requests per minute per IP
    RATE_LIMIT_PER_HOUR = 100    # Max 100 requests per hour per IP
    RATE_LIMIT_PER_DAY = 500     # Max 500 requests per day per IP

    # Abuse Detection Thresholds
    SUSPICIOUS_REQUESTS_PER_HOUR = 50  # Flag if > 50 requests in 1 hour from single IP

    # HTTPS Enforcement
    REQUIRE_HTTPS = IS_PRODUCTION

    @classmethod
    def verify_api_key(cls, key: str) -> Optional[str]:
        """
        Verify API key and return tier

        Args:
            key: API key to verify

        Returns:
            Tier name if valid, None if invalid

        Security: Uses constant-time comparison to prevent timing attacks
        """
        for tier, valid_key in cls.API_KEYS.items():
            if valid_key and secrets.compare_digest(key, valid_key):
                return tier
        return None


class CredentialConfig:
    """Varity infrastructure credentials — multi-chain aware"""

    # Default credentials (Varity L3 — chain 33529)
    THIRDWEB_SECRET_KEY = os.getenv("VARITY_THIRDWEB_SECRET_KEY", "")
    THIRDWEB_CLIENT_ID = os.getenv("VARITY_THIRDWEB_CLIENT_ID", "a35636133eb5ec6f30eb9f4c15fce2f3")
    PRIVY_APP_ID = os.getenv("VARITY_PRIVY_APP_ID", "cmhwbozxu004fjr0cicfz0tf8")

    # Per-chain credentials — env var pattern: CHAIN_{chainId}_{CREDENTIAL}
    # Example: CHAIN_43214_PRIVY_APP_ID, CHAIN_43214_THIRDWEB_CLIENT_ID
    # Falls back to default credentials if chain-specific ones aren't set

    # Default chain ID (Varity L3)
    DEFAULT_CHAIN_ID = 33529

    @classmethod
    def get_thirdweb_credentials(cls, chain_id: Optional[int] = None) -> Dict[str, str]:
        """Get thirdweb credentials for a specific chain (or default)"""
        if chain_id and chain_id != cls.DEFAULT_CHAIN_ID:
            chain_secret = os.getenv(f"CHAIN_{chain_id}_THIRDWEB_SECRET_KEY", "")
            chain_client = os.getenv(f"CHAIN_{chain_id}_THIRDWEB_CLIENT_ID", "")
            if chain_client:
                return {
                    "secret_key": chain_secret,
                    "client_id": chain_client,
                }
        # Fall back to default
        return {
            "secret_key": cls.THIRDWEB_SECRET_KEY,
            "client_id": cls.THIRDWEB_CLIENT_ID,
        }

    @classmethod
    def get_privy_credentials(cls, chain_id: Optional[int] = None) -> Dict[str, str]:
        """Get Privy credentials for a specific chain (or default)"""
        if chain_id and chain_id != cls.DEFAULT_CHAIN_ID:
            chain_privy = os.getenv(f"CHAIN_{chain_id}_PRIVY_APP_ID", "")
            if chain_privy:
                return {"app_id": chain_privy}
        # Fall back to default
        return {"app_id": cls.PRIVY_APP_ID}

    @classmethod
    def validate(cls) -> bool:
        """
        Validate that all required credentials are configured

        Returns:
            True if all credentials present, False otherwise
        """
        required = [
            (cls.THIRDWEB_SECRET_KEY, "VARITY_THIRDWEB_SECRET_KEY"),
            (cls.THIRDWEB_CLIENT_ID, "VARITY_THIRDWEB_CLIENT_ID"),
            (cls.PRIVY_APP_ID, "VARITY_PRIVY_APP_ID"),
        ]

        missing = [name for value, name in required if not value]

        if missing:
            print(f"❌ Missing credentials: {', '.join(missing)}")
            return False

        return True


class ServiceConfig:
    """Service configuration"""

    # Service Info
    SERVICE_NAME = "varity-credential-proxy"
    VERSION = "1.1.0"

    # Server Config
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8001))

    # CORS Config (CLI can be anywhere)
    CORS_ORIGINS = ["*"]
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ["GET"]
    CORS_ALLOW_HEADERS = ["*"]
