"""
Credential Fetcher — Resolve Varity infrastructure credentials.

Provides thirdweb client ID (public, safe for source code) and Privy
credentials via the credential proxy service.

Security:
- Only PUBLIC credentials (client IDs) are embedded in source code
- Secret keys are fetched at runtime via authenticated credential proxy
- Deploy key (from `varitykit login`) authenticates proxy requests
"""

import os
import sys
import json
import urllib.request
import urllib.error
from typing import Optional, Dict


class CredentialFetchError(Exception):
    """Raised when credential fetching fails"""
    pass


class VarityCredentials:
    """Container for Varity infrastructure credentials"""

    def __init__(self, thirdweb_client_id: str, thirdweb_secret: str = ""):
        self.thirdweb_client_id = thirdweb_client_id
        self.thirdweb_secret_key = thirdweb_secret


# Public thirdweb client ID — safe for source code (like a Firebase config key)
THIRDWEB_PUBLIC_CLIENT_ID = "a35636133eb5ec6f30eb9f4c15fce2f3"

# Credential proxy URL (Akash deployment) — public endpoint
CREDENTIAL_PROXY_URL = os.getenv(
    "VARITY_CREDENTIAL_PROXY_URL",
    "http://j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host"
)


def _get_cli_api_key() -> Optional[str]:
    """
    Get CLI API key from ~/.varitykit/config.json (set during `varitykit login`).

    Returns:
        API key string, or None if not configured.
    """
    from varitykit.services.gateway_client import CONFIG_PATH

    if not CONFIG_PATH.exists():
        return None
    try:
        with open(CONFIG_PATH, "r") as f:
            config = json.load(f)
        return config.get("cli_api_key") or config.get("deploy_key")
    except (json.JSONDecodeError, IOError):
        return None


def fetch_thirdweb_credentials(
    api_key: Optional[str] = None,
    proxy_url: Optional[str] = None
) -> VarityCredentials:
    """
    Return thirdweb credentials.

    The client ID is a public value embedded in the CLI. If a secret key
    is needed, it's fetched from the credential proxy (requires login).

    Args:
        api_key: Override API key for proxy auth
        proxy_url: Override proxy URL

    Returns:
        VarityCredentials with thirdweb client ID (and optionally secret key)
    """
    # Client ID is public — always available
    client_id = os.getenv("THIRDWEB_CLIENT_ID", THIRDWEB_PUBLIC_CLIENT_ID)

    # Try to fetch secret key from proxy if authenticated
    key = api_key or os.getenv("VARITY_CLI_API_KEY") or _get_cli_api_key()
    if key:
        url = f"{proxy_url or CREDENTIAL_PROXY_URL}/api/credentials/thirdweb"
        try:
            req = urllib.request.Request(
                url,
                headers={"Authorization": f"Bearer {key}"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                return VarityCredentials(
                    thirdweb_client_id=data.get("client_id", client_id),
                    thirdweb_secret=data.get("secret_key", ""),
                )
        except urllib.error.HTTPError as e:
            if e.code == 401:
                print(
                    "  Warning: Authentication failed (401). "
                    "Check your deploy key with: varitykit login",
                    file=sys.stderr,
                )
        except Exception:
            # Network errors, timeouts, etc. — fall through to public-only credentials
            pass

    return VarityCredentials(thirdweb_client_id=client_id)


def fetch_privy_credentials(
    api_key: Optional[str] = None,
    proxy_url: Optional[str] = None
) -> Dict[str, str]:
    """
    Fetch Privy credentials from the Varity credential proxy.

    Args:
        api_key: Override API key
        proxy_url: Override proxy URL

    Returns:
        Dict with 'app_id' key

    Raises:
        CredentialFetchError: If fetching fails
    """
    key = api_key or os.getenv("VARITY_CLI_API_KEY") or _get_cli_api_key()
    if not key:
        raise CredentialFetchError(
            "Not authenticated. Run 'varitykit login' first."
        )

    url = f"{proxy_url or CREDENTIAL_PROXY_URL}/api/credentials/privy"

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {key}"}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())

    except Exception as e:
        raise CredentialFetchError(f"Failed to fetch Privy credentials: {e}")


def fetch_database_credentials(
    api_key: Optional[str] = None,
    proxy_url: Optional[str] = None
) -> Optional[str]:
    """
    Fetch database JWT secret from the Varity credential proxy.

    The JWT secret is used to sign app tokens for DB proxy authentication.
    Each app gets a unique app_id in the token, ensuring data isolation.

    Args:
        api_key: Override API key
        proxy_url: Override proxy URL

    Returns:
        JWT secret string, or None if not available
    """
    key = api_key or os.getenv("VARITY_CLI_API_KEY") or _get_cli_api_key()
    if not key:
        return None

    url = f"{proxy_url or CREDENTIAL_PROXY_URL}/api/credentials/database"

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {key}"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get("jwt_secret")
    except Exception:
        return None


def fetch_akash_credentials(
    api_key: Optional[str] = None,
    proxy_url: Optional[str] = None
) -> Optional[str]:
    """
    Fetch Akash Console API key from the Varity credential proxy.

    The key is Varity's shared admin account — developers never create
    their own Akash accounts. Falls back to AKASH_CONSOLE_API_KEY env var
    for local development.

    Args:
        api_key: Override API key for proxy auth
        proxy_url: Override proxy URL

    Returns:
        Akash Console API key string, or None if not available
    """
    # Check env var first (local dev)
    env_key = os.getenv("AKASH_CONSOLE_API_KEY")
    if env_key:
        return env_key

    # Fetch from credential proxy
    key = api_key or os.getenv("VARITY_CLI_API_KEY") or _get_cli_api_key()
    if not key:
        return None

    url = f"{proxy_url or CREDENTIAL_PROXY_URL}/api/credentials/akash"

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {key}"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data.get("console_api_key")
    except Exception:
        return None


def get_thirdweb_client_id() -> Optional[str]:
    """
    Get thirdweb client ID — environment variable first, then built-in default.

    The client ID is a public value (like a Firebase config key).

    Returns:
        Thirdweb client ID (always available)
    """
    return os.getenv("THIRDWEB_CLIENT_ID", THIRDWEB_PUBLIC_CLIENT_ID)
