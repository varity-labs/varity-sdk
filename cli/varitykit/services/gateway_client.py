"""
Gateway Client — Register and manage custom domains via the Varity Gateway.

Enables automatic domain registration on deploy: every app gets varity.app/{name}.
The CLI calls the gateway API to register/update domain mappings.

Security:
- Gateway API key is auto-fetched from the credential proxy (same pattern as credential_fetcher.py)
- Developer authenticates via deploy_key (from `varitykit login`)
"""

import os
import re
import json
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Optional, Dict, List


class GatewayError(Exception):
    """Raised when gateway operations fail"""
    pass


# Gateway URL (Akash deployment)
GATEWAY_URL = os.getenv(
    "VARITY_GATEWAY_URL",
    "https://varity.app"
)

# Credential proxy URL (same as credential_fetcher.py)
CREDENTIAL_PROXY_URL = os.getenv(
    "VARITY_CREDENTIAL_PROXY_URL",
    "http://j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host"
)

# Config file path
CONFIG_PATH = Path.home() / ".varitykit" / "config.json"


def _get_gateway_api_key() -> Optional[str]:
    """
    Resolve gateway API key with auto-fetch from credential proxy.

    Resolution order:
    1. Environment variable VARITY_GATEWAY_API_KEY (for CI/custom deployments)
    2. Cached value in ~/.varitykit/config.json
    3. Auto-fetch from credential proxy using deploy_key (same pattern as credential_fetcher.py)
    """
    # 1. Check env var
    env_key = os.getenv("VARITY_GATEWAY_API_KEY")
    if env_key:
        return env_key

    # 2. Check config.json cache
    config = {}
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
        except (json.JSONDecodeError, IOError):
            config = {}

    cached_key = config.get("gateway_api_key")
    if cached_key:
        return cached_key

    # 3. Auto-fetch from credential proxy using deploy_key
    deploy_key = config.get("deploy_key")
    if not deploy_key:
        return None

    try:
        url = f"{CREDENTIAL_PROXY_URL}/api/credentials/gateway"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {deploy_key}"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            api_key = data.get("api_key")
            if api_key:
                # Cache to config.json for subsequent calls
                _cache_gateway_key(config, api_key)
                return api_key
    except Exception:
        pass  # Fall through — gateway key not available

    return None


def _cache_gateway_key(config: dict, api_key: str) -> None:
    """Cache gateway API key to config.json (avoids repeated proxy calls)."""
    try:
        config["gateway_api_key"] = api_key
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, "w") as f:
            json.dump(config, f, indent=2)
        os.chmod(CONFIG_PATH, 0o600)
    except Exception:
        pass  # Non-fatal — next call will re-fetch


def get_deploy_key() -> Optional[str]:
    """
    Read the developer's deploy key.

    Resolution order:
    1. VARITY_DEPLOY_KEY environment variable (CI/CD, MCP agents)
    2. ~/.varitykit/config.json (interactive login)

    Returns:
        Deploy key string, or None if not configured.
    """
    # 1. Check environment variable (enables CI/CD and MCP agent workflows)
    env_key = os.getenv("VARITY_DEPLOY_KEY")
    if env_key:
        return env_key

    # 2. Check config file
    if not CONFIG_PATH.exists():
        return None

    try:
        with open(CONFIG_PATH, "r") as f:
            config = json.load(f)
        return config.get("deploy_key")
    except (json.JSONDecodeError, IOError):
        return None


def save_deploy_key(deploy_key: str) -> None:
    """
    Save deploy key to ~/.varitykit/config.json with restricted permissions.

    Args:
        deploy_key: The deploy key from the developer portal.
    """
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Restrict directory to owner-only access (drwx------)
    os.chmod(CONFIG_PATH.parent, 0o700)

    config = {}
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
        except (json.JSONDecodeError, IOError):
            config = {}

    config["deploy_key"] = deploy_key

    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)

    # Restrict config file to owner-only read/write (-rw-------)
    os.chmod(CONFIG_PATH, 0o600)


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


def check_availability(
    subdomain: str,
    owner_id: Optional[str] = None,
    gateway_url: Optional[str] = None,
) -> Dict:
    """
    Check if a subdomain is available.

    Args:
        subdomain: Subdomain to check
        owner_id: Developer's deploy key (enables 'owned_by_you' detection)
        gateway_url: Override gateway URL

    Returns:
        Dict with 'available' (bool), optional 'reason' (str), optional 'ownedByYou' (bool)

    Raises:
        GatewayError: If check fails
    """
    base = gateway_url or GATEWAY_URL
    url = f"{base}/api/domains/check/{subdomain}"
    if owner_id:
        url += f"?ownerId={urllib.parse.quote(owner_id)}"

    api_key = _get_gateway_api_key()
    if not api_key:
        raise GatewayError(
            "Not authenticated. Run 'varitykit login' first."
        )

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {api_key}"}
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
    tagline: Optional[str] = None,
    logo_url: Optional[str] = None,
    owner_id: Optional[str] = None,
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
        tagline: Short description for the deployment card (from package.json description)
        logo_url: URL to app icon for the deployment card
        owner_id: Developer's deploy key (ties domain to developer)
        gateway_url: Override gateway URL

    Returns:
        Dict with 'subdomain', 'url', 'cid'

    Raises:
        GatewayError: If registration fails
    """
    base = gateway_url or GATEWAY_URL
    api_key = _get_gateway_api_key()
    if not api_key:
        raise GatewayError(
            "Not authenticated. Run 'varitykit login' first."
        )

    body = {
        "subdomain": subdomain,
        "cid": cid,
        "appName": app_name or subdomain,
    }
    if tagline:
        body["tagline"] = tagline
    if logo_url:
        body["logoUrl"] = logo_url
    if owner_id:
        body["ownerId"] = owner_id
    payload = json.dumps(body).encode()

    headers = {
        "Authorization": f"Bearer {api_key}",
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

        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        if e.code == 409:
            # Already registered — update CID (redeployment)
            return _update_domain(subdomain, cid, base, headers, owner_id, tagline, logo_url)
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


def _update_domain(
    subdomain: str, cid: str, base: str, headers: dict,
    owner_id: Optional[str] = None,
    tagline: Optional[str] = None,
    logo_url: Optional[str] = None,
) -> Dict:
    """Update an existing domain mapping (internal helper for redeployments)."""
    body = {"subdomain": subdomain, "cid": cid}
    if owner_id:
        body["ownerId"] = owner_id
    if tagline:
        body["tagline"] = tagline
    if logo_url:
        body["logoUrl"] = logo_url
    payload = json.dumps(body).encode()

    try:
        req = urllib.request.Request(
            f"{base}/api/domains/update",
            data=payload,
            headers=headers,
            method="PUT",
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise GatewayError(
                "This domain is owned by another developer. "
                "Use a different name with --name."
            )
        raise GatewayError(f"Failed to update domain: HTTP {e.code}")

    except Exception as e:
        raise GatewayError(f"Failed to update domain: {e}")


def register_akash_domain(
    subdomain: str,
    deployment_url: str,
    deployment_id: str,
    app_name: Optional[str] = None,
    tagline: Optional[str] = None,
    logo_url: Optional[str] = None,
    owner_id: Optional[str] = None,
    gateway_url: Optional[str] = None,
) -> Dict:
    """
    Register a subdomain backed by an Akash deployment (dynamic hosting).

    Unlike register_domain() which maps to an IPFS CID, this maps to
    a live Akash provider URL for dynamic apps (Next.js server, Express, etc).

    Args:
        subdomain: Subdomain to register
        deployment_url: Akash provider URL (e.g., https://provider.akash.network:31782)
        deployment_id: Akash deployment DSEQ
        app_name: Human-readable app name
        tagline: Short description for the deployment card
        logo_url: URL to app icon for the deployment card
        owner_id: Developer's deploy key
        gateway_url: Override gateway URL

    Returns:
        Dict with 'subdomain', 'url'

    Raises:
        GatewayError: If registration fails
    """
    base = gateway_url or GATEWAY_URL
    api_key = _get_gateway_api_key()
    if not api_key:
        raise GatewayError(
            "Not authenticated. Run 'varitykit login' first."
        )

    body = {
        "subdomain": subdomain,
        "deploymentType": "akash",
        "deploymentUrl": deployment_url,
        "deploymentId": deployment_id,
        "appName": app_name or subdomain,
    }
    # Also include a dummy CID so the Gateway doesn't reject the request
    # (backwards compatibility with existing Gateway that requires cid field)
    body["cid"] = f"akash:{deployment_id}"

    if tagline:
        body["tagline"] = tagline
    if logo_url:
        body["logoUrl"] = logo_url
    if owner_id:
        body["ownerId"] = owner_id

    payload = json.dumps(body).encode()

    headers = {
        "Authorization": f"Bearer {api_key}",
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

        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        if e.code == 409:
            # Already registered — update (redeployment)
            return _update_akash_domain(
                subdomain, deployment_url, deployment_id,
                base, headers, owner_id, tagline, logo_url,
            )
        elif e.code == 401:
            raise GatewayError("Authentication failed with Varity gateway service.")
        elif e.code == 400:
            err_body = e.read().decode()
            try:
                detail = json.loads(err_body).get("error", err_body)
            except Exception:
                detail = err_body
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


def _update_akash_domain(
    subdomain: str, deployment_url: str, deployment_id: str,
    base: str, headers: dict,
    owner_id: Optional[str] = None,
    tagline: Optional[str] = None,
    logo_url: Optional[str] = None,
) -> Dict:
    """Update an existing domain mapping for Akash deployment (redeployment)."""
    body = {
        "subdomain": subdomain,
        "cid": f"akash:{deployment_id}",
        "deploymentType": "akash",
        "deploymentUrl": deployment_url,
        "deploymentId": deployment_id,
    }
    if owner_id:
        body["ownerId"] = owner_id
    if tagline:
        body["tagline"] = tagline
    if logo_url:
        body["logoUrl"] = logo_url
    payload = json.dumps(body).encode()

    try:
        req = urllib.request.Request(
            f"{base}/api/domains/update",
            data=payload,
            headers=headers,
            method="PUT",
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())

    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise GatewayError(
                "This domain is owned by another developer. "
                "Use a different name with --name."
            )
        raise GatewayError(f"Failed to update domain: HTTP {e.code}")

    except Exception as e:
        raise GatewayError(f"Failed to update domain: {e}")


def list_my_domains(owner_id: str, gateway_url: Optional[str] = None) -> List[Dict]:
    """
    List all domains owned by a developer.

    Args:
        owner_id: Developer's deploy key
        gateway_url: Override gateway URL

    Returns:
        List of domain dicts with subdomain, url, cid, appName, etc.

    Raises:
        GatewayError: If request fails
    """
    api_key = _get_gateway_api_key()
    if not api_key:
        raise GatewayError(
            "Not authenticated. Run 'varitykit login' first."
        )

    base = gateway_url or GATEWAY_URL
    url = f"{base}/api/domains/mine?ownerId={urllib.parse.quote(owner_id)}"

    try:
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {api_key}"}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
            return result.get("domains", [])

    except urllib.error.HTTPError as e:
        raise GatewayError(f"Gateway returned HTTP {e.code}")

    except Exception as e:
        raise GatewayError(f"Failed to list domains: {e}")
