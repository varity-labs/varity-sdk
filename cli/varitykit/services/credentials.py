"""
Credential generation service for Varity apps.

Generates unique app IDs and JWT tokens for database access.
"""
import os
import json
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

_jwt_secret_warned = False


def _get_jwt_secret_from_config() -> Optional[str]:
    """Read JWT secret from ~/.varitykit/config.json (set during `varitykit login`)."""
    from pathlib import Path
    config_path = Path.home() / ".varitykit" / "config.json"
    if not config_path.exists():
        return None
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        return config.get("jwt_secret")
    except (json.JSONDecodeError, IOError):
        return None


def _get_jwt_secret() -> str:
    """
    Get JWT secret from (in priority order):
    1. VARITY_DB_PROXY_JWT_SECRET env var
    2. ~/.varitykit/config.json (set during `varitykit login`)
    3. Fails with helpful message
    """
    global _jwt_secret_warned
    if _JWT_SECRET_ENV:
        return _JWT_SECRET_ENV

    config_secret = _get_jwt_secret_from_config()
    if config_secret:
        return config_secret

    if not _jwt_secret_warned:
        import sys
        print(
            "  ⚠️  No database credentials found. "
            "Run 'varitykit login' or set VARITY_DB_PROXY_JWT_SECRET.",
            file=sys.stderr,
        )
        _jwt_secret_warned = True
    raise RuntimeError(
        "JWT secret not configured. Run 'varitykit login' first, "
        "or set VARITY_DB_PROXY_JWT_SECRET environment variable."
    )


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
