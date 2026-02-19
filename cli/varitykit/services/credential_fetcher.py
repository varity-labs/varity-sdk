"""
Credential Fetcher — Fetch Varity infrastructure credentials from the credential proxy.

Enables zero-config deployments: developers never need thirdweb/Privy API keys.
The CLI fetches them automatically from Varity's credential proxy service.

Security:
- API key is embedded in the CLI (production tier)
- Credential proxy rate-limits and tracks usage
- Dev tier only receives public credentials (no secret key)
"""

import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict


class CredentialFetchError(Exception):
    """Raised when credential fetching fails"""
    pass


class VarityCredentials:
    """Container for Varity infrastructure credentials"""

    def __init__(self, thirdweb_secret: str, thirdweb_client_id: str):
        self.thirdweb_secret_key = thirdweb_secret
        self.thirdweb_client_id = thirdweb_client_id


# Credential proxy URL (Akash deployment)
CREDENTIAL_PROXY_URL = os.getenv(
    "VARITY_CREDENTIAL_PROXY_URL",
    "http://j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host"
)

# CLI API key for credential proxy authentication
VARITY_CLI_API_KEY = os.getenv(
    "VARITY_CLI_API_KEY",
    "varity_cli_prod_2026_v1_5f8a9c2e4d6b7a1c3e5f8a9c2e4d6b7a"
)


def fetch_thirdweb_credentials(
    api_key: Optional[str] = None,
    proxy_url: Optional[str] = None
) -> VarityCredentials:
    """
    Fetch thirdweb credentials from the Varity credential proxy.

    Args:
        api_key: Override API key (uses embedded default)
        proxy_url: Override proxy URL (uses default Akash deployment)

    Returns:
        VarityCredentials with thirdweb secret key and client ID

    Raises:
        CredentialFetchError: If fetching fails
    """
    key = api_key or VARITY_CLI_API_KEY
    url = f"{proxy_url or CREDENTIAL_PROXY_URL}/api/credentials/thirdweb"

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {key}"}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            return VarityCredentials(
                thirdweb_secret=data["secret_key"],
                thirdweb_client_id=data["client_id"]
            )

    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise CredentialFetchError(
                "Authentication failed with Varity credential service. "
                "Please report this issue at https://github.com/varity-labs/varity-sdk/issues"
            )
        elif e.code == 429:
            raise CredentialFetchError(
                "Rate limit exceeded. Too many deployment requests. "
                "Please wait a minute and try again."
            )
        else:
            raise CredentialFetchError(f"Credential service returned HTTP {e.code}")

    except urllib.error.URLError as e:
        raise CredentialFetchError(
            f"Cannot connect to Varity credential service. "
            f"Check your internet connection.\nError: {e.reason}"
        )

    except json.JSONDecodeError:
        raise CredentialFetchError("Invalid response from credential service")

    except Exception as e:
        raise CredentialFetchError(f"Unexpected error fetching credentials: {e}")


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
    key = api_key or VARITY_CLI_API_KEY
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


def get_thirdweb_client_id() -> Optional[str]:
    """
    Get thirdweb client ID — environment variable first, then credential proxy.

    This is the main entry point for zero-config credential resolution.

    Returns:
        Thirdweb client ID, or None if unavailable
    """
    # User-provided credentials take priority
    env_id = os.getenv("THIRDWEB_CLIENT_ID")
    if env_id:
        return env_id

    # Fetch from Varity credential proxy (zero-config)
    try:
        creds = fetch_thirdweb_credentials()
        return creds.thirdweb_client_id
    except CredentialFetchError:
        return None
