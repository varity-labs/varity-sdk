"""
Akash Network Deployer

Executes Akash CLI commands to deploy applications to Akash Network.

Workflow:
1. Create deployment (akash tx deployment create)
2. Wait for provider bids
3. Select best provider
4. Create lease (akash tx market lease create)
5. Send manifest to provider
6. Get deployment URL

Requires:
- Akash CLI installed (`akash` binary in PATH)
- Akash wallet with AKT tokens
- Environment variables: AKASH_WALLET_KEY, AKASH_NETWORK, AKASH_NODE
"""

import json
import os
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional

from ..types import BuildArtifacts, ProjectInfo
from .manifest_generator import ManifestGenerator
from .provider_selector import ProviderSelector
from .types import (
    AkashDeploymentResult,
    AkashDeploymentStatus,
    AkashError,
    AkashManifest,
    AkashProviderBid,
    AkashProviderError,
    AkashTimeoutError,
)


class AkashDeployer:
    """
    Deploys applications to Akash Network using Akash CLI.

    Handles deployment creation, provider selection, lease creation,
    and manifest submission.
    """

    def __init__(
        self,
        wallet_key: Optional[str] = None,
        network: str = "mainnet",
        node_url: Optional[str] = None,
        chain_id: str = "akashnet-2",
        timeout: int = 300,
    ):
        """
        Initialize Akash deployer.

        Args:
            wallet_key: Akash wallet private key (defaults to AKASH_WALLET_KEY env var)
            network: Network to deploy to ('mainnet' or 'testnet')
            node_url: Akash node RPC URL (defaults to AKASH_NODE env var)
            chain_id: Akash chain ID (default: akashnet-2)
            timeout: Operation timeout in seconds (default: 300)

        Raises:
            AkashError: If Akash CLI not found or configuration invalid
        """
        self.wallet_key = wallet_key or os.getenv("AKASH_WALLET_KEY")
        self.network = network
        self.node_url = node_url or os.getenv("AKASH_NODE", "https://rpc.akash.network:443")
        self.chain_id = chain_id
        self.timeout = timeout

        # Initialize sub-components
        self.manifest_generator = ManifestGenerator()
        self.provider_selector = ProviderSelector()

        # Validate configuration
        self._validate_configuration()

    def _validate_configuration(self):
        """
        Validate Akash CLI installation and configuration.

        Raises:
            AkashError: If validation fails
        """
        # Check if Akash CLI is installed
        try:
            result = subprocess.run(
                ["akash", "version"], capture_output=True, text=True, timeout=10
            )
            if result.returncode != 0:
                raise AkashError("Akash CLI not working properly")
        except FileNotFoundError:
            raise AkashError(
                "Akash CLI not found. Install from: https://docs.akash.network/guides/cli"
            )
        except subprocess.TimeoutExpired:
            raise AkashError("Akash CLI not responding")

        # Check wallet key
        if not self.wallet_key:
            raise AkashError(
                "Akash wallet key not provided. "
                "Set AKASH_WALLET_KEY environment variable or pass wallet_key parameter."
            )

        # Check node URL
        if not self.node_url:
            raise AkashError(
                "Akash node URL not provided. "
                "Set AKASH_NODE environment variable or pass node_url parameter."
            )

    def deploy_frontend(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        cpu_units: float = 0.5,
        memory_size: str = "512Mi",
        storage_size: str = "1Gi",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> AkashDeploymentResult:
        """
        Deploy frontend to Akash Network.

        Args:
            project_info: Detected project information
            build_artifacts: Built frontend artifacts
            cpu_units: CPU allocation (default: 0.5)
            memory_size: Memory allocation (default: 512Mi)
            storage_size: Storage allocation (default: 1Gi)
            env_vars: Optional environment variables

        Returns:
            AkashDeploymentResult with deployment details

        Raises:
            AkashError: If deployment fails
            AkashProviderError: If no suitable provider found
            AkashTimeoutError: If deployment times out
        """
        # Generate manifest
        manifest = self.manifest_generator.generate_frontend_manifest(
            project_info,
            build_artifacts,
            cpu_units=cpu_units,
            memory_size=memory_size,
            storage_size=storage_size,
            env_vars=env_vars,
        )

        # Deploy manifest
        return self._execute_deployment(manifest, "frontend")

    def deploy_backend(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        runtime: str = "nodejs",
        port: int = 3000,
        cpu_units: float = 1.0,
        memory_size: str = "1Gi",
        storage_size: str = "2Gi",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> AkashDeploymentResult:
        """
        Deploy backend to Akash Network.

        Args:
            project_info: Detected project information
            build_artifacts: Built backend artifacts
            runtime: Runtime type ('nodejs', 'python', 'go')
            port: Application port (default: 3000)
            cpu_units: CPU allocation (default: 1.0)
            memory_size: Memory allocation (default: 1Gi)
            storage_size: Storage allocation (default: 2Gi)
            env_vars: Optional environment variables

        Returns:
            AkashDeploymentResult with deployment details

        Raises:
            AkashError: If deployment fails
        """
        # Generate manifest
        manifest = self.manifest_generator.generate_backend_manifest(
            project_info,
            build_artifacts,
            runtime=runtime,
            port=port,
            cpu_units=cpu_units,
            memory_size=memory_size,
            storage_size=storage_size,
            env_vars=env_vars,
        )

        # Deploy manifest
        return self._execute_deployment(manifest, "backend")

    def deploy_fullstack(
        self,
        project_info: ProjectInfo,
        frontend_artifacts: BuildArtifacts,
        backend_artifacts: BuildArtifacts,
        backend_runtime: str = "nodejs",
        backend_port: int = 3000,
        env_vars: Optional[Dict[str, str]] = None,
    ) -> AkashDeploymentResult:
        """
        Deploy full-stack application (frontend + backend) to Akash.

        Args:
            project_info: Detected project information
            frontend_artifacts: Built frontend artifacts
            backend_artifacts: Built backend artifacts
            backend_runtime: Backend runtime type
            backend_port: Backend service port
            env_vars: Optional environment variables

        Returns:
            AkashDeploymentResult with both frontend and backend URLs
        """
        # Generate full-stack manifest
        manifest = self.manifest_generator.generate_fullstack_manifest(
            project_info,
            frontend_artifacts,
            backend_artifacts,
            backend_runtime=backend_runtime,
            backend_port=backend_port,
            env_vars=env_vars,
        )

        # Deploy manifest
        return self._execute_deployment(manifest, "fullstack")

    def _execute_deployment(
        self, manifest: AkashManifest, deployment_type: str
    ) -> AkashDeploymentResult:
        """
        Execute complete Akash deployment workflow.

        Args:
            manifest: SDL manifest to deploy
            deployment_type: Type of deployment (for logging)

        Returns:
            AkashDeploymentResult

        Raises:
            AkashError: If deployment fails
        """
        try:
            # Step 1: Create deployment
            print(f"Creating Akash deployment ({deployment_type})...")
            deployment_id = self._create_deployment(manifest)
            print(f"  Deployment ID: {deployment_id}")

            # Step 2: Wait for bids
            print("Waiting for provider bids...")
            bids = self._wait_for_bids(deployment_id)
            print(f"  Received {len(bids)} bids")

            if not bids:
                raise AkashProviderError("No provider bids received")

            # Step 3: Select best provider
            print("Selecting best provider...")
            best_bid = self.provider_selector.select_best_provider(bids)
            print(f"  Selected: {best_bid.provider}")
            print(f"  Price: {best_bid.price} uakt/block")

            # Step 4: Create lease
            print("Creating lease...")
            lease_id = self._create_lease(deployment_id, best_bid.provider)
            print(f"  Lease ID: {lease_id}")

            # Step 5: Send manifest
            print("Sending manifest to provider...")
            self._send_manifest(deployment_id, best_bid.provider, manifest)
            print("  Manifest sent successfully")

            # Step 6: Wait for deployment to be active
            print("Waiting for deployment to become active...")
            time.sleep(10)  # Give provider time to start services

            # Step 7: Get deployment URL
            print("Retrieving deployment URL...")
            url = self._get_deployment_url(deployment_id, best_bid.provider)
            print(f"  URL: {url}")

            # Calculate estimated costs
            monthly_cost = self.provider_selector.estimate_monthly_cost(best_bid.price)

            # Create result
            result = AkashDeploymentResult(
                success=True,
                deployment_id=deployment_id,
                lease_id=lease_id,
                provider=best_bid.provider,
                url=url,
                status=AkashDeploymentStatus.ACTIVE,
                price_per_block=best_bid.price,
                estimated_monthly_cost=monthly_cost,
                metadata={
                    "deployment_type": deployment_type,
                    "bid_count": len(bids),
                    "network": self.network,
                },
            )

            return result

        except subprocess.TimeoutExpired as e:
            raise AkashTimeoutError(f"Akash operation timed out after {self.timeout} seconds")
        except subprocess.CalledProcessError as e:
            raise AkashError(f"Akash CLI command failed: {e.stderr if e.stderr else str(e)}")
        except Exception as e:
            raise AkashError(f"Deployment failed: {str(e)}")

    def _create_deployment(self, manifest: AkashManifest) -> str:
        """
        Create Akash deployment.

        Args:
            manifest: SDL manifest

        Returns:
            Deployment ID (DSEQ)
        """
        # Write manifest to temporary file
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(manifest.to_yaml())
            manifest_path = f.name

        try:
            # Execute deployment creation
            cmd = [
                "akash",
                "tx",
                "deployment",
                "create",
                manifest_path,
                "--from",
                "default",  # Wallet name
                "--node",
                self.node_url,
                "--chain-id",
                self.chain_id,
                "--gas",
                "auto",
                "--gas-adjustment",
                "1.3",
                "--yes",
                "--output",
                "json",
            ]

            result = subprocess.run(
            [c for c in cmd if c is not None],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                check=True,
                env={**os.environ, "AKASH_WALLET_KEY": self.wallet_key},
            )

            # Parse deployment ID from output
            output = json.loads(result.stdout)
            deployment_id = output.get("dseq", output.get("deployment_id"))

            if not deployment_id:
                raise AkashError("Failed to extract deployment ID from response")

            return str(deployment_id)

        finally:
            # Clean up temporary manifest file
            try:
                os.unlink(manifest_path)
            except Exception:
                pass

    def _wait_for_bids(self, deployment_id: str, wait_time: int = 30) -> List[AkashProviderBid]:
        """
        Wait for provider bids on deployment.

        Args:
            deployment_id: Deployment ID
            wait_time: Time to wait for bids in seconds

        Returns:
            List of provider bids
        """
        # Wait for bids to arrive
        time.sleep(wait_time)

        # Query bids
        cmd = [
            "akash",
            "query",
            "market",
            "bid",
            "list",
            "--owner",
            "default",
            "--dseq",
            deployment_id,
            "--node",
            self.node_url,
            "--output",
            "json",
        ]

        result = subprocess.run(
            [c for c in cmd if c is not None], capture_output=True, text=True, timeout=self.timeout, check=True
        )

        # Parse bids
        output = json.loads(result.stdout)
        bids_data = output.get("bids", [])

        bids = []
        for bid_data in bids_data:
            bid = AkashProviderBid(
                provider=bid_data.get("provider", ""),
                price=int(bid_data.get("price", {}).get("amount", 0)),
                location=bid_data.get("location"),
                uptime=float(bid_data.get("uptime", 95.0)),
                reputation_score=float(bid_data.get("reputation", 80.0)),
                attributes=bid_data.get("attributes", {}),
            )
            bids.append(bid)

        return bids

    def _create_lease(self, deployment_id: str, provider: str) -> str:
        """
        Create lease with selected provider.

        Args:
            deployment_id: Deployment ID
            provider: Provider address

        Returns:
            Lease ID
        """
        cmd = [
            "akash",
            "tx",
            "market",
            "lease",
            "create",
            "--dseq",
            deployment_id,
            "--provider",
            provider,
            "--from",
            "default",
            "--node",
            self.node_url,
            "--chain-id",
            self.chain_id,
            "--gas",
            "auto",
            "--gas-adjustment",
            "1.3",
            "--yes",
            "--output",
            "json",
        ]

        result = subprocess.run(
            [c for c in cmd if c is not None],
            capture_output=True,
            text=True,
            timeout=self.timeout,
            check=True,
            env={**os.environ, "AKASH_WALLET_KEY": self.wallet_key},
        )

        output = json.loads(result.stdout)
        lease_id = output.get("lease_id", f"{deployment_id}/{provider}")

        return lease_id

    def _send_manifest(self, deployment_id: str, provider: str, manifest: AkashManifest):
        """
        Send manifest to provider.

        Args:
            deployment_id: Deployment ID
            provider: Provider address
            manifest: SDL manifest
        """
        # Write manifest to temporary file
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(manifest.to_yaml())
            manifest_path = f.name

        try:
            cmd = [
                "akash",
                "provider",
                "send-manifest",
                manifest_path,
                "--dseq",
                deployment_id,
                "--provider",
                provider,
                "--from",
                "default",
                "--node",
                self.node_url,
            ]

            subprocess.run(
            [c for c in cmd if c is not None],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                check=True,
                env={**os.environ, "AKASH_WALLET_KEY": self.wallet_key},
            )

        finally:
            # Clean up temporary manifest file
            try:
                os.unlink(manifest_path)
            except Exception:
                pass

    def _get_deployment_url(self, deployment_id: str, provider: str) -> str:
        """
        Get deployment URL from provider.

        Args:
            deployment_id: Deployment ID
            provider: Provider address

        Returns:
            Deployment URL
        """
        cmd = [
            "akash",
            "provider",
            "lease-status",
            "--dseq",
            deployment_id,
            "--provider",
            provider,
            "--from",
            "default",
            "--node",
            self.node_url,
            "--output",
            "json",
        ]

        result = subprocess.run(
            [c for c in cmd if c is not None], capture_output=True, text=True, timeout=self.timeout, check=True
        )

        output = json.loads(result.stdout)

        # Extract URL from lease status
        services = output.get("services", {})
        if services:
            # Get first service URL
            first_service = next(iter(services.values()))
            uris = first_service.get("uris", [])
            if uris:
                return uris[0]

        # Fallback: construct URL from provider and deployment ID
        provider_host = provider.split("/")[0] if "/" in provider else provider
        return f"https://{deployment_id}.{provider_host}"

    def get_deployment_status(self, deployment_id: str) -> AkashDeploymentStatus:
        """
        Query deployment status.

        Args:
            deployment_id: Deployment ID

        Returns:
            Current deployment status
        """
        try:
            cmd = [
                "akash",
                "query",
                "deployment",
                "get",
                "--owner",
                "default",
                "--dseq",
                deployment_id,
                "--node",
                self.node_url,
                "--output",
                "json",
            ]

            result = subprocess.run(
            [c for c in cmd if c is not None], capture_output=True, text=True, timeout=30, check=True)

            output = json.loads(result.stdout)
            state = output.get("deployment", {}).get("state", "unknown")

            status_map = {
                "active": AkashDeploymentStatus.ACTIVE,
                "closed": AkashDeploymentStatus.CLOSED,
                "pending": AkashDeploymentStatus.PENDING,
            }

            return status_map.get(state.lower(), AkashDeploymentStatus.PENDING)

        except Exception:
            return AkashDeploymentStatus.FAILED

    def close_deployment(self, deployment_id: str) -> bool:
        """
        Close Akash deployment.

        Args:
            deployment_id: Deployment ID to close

        Returns:
            True if successful
        """
        try:
            cmd = [
                "akash",
                "tx",
                "deployment",
                "close",
                "--dseq",
                deployment_id,
                "--from",
                "default",
                "--node",
                self.node_url,
                "--chain-id",
                self.chain_id,
                "--yes",
            ]

            subprocess.run(
            [c for c in cmd if c is not None],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                check=True,
                env={**os.environ, "AKASH_WALLET_KEY": self.wallet_key},
            )

            return True

        except Exception:
            return False
