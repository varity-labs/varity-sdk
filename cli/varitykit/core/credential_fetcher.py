"""
Credential Fetcher - Fetch Varity infrastructure credentials

This module provides seamless credential fetching from Varity's credential proxy,
enabling zero-config deployments for developers.
"""

import os
import urllib.request
import urllib.error
import json
from typing import Optional, Dict


class CredentialFetchError(Exception):
    """Raised when credential fetching fails"""
    pass


class VarityCredentials:
    """Varity infrastructure credentials"""

    def __init__(self, thirdweb_secret: str, thirdweb_client_id: str):
        self.thirdweb_secret_key = thirdweb_secret
        self.thirdweb_client_id = thirdweb_client_id


class CredentialFetcher:
    """
    Fetch credentials from Varity credential proxy

    Enables zero-config deployments by fetching Varity's infrastructure
    credentials (thirdweb, Privy, etc.) from the credential proxy service.

    Example:
        fetcher = CredentialFetcher()
        creds = fetcher.fetch_thirdweb_credentials()
        print(f"Client ID: {creds.thirdweb_client_id}")
    """

    # Production credential proxy URL
    CREDENTIAL_PROXY_URL = os.getenv(
        "VARITY_CREDENTIAL_PROXY_URL",
        "http://j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host"
    )

    # Production API key (embedded in CLI for zero-config)
    VARITY_API_KEY = os.getenv(
        "VARITY_CLI_API_KEY",
        "varity_cli_prod_2026_v1_5f8a9c2e4d6b7a1c3e5f8a9c2e4d6b7a"
    )

    def __init__(self, api_key: Optional[str] = None, proxy_url: Optional[str] = None):
        """
        Initialize credential fetcher

        Args:
            api_key: Varity API key (optional, uses default if not provided)
            proxy_url: Credential proxy URL (optional, uses default if not provided)
        """
        self.api_key = api_key or self.VARITY_API_KEY
        self.proxy_url = proxy_url or self.CREDENTIAL_PROXY_URL

    def fetch_thirdweb_credentials(self) -> VarityCredentials:
        """
        Fetch thirdweb credentials from credential proxy

        Returns:
            VarityCredentials with thirdweb secret key and client ID

        Raises:
            CredentialFetchError: If fetching fails

        Example:
            fetcher = CredentialFetcher()
            creds = fetcher.fetch_thirdweb_credentials()
            # Use creds.thirdweb_client_id for IPFS uploads
        """
        url = f"{self.proxy_url}/api/credentials/thirdweb"

        try:
            # Create request with authorization header
            req = urllib.request.Request(
                url,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )

            # Make request
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

                return VarityCredentials(
                    thirdweb_secret=data["secret_key"],
                    thirdweb_client_id=data["client_id"]
                )

        except urllib.error.HTTPError as e:
            if e.code == 401:
                raise CredentialFetchError(
                    "Invalid Varity API key. "
                    "This shouldn't happen - please report this issue."
                )
            elif e.code == 429:
                raise CredentialFetchError(
                    "Rate limit exceeded. Too many deployment requests. "
                    "Please wait a minute and try again."
                )
            else:
                raise CredentialFetchError(
                    f"Failed to fetch credentials: HTTP {e.code}"
                )

        except urllib.error.URLError as e:
            raise CredentialFetchError(
                f"Cannot connect to Varity credential service. "
                f"Please check your internet connection.\n"
                f"Error: {e.reason}"
            )

        except json.JSONDecodeError:
            raise CredentialFetchError(
                "Invalid response from credential service"
            )

        except Exception as e:
            raise CredentialFetchError(
                f"Unexpected error fetching credentials: {str(e)}"
            )

    def fetch_privy_credentials(self) -> Dict[str, str]:
        """
        Fetch Privy credentials from credential proxy

        Returns:
            Dict with Privy app_id

        Raises:
            CredentialFetchError: If fetching fails
        """
        url = f"{self.proxy_url}/api/credentials/privy"

        try:
            req = urllib.request.Request(
                url,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )

            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode())

        except Exception as e:
            raise CredentialFetchError(
                f"Failed to fetch Privy credentials: {str(e)}"
            )


def get_thirdweb_client_id() -> Optional[str]:
    """
    Get thirdweb client ID from credential proxy or environment

    Convenience function for zero-config deployments. Tries to fetch
    from Varity credential proxy first, falls back to environment variable.

    Returns:
        Thirdweb client ID, or None if unavailable

    Example:
        client_id = get_thirdweb_client_id()
        if client_id:
            uploader = IPFSUploader(client_id=client_id)
    """
    # First try environment variable (for users with their own credentials)
    env_client_id = os.getenv("THIRDWEB_CLIENT_ID")
    if env_client_id:
        return env_client_id

    # Fall back to Varity credential proxy (zero-config)
    try:
        fetcher = CredentialFetcher()
        creds = fetcher.fetch_thirdweb_credentials()
        return creds.thirdweb_client_id
    except CredentialFetchError:
        # Silently fail - let the caller handle missing credentials
        return None
