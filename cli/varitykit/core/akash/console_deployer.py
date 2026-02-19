"""
Akash Console API Deployer

Deploys applications to Akash Network using the Console Managed Wallet API.
No local CLI, wallet, or AKT tokens required.

API Docs: https://akash.network/docs/api-documentation/console-api/
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

from .types import (
    AkashDeploymentResult,
    AkashDeploymentStatus,
    AkashError,
    AkashManifest,
    AkashProviderBid,
    AkashTimeoutError,
)


class AkashConsoleDeployer:
    """
    Deploys applications to Akash Network using Console API.

    Simple, managed deployment with no wallet/CLI requirements.
    """

    BASE_URL = "https://console-api.akash.network/v1"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        default_deposit: float = 5.0,
        timeout: int = 120,
    ):
        """
        Initialize Akash Console deployer.

        Args:
            api_key: Console API key (defaults to AKASH_CONSOLE_API_KEY env var)
            base_url: API base URL (defaults to production)
            default_deposit: Default deposit in USD (default: $5)
            timeout: Request timeout in seconds (default: 120)
        """
        self.api_key = api_key or os.getenv("AKASH_CONSOLE_API_KEY")
        self.base_url = base_url or os.getenv("AKASH_CONSOLE_API", self.BASE_URL)
        self.default_deposit = default_deposit
        self.timeout = timeout
        self._certificate: Optional[Dict[str, str]] = None  # Cached certificate

        if not self.api_key:
            raise AkashError(
                "Akash Console API key not found. "
                "Set AKASH_CONSOLE_API_KEY environment variable."
            )

    def _headers(self) -> Dict[str, str]:
        """Get request headers with API key"""
        return {
            "Content-Type": "application/json",
            "x-api-key": self.api_key or "",
        }

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Make API request"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self._headers(),
                json=data,
                params=params,
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json() if response.text else {}
        except requests.exceptions.Timeout:
            raise AkashTimeoutError(f"Request timed out after {self.timeout}s")
        except requests.exceptions.HTTPError as e:
            error_detail = ""
            try:
                error_detail = e.response.json().get("message", str(e))
            except Exception:
                error_detail = str(e)
            raise AkashError(f"API request failed: {error_detail}")
        except requests.exceptions.RequestException as e:
            raise AkashError(f"Request failed: {str(e)}")

    def deploy(
        self,
        sdl: str,
        deposit: Optional[float] = None,
        wait_for_active: bool = True,
    ) -> AkashDeploymentResult:
        """
        Deploy application to Akash Network.

        Args:
            sdl: SDL manifest content (YAML string)
            deposit: Deposit amount in USD (default: $5)
            wait_for_active: Wait for deployment to become active

        Returns:
            AkashDeploymentResult with deployment details
        """
        deposit = deposit or self.default_deposit

        try:
            # Step 1: Create deployment (IMPORTANT: wrap in "data" object)
            print("Creating deployment...")
            create_response = self._request(
                "POST",
                "/deployments",
                data={"data": {"sdl": sdl, "deposit": deposit}},
            )

            # Response is wrapped in "data" object: {"data": {"dseq": "...", "manifest": "..."}}
            response_data = create_response.get("data", create_response)
            dseq = response_data.get("dseq")
            manifest = response_data.get("manifest")
            if not dseq:
                raise AkashError(f"No deployment ID returned. Response: {create_response}")

            print(f"  Deployment ID: {dseq}")

            # Step 2: Wait for bids
            print("Waiting for provider bids...")
            bids, raw_bids = self._wait_for_bids(dseq)

            if not bids:
                raise AkashError("No provider bids received")

            print(f"  Received {len(bids)} bids")

            # Step 3: Select best bid (already sorted by price - cheapest first)
            best_bid = bids[0]  # Cheapest bid
            best_raw_bid = raw_bids[0]
            print(f"  Selected provider: {best_bid.provider} (price: {best_bid.price} uakt/block)")

            # Step 4: Check if certificate is required and create if needed
            # isCertificateRequired is at top level of raw bid
            needs_cert = best_raw_bid.get("isCertificateRequired", False)
            certificate = None
            if needs_cert:
                print("  Creating mTLS certificate...")
                certificate = self._create_certificate()

            # Step 5: Create lease with proper format
            print("Creating lease...")
            # bid_id is nested: raw_bid.bid.id
            bid_info = best_raw_bid.get("bid", {})
            bid_id = bid_info.get("id", {})
            lease_payload: Dict[str, Any] = {
                "manifest": manifest,
                "leases": [{
                    "dseq": dseq,
                    "gseq": bid_id.get("gseq", 1),
                    "oseq": bid_id.get("oseq", 1),
                    "provider": best_bid.provider,
                }]
            }

            if certificate:
                lease_payload["certificate"] = {
                    "certPem": certificate.get("certPem", ""),
                    "keyPem": certificate.get("encryptedKey", ""),
                }

            lease_response = self._request(
                "POST",
                "/leases",
                data=lease_payload,
            )

            # Step 6: Get deployment info
            if wait_for_active:
                print("Waiting for deployment to become active...")
                time.sleep(10)  # Give provider time to start

            deployment_info = self.get_deployment(dseq)

            # Extract URL from deployment info
            url = self._extract_url(deployment_info, lease_response)
            print(f"  URL: {url}")

            return AkashDeploymentResult(
                success=True,
                deployment_id=dseq,
                lease_id=lease_response.get("lease_id"),
                provider=best_bid.provider,
                url=url,
                status=AkashDeploymentStatus.ACTIVE,
                price_per_block=best_bid.price,
                estimated_monthly_cost=self._estimate_monthly_cost(best_bid.price),
                metadata={
                    "deposit": deposit,
                    "bid_count": len(bids),
                },
            )

        except AkashError:
            raise
        except Exception as e:
            raise AkashError(f"Deployment failed: {str(e)}")

    def deploy_from_manifest(
        self,
        manifest: AkashManifest,
        deposit: Optional[float] = None,
    ) -> AkashDeploymentResult:
        """
        Deploy from AkashManifest object.

        Args:
            manifest: AkashManifest object
            deposit: Deposit amount in USD

        Returns:
            AkashDeploymentResult
        """
        return self.deploy(manifest.to_yaml(), deposit=deposit)

    def _wait_for_bids(
        self,
        dseq: str,
        max_wait: int = 120,
        poll_interval: int = 5,
    ) -> Tuple[List[AkashProviderBid], List[Dict[str, Any]]]:
        """
        Wait for and retrieve provider bids.

        Returns:
            Tuple of (parsed bids, raw bid data for later use)
        """
        start_time = time.time()

        while time.time() - start_time < max_wait:
            response = self._request("GET", "/bids", params={"dseq": dseq})
            # Bids are under "data" array, not "bids"
            bids_data = response.get("data", [])

            if bids_data:
                parsed_bids = []
                for bid_wrapper in bids_data:
                    # Structure: {"bid": {"id": {...}, "price": {...}}, "isCertificateRequired": bool}
                    bid = bid_wrapper.get("bid", {})
                    bid_id = bid.get("id", {})

                    # Get provider from bid.id.provider
                    provider = bid_id.get("provider", "")

                    # Get price from bid.price.amount (it's a decimal string)
                    price_obj = bid.get("price", {})
                    price_str = price_obj.get("amount", "0")
                    # Convert decimal string to int (uakt)
                    try:
                        price = int(float(price_str))
                    except (ValueError, TypeError):
                        price = 0

                    parsed_bids.append(
                        AkashProviderBid(
                            provider=provider,
                            price=price,
                            location=bid_wrapper.get("location"),
                            uptime=float(bid_wrapper.get("uptime", 95.0)),
                            reputation_score=float(bid_wrapper.get("reputation", 80.0)),
                        )
                    )

                # Sort by price (cheapest first) and return
                parsed_bids.sort(key=lambda b: b.price)
                return parsed_bids, bids_data

            time.sleep(poll_interval)

        return [], []

    def _create_certificate(self) -> Dict[str, str]:
        """
        Create mTLS certificate for secure provider communication.

        Returns:
            Certificate data with certPem, pubkeyPem, encryptedKey
        """
        # Use cached certificate if available
        if self._certificate:
            return self._certificate

        response = self._request(
            "POST",
            "/certificates",
            data={},
        )

        self._certificate = response
        return response

    def _extract_url(
        self,
        deployment_info: Dict,
        lease_response: Optional[Dict] = None,
    ) -> str:
        """
        Extract URL from deployment info or lease response.

        Args:
            deployment_info: Deployment details from GET /v1/deployments/{dseq}
            lease_response: Response from POST /v1/leases (optional)

        Returns:
            Public URL for accessing the deployed application
        """
        # First, try to get URL from lease response (has most current info)
        if lease_response:
            services = lease_response.get("services", {})
            for service in services.values() if isinstance(services, dict) else []:
                if isinstance(service, dict):
                    uris = service.get("uris", [])
                    if uris:
                        return uris[0]

        # Try to get URL from various possible locations in deployment info
        if "url" in deployment_info:
            return deployment_info["url"]

        # Check services.{name}.uris[] (primary location per API spec)
        if "services" in deployment_info:
            services = deployment_info["services"]
            if isinstance(services, dict):
                for service in services.values():
                    if isinstance(service, dict):
                        uris = service.get("uris", [])
                        if uris:
                            return uris[0]
            elif isinstance(services, list):
                for service in services:
                    if isinstance(service, dict):
                        uris = service.get("uris", [])
                        if uris:
                            return uris[0]

        # Check forwarded_ports as fallback
        if "lease" in deployment_info:
            lease = deployment_info["lease"]
            if "forwarded_ports" in lease:
                ports = lease["forwarded_ports"]
                if ports:
                    # Construct URL from first forwarded port
                    if isinstance(ports, list):
                        port_info = ports[0]
                    elif isinstance(ports, dict):
                        port_info = next(iter(ports.values()), {})
                    else:
                        port_info = {}
                    host = port_info.get("host", "")
                    ext_port = port_info.get("external_port", "")
                    if host:
                        return f"https://{host}:{ext_port}" if ext_port else f"https://{host}"

        # Also check services.*.forwarded_ports
        if "services" in deployment_info:
            services = deployment_info["services"]
            if isinstance(services, dict):
                for service in services.values():
                    if isinstance(service, dict) and "forwarded_ports" in service:
                        ports = service["forwarded_ports"]
                        if ports and isinstance(ports, dict):
                            for port_info in ports.values():
                                host = port_info.get("host", "")
                                ext_port = port_info.get("external_port", "")
                                if host:
                                    return f"https://{host}:{ext_port}" if ext_port else f"https://{host}"

        return f"https://deployment-{deployment_info.get('dseq', 'unknown')}.akash.network"

    def _estimate_monthly_cost(self, price_per_block: int) -> float:
        """Estimate monthly cost from price per block"""
        # Akash has ~6 second block time
        # 30 days * 24 hours * 60 minutes * 10 blocks/min = 432,000 blocks/month
        blocks_per_month = 432000
        uakt_per_month = price_per_block * blocks_per_month
        # 1 AKT = 1,000,000 uAKT, roughly $3-5 per AKT
        akt_per_month = uakt_per_month / 1_000_000
        usd_per_month = akt_per_month * 4  # Rough AKT price
        return round(usd_per_month, 2)

    def get_deployment(self, dseq: str) -> Dict[str, Any]:
        """Get deployment details"""
        return self._request("GET", f"/deployments/{dseq}")

    def list_deployments(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """List all deployments"""
        response = self._request(
            "GET",
            "/deployments",
            params={"limit": limit, "offset": offset},
        )
        return response.get("deployments", [])

    def add_deposit(self, dseq: str, amount: float) -> Dict[str, Any]:
        """Add deposit to deployment"""
        return self._request(
            "POST",
            "/deposit-deployment",
            data={"data": {"dseq": dseq, "deposit": amount}},
        )

    def close_deployment(self, dseq: str) -> bool:
        """Close deployment and recover remaining deposit"""
        try:
            self._request("DELETE", f"/deployments/{dseq}")
            return True
        except AkashError:
            return False

    def get_status(self, dseq: str) -> AkashDeploymentStatus:
        """Get deployment status"""
        try:
            info = self.get_deployment(dseq)
            state = info.get("state", "unknown").lower()

            status_map = {
                "active": AkashDeploymentStatus.ACTIVE,
                "closed": AkashDeploymentStatus.CLOSED,
                "pending": AkashDeploymentStatus.PENDING,
            }
            return status_map.get(state, AkashDeploymentStatus.PENDING)
        except Exception:
            return AkashDeploymentStatus.FAILED
