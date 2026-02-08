"""
Akash Console API Deployer

Deploys applications to Akash Network using the Console Managed Wallet API.
No local CLI, wallet, or AKT tokens required.

API Docs: https://akash.network/docs/api-documentation/console-api/
"""

import os
import time
from typing import Any, Dict, List, Optional

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
            # Step 1: Create deployment
            print("Creating deployment...")
            create_response = self._request(
                "POST",
                "/deployments",
                data={"sdl": sdl, "deposit": deposit},
            )

            dseq = create_response.get("dseq")
            if not dseq:
                raise AkashError("No deployment ID returned")

            print(f"  Deployment ID: {dseq}")

            # Step 2: Wait for bids
            print("Waiting for provider bids...")
            bids = self._wait_for_bids(dseq)

            if not bids:
                raise AkashError("No provider bids received")

            print(f"  Received {len(bids)} bids")

            # Step 3: Select best bid (lowest price)
            best_bid = min(bids, key=lambda b: b.price)
            print(f"  Selected provider: {best_bid.provider}")

            # Step 4: Create lease
            print("Creating lease...")
            lease_response = self._request(
                "POST",
                "/leases",
                data={"dseq": dseq, "provider": best_bid.provider},
            )

            # Step 5: Get deployment info
            if wait_for_active:
                print("Waiting for deployment to become active...")
                time.sleep(10)  # Give provider time to start

            deployment_info = self.get_deployment(dseq)

            # Extract URL from deployment info
            url = self._extract_url(deployment_info)
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
        max_wait: int = 60,
        poll_interval: int = 5,
    ) -> List[AkashProviderBid]:
        """Wait for and retrieve provider bids"""
        start_time = time.time()

        while time.time() - start_time < max_wait:
            response = self._request("GET", "/bids", params={"dseq": dseq})
            bids_data = response.get("bids", [])

            if bids_data:
                return [
                    AkashProviderBid(
                        provider=bid.get("provider", ""),
                        price=int(bid.get("price", 0)),
                        location=bid.get("location"),
                        uptime=float(bid.get("uptime", 95.0)),
                        reputation_score=float(bid.get("reputation", 80.0)),
                    )
                    for bid in bids_data
                ]

            time.sleep(poll_interval)

        return []

    def _extract_url(self, deployment_info: Dict) -> str:
        """Extract URL from deployment info"""
        # Try to get URL from various possible locations
        if "url" in deployment_info:
            return deployment_info["url"]

        if "lease" in deployment_info:
            lease = deployment_info["lease"]
            if "forwarded_ports" in lease:
                ports = lease["forwarded_ports"]
                if ports:
                    # Construct URL from first forwarded port
                    port_info = ports[0] if isinstance(ports, list) else next(iter(ports.values()))
                    host = port_info.get("host", "")
                    port = port_info.get("external_port", "")
                    if host:
                        return f"https://{host}:{port}" if port else f"https://{host}"

        if "services" in deployment_info:
            services = deployment_info["services"]
            for service in services.values() if isinstance(services, dict) else services:
                if isinstance(service, dict) and "uris" in service:
                    uris = service["uris"]
                    if uris:
                        return uris[0]

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
            data={"dseq": dseq, "deposit": amount},
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
