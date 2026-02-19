"""
Gateway Client — Register and manage custom domains via the Varity Gateway.

Enables automatic domain registration on deploy: every app gets varity.app/{name}.
The CLI calls the gateway API to register/update domain mappings.

Security:
- API key is embedded in the CLI (same pattern as credential_fetcher.py)
- Gateway rate-limits and validates subdomain availability
"""

import os
import re
import json
import urllib.request
import urllib.error
from typing import Optional, Dict


class GatewayError(Exception):
    """Raised when gateway operations fail"""
    pass


# Gateway URL (Akash deployment)
GATEWAY_URL = os.getenv(
    "VARITY_GATEWAY_URL",
    "http://bdfjhtfcq1afp52pn39c9oumko.ingress.akash.tagus.host"
)

# CLI API key for gateway authentication
GATEWAY_API_KEY = os.getenv(
    "VARITY_GATEWAY_API_KEY",
    "17b2902f4974e9a41a06059777e50a86a235432f39780742309c62b1b5da3311"
)


def sanitize_subdomain(name: str) -> str:
    """
    Sanitize a project name into a valid subdomain.

    Rules:
    - Strip npm scope (@scope/name -> name)
    - Lowercase
    - Replace invalid chars with hyphens
    - Collapse multiple hyphens
    - Trim leading/trailing hyphens
    - Enforce 3-63 characters

    Args:
        name: Raw project name (from package.json or --name flag)

    Returns:
        Valid subdomain string

    Raises:
        GatewayError: If name cannot be sanitized into a valid subdomain
    """
    # Strip npm scope
    if '/' in name:
        name = name.split('/')[-1]

    # Lowercase and replace invalid chars
    subdomain = name.lower()
    subdomain = re.sub(r'[^a-z0-9-]', '-', subdomain)

    # Collapse multiple hyphens
    subdomain = re.sub(r'-{2,}', '-', subdomain)

    # Trim edges
    subdomain = subdomain.strip('-')

    # Enforce length
    if len(subdomain) < 3:
        raise GatewayError(
            f"Subdomain '{subdomain}' is too short (minimum 3 characters). "
            f"Use --name to specify a longer name."
        )

    if len(subdomain) > 63:
        subdomain = subdomain[:63].rstrip('-')

    return subdomain


def check_availability(subdomain: str, gateway_url: Optional[str] = None) -> Dict:
    """
    Check if a subdomain is available.

    Args:
        subdomain: Subdomain to check
        gateway_url: Override gateway URL

    Returns:
        Dict with 'available' (bool) and optional 'reason' (str)

    Raises:
        GatewayError: If check fails
    """
    url = f"{gateway_url or GATEWAY_URL}/api/domains/check/{subdomain}"

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {GATEWAY_API_KEY}"}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise GatewayError("Authentication failed with Varity gateway service.")
        else:
            raise GatewayError(f"Gateway returned HTTP {e.code}")

    except urllib.error.URLError as e:
        raise GatewayError(
            f"Cannot connect to Varity gateway. "
            f"Check your internet connection.\nError: {e.reason}"
        )

    except Exception as e:
        raise GatewayError(f"Unexpected error checking domain: {e}")


def register_domain(
    subdomain: str,
    cid: str,
    app_name: Optional[str] = None,
    gateway_url: Optional[str] = None,
) -> Dict:
    """
    Register a subdomain or update an existing one.

    Tries POST (register) first. If the subdomain already exists (409),
    falls back to PUT (update) — this handles redeployments seamlessly.

    Args:
        subdomain: Subdomain to register
        cid: IPFS CID to map to
        app_name: Human-readable app name
        gateway_url: Override gateway URL

    Returns:
        Dict with 'subdomain', 'url', 'cid'

    Raises:
        GatewayError: If registration fails
    """
    base = gateway_url or GATEWAY_URL
    payload = json.dumps({
        "subdomain": subdomain,
        "cid": cid,
        "appName": app_name or subdomain,
    }).encode()

    headers = {
        "Authorization": f"Bearer {GATEWAY_API_KEY}",
        "Content-Type": "application/json",
    }

    # Try register first
    try:
        req = urllib.request.Request(
            f"{base}/api/domains/register",
            data=payload,
            headers=headers,
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        if e.code == 409:
            # Already registered — update CID (redeployment)
            return _update_domain(subdomain, cid, base, headers)
        elif e.code == 401:
            raise GatewayError("Authentication failed with Varity gateway service.")
        elif e.code == 400:
            body = e.read().decode()
            try:
                detail = json.loads(body).get("error", body)
            except Exception:
                detail = body
            raise GatewayError(f"Invalid subdomain: {detail}")
        else:
            raise GatewayError(f"Gateway returned HTTP {e.code}")

    except urllib.error.URLError as e:
        raise GatewayError(
            f"Cannot connect to Varity gateway. "
            f"Check your internet connection.\nError: {e.reason}"
        )

    except GatewayError:
        raise

    except Exception as e:
        raise GatewayError(f"Unexpected error registering domain: {e}")


def _update_domain(subdomain: str, cid: str, base: str, headers: dict) -> Dict:
    """Update an existing domain mapping (internal helper for redeployments)."""
    payload = json.dumps({"subdomain": subdomain, "cid": cid}).encode()

    try:
        req = urllib.request.Request(
            f"{base}/api/domains/update",
            data=payload,
            headers=headers,
            method="PUT",
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        raise GatewayError(f"Failed to update domain: HTTP {e.code}")

    except Exception as e:
        raise GatewayError(f"Failed to update domain: {e}")
