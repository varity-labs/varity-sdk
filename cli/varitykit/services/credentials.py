"""
Credential generation service for Varity apps.

Generates unique app IDs and JWT tokens for database access.
"""
import os
import secrets
import datetime
from typing import Dict, Optional

# Try to import JWT library
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False

# JWT secret — must match the DB_PROXY_JWT_SECRET in deploy.yaml
_JWT_SECRET_ENV = os.environ.get("VARITY_DB_PROXY_JWT_SECRET", "")

# Dev-tier fallback secret (matches DB Proxy dev tier)
_DEV_JWT_SECRET = "varity-dev-jwt-secret-2026"
_dev_secret_warned = False

def _get_jwt_secret() -> str:
    """Get JWT secret, falling back to dev-tier secret if not configured."""
    global _dev_secret_warned
    if _JWT_SECRET_ENV:
        return _JWT_SECRET_ENV
    # Use dev-tier secret for zero-config development
    if not _dev_secret_warned:
        if os.environ.get("VARITYKIT_VERBOSE"):
            import sys
            print(
                "  ⚠️  Using development database credentials. "
                "Set VARITY_DB_PROXY_JWT_SECRET for production.",
                file=sys.stderr,
            )
        _dev_secret_warned = True
    return _DEV_JWT_SECRET


def generate_app_id(prefix: str = "app") -> str:
    """
    Generate a unique app ID.

    Format: app_<random_16_chars>
    Example: app_x7k9m2p5q8w3n6r4

    Args:
        prefix: Prefix for the app ID (default: "app")

    Returns:
        Unique app ID string
    """
    random_part = secrets.token_hex(8)  # 16 characters
    return f"{prefix}_{random_part}"


def generate_jwt_token(app_id: str, expires_days: int = 365) -> str:
    """
    Generate a JWT token for the app.

    The token contains:
    - appId: Unique app identifier
    - iss: Issuer (varity.so)
    - iat: Issued at timestamp
    - exp: Expiration timestamp (1 year default)

    Args:
        app_id: Unique app identifier
        expires_days: Number of days until token expires (default: 365)

    Returns:
        JWT token string

    Raises:
        ImportError: If PyJWT is not installed
    """
    if not JWT_AVAILABLE:
        raise ImportError(
            "PyJWT is required for token generation. "
            "Install it with: pip install PyJWT"
        )

    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(days=expires_days)

    payload = {
        "appId": app_id,
        "iss": "varity.so",
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }

    token = jwt.encode(payload, _get_jwt_secret(), algorithm="HS256")

    # PyJWT 2.x returns string, PyJWT 1.x might return bytes
    if isinstance(token, bytes):
        token = token.decode('utf-8')

    return token


def generate_app_credentials(app_name: Optional[str] = None) -> Dict:
    """
    Generate complete app credentials.

    Args:
        app_name: Optional app name (unused for now)

    Returns:
        Dict with credentials:
        {
            'app_id': str,
            'jwt_token': str,
            'db_proxy_url': str,
            'expires_days': int
        }
    """
    app_id = generate_app_id()
    jwt_token = generate_jwt_token(app_id)

    return {
        'app_id': app_id,
        'jwt_token': jwt_token,
        'db_proxy_url': os.environ.get('VARITY_DB_PROXY_URL', 'http://provider.akashprovid.com:31782'),
        'expires_days': 365
    }


def save_credentials_to_file(credentials: Dict[str, str], output_path: str) -> None:
    """
    Save credentials to a .env file.

    Args:
        credentials: Credentials dict from generate_app_credentials()
        output_path: Path to save .env file
    """
    with open(output_path, 'w') as f:
        f.write(f"# Varity App Credentials\n")
        f.write(f"# Generated: {datetime.datetime.utcnow().isoformat()}\n")
        f.write(f"# Expires in: {credentials.get('expires_days', 365)} days\n\n")
        f.write(f"VITE_VARITY_APP_ID={credentials['app_id']}\n")
        f.write(f"VITE_VARITY_APP_TOKEN={credentials['jwt_token']}\n")
        f.write(f"VITE_VARITY_DB_PROXY_URL={credentials['db_proxy_url']}\n")


def verify_jwt_token(token: str) -> Optional[Dict]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dict if valid, None otherwise
    """
    if not JWT_AVAILABLE:
        return None

    try:
        # Decode with options to handle clock skew issues
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=["HS256"],
            options={
                "verify_iat": False  # Skip IAT verification to avoid clock skew issues
            }
        )
        return payload
    except jwt.InvalidTokenError as e:
        # Log error for debugging but return None
        return None
