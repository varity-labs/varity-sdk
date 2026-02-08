"""
Deployment Orchestrator - Coordinates complete deployment workflow

This orchestrator coordinates all deployment steps:
1. Project detection (Agent 1)
2. Build execution (Agent 1)
3. IPFS upload (Agent 2)
4. Deployment metadata storage
5. Result reporting

Phase 1 MVP: IPFS deployment only
Phase 2: Adds Akash deployment + App Store submission
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from .types import (
    BuildArtifacts,
    BuildError,
    DeploymentError,
    DeploymentOptions,
    DeploymentResult,
    IPFSUploadError,
    ProjectDetectionError,
    ProjectInfo,
)


class DeploymentOrchestrator:
    """
    Orchestrates complete deployment workflow.

    Coordinates project detection, building, IPFS upload, and metadata storage.

    Usage:
        orchestrator = DeploymentOrchestrator(verbose=True)
        result = orchestrator.deploy(
            project_path=".",
            network="varity",
            submit_to_store=False
        )
        print(f"Deployed to: {result.frontend_url}")
    """

    def __init__(self, verbose: bool = True):
        """
        Initialize deployment orchestrator.

        Args:
            verbose: Whether to print progress messages
        """
        self.verbose = verbose

        # These will be initialized when Agent 1 and Agent 2 are ready
        # For now, we import them lazily to allow testing with mocks
        self._detector = None
        self._builder = None
        self._ipfs = None
        self._akash = None  # Phase 2: Akash deployment (Agent 5)
        self._app_store = None  # Phase 2: App Store client (Agent 6)
        self._history = None  # Phase 2: Deployment history manager (Agent 7)

    @property
    def detector(self):
        """Lazy load ProjectDetector (Agent 1)"""
        if self._detector is None:
            try:
                from .project_detector import ProjectDetector

                self._detector = ProjectDetector()
            except ImportError:
                raise ImportError(
                    "ProjectDetector not yet implemented. " "Waiting for Agent 1 to complete."
                )
        return self._detector

    @property
    def builder(self):
        """Lazy load BuildManager (Agent 1)"""
        if self._builder is None:
            try:
                from .build_manager import BuildManager

                self._builder = BuildManager()
            except ImportError:
                raise ImportError(
                    "BuildManager not yet implemented. " "Waiting for Agent 1 to complete."
                )
        return self._builder

    @property
    def ipfs(self):
        """Lazy load IPFSUploader (Agent 2)"""
        if self._ipfs is None:
            try:
                from .ipfs_uploader import IPFSUploader

                self._ipfs = IPFSUploader()
            except ImportError:
                raise ImportError(
                    "IPFSUploader not yet implemented. " "Waiting for Agent 2 to complete."
                )
        return self._ipfs

    @property
    def akash(self):
        """Lazy load AkashConsoleDeployer (uses Console API - no CLI required)"""
        if self._akash is None:
            try:
                from .akash.console_deployer import AkashConsoleDeployer

                self._akash = AkashConsoleDeployer()
            except ImportError:
                raise ImportError(
                    "AkashConsoleDeployer not available. "
                    "Ensure AKASH_CONSOLE_API_KEY is set."
                )
        return self._akash

    @property
    def app_store(self):
        """Lazy load AppStoreClient (Agent 6 - Phase 2)"""
        if self._app_store is None:
            try:
                from .app_store.client import AppStoreClient

                self._app_store = AppStoreClient()
            except ImportError:
                raise ImportError(
                    "AppStoreClient not yet implemented. " "Waiting for Agent 6 to complete."
                )
        return self._app_store

    @property
    def history(self):
        """Lazy load DeploymentHistory (Agent 7 - Phase 2)"""
        if self._history is None:
            from .deployment_history import DeploymentHistory

            self._history = DeploymentHistory()
        return self._history

    def deploy(
        self,
        project_path: str = ".",
        network: str = "varity",
        hosting: str = "ipfs",
        tier: str = "free",
        submit_to_store: bool = False,
    ) -> DeploymentResult:
        """
        Deploy application to decentralized infrastructure.

        Args:
            project_path: Path to project directory (default: current directory)
            network: Target network (default: "varity")
            hosting: Hosting type - "ipfs" for static sites, "akash" for dynamic apps
            tier: Infrastructure tier - "free", "starter", "growth", "enterprise"
            submit_to_store: Auto-submit to App Store

        Returns:
            DeploymentResult with URLs, CID, and manifest

        Raises:
            ProjectDetectionError: If project type cannot be detected
            BuildError: If build fails
            IPFSUploadError: If IPFS upload fails
            DeploymentError: For other deployment failures
        """
        try:
            self._log("🚀 Starting deployment...")

            # Step 1: Detect project
            self._log("📦 Detecting project type...")
            project_info = self._detect_project(project_path)
            self._log(f"   Detected: {project_info.project_type}")

            # Step 2: Build project
            self._log(f"🔨 Building project ({project_info.build_command})...")
            build_artifacts = self._build_project(project_path, project_info)

            if not build_artifacts.success:
                raise BuildError("Build failed")

            self._log(
                f"   Built {len(build_artifacts.files)} files ({build_artifacts.total_size_mb:.2f} MB)"
            )

            # Step 3: Deploy based on hosting type
            frontend_url = ""
            thirdweb_url = ""
            cid = ""
            akash_result = None
            ipfs_result = None

            if hosting == "akash":
                self._log("☁️  Deploying...")
                akash_result = self._deploy_to_akash(project_info, build_artifacts)

                if not akash_result.success:
                    raise DeploymentError(
                        akash_result.error_message or "Deployment failed"
                    )

                frontend_url = akash_result.url or ""
                self._log(f"   URL: {frontend_url}")
            else:
                self._log("☁️  Deploying...")
                ipfs_result = self._upload_to_ipfs(build_artifacts)

                if not ipfs_result["success"]:
                    raise IPFSUploadError(ipfs_result.get("error_message", "Deployment failed"))

                cid = ipfs_result["cid"]
                frontend_url = ipfs_result["gatewayUrl"]
                thirdweb_url = ipfs_result["thirdwebUrl"]
                self._log(f"   URL: {frontend_url}")

            # Step 4: Create deployment manifest
            manifest = self._create_manifest(
                project_info, build_artifacts, ipfs_result, network, hosting, tier, akash_result
            )

            # Step 5: Save deployment metadata
            deployment_id = self._save_deployment(manifest)

            # Step 6: Submit to App Store
            app_store_url = None
            if submit_to_store:
                self._log("📝 Submitting to App Store...")
                try:
                    app_store_result = self._submit_to_app_store(
                        project_info,
                        {"frontend_url": frontend_url},
                        project_path,
                        network,
                    )

                    if app_store_result and app_store_result.success:
                        app_store_url = app_store_result.url
                        manifest["app_store"] = {
                            "submitted": True,
                            "app_id": app_store_result.app_id,
                            "tx_hash": app_store_result.tx_hash,
                            "url": app_store_result.url,
                            "status": "pending_approval",
                        }
                        self._log(f"   ✅ App ID: {app_store_result.app_id}")
                        self._log(f"   📱 View at: {app_store_result.url}")
                    else:
                        error_msg = (
                            app_store_result.error_message if app_store_result else "Unknown error"
                        )
                        self._log(f"   ⚠️  App Store submission failed: {error_msg}")
                        self._log("   Manual submission: https://store.varity.so/submit")
                        manifest["app_store"] = {"submitted": False, "error": error_msg}
                except Exception as e:
                    self._log(f"   ⚠️  App Store submission error: {e}")
                    self._log("   Manual submission: https://store.varity.so/submit")
                    manifest["app_store"] = {"submitted": False, "error": str(e)}

            # Step 7: Return result
            result = DeploymentResult(
                deployment_id=deployment_id,
                frontend_url=frontend_url,
                thirdweb_url=thirdweb_url,
                cid=cid,
                app_store_url=app_store_url,
                manifest=manifest,
            )

            self._log("✅ Deployment complete!")

            return result

        except ProjectDetectionError as e:
            self._log(f"❌ Could not detect project type: {e}")
            self._log("   Supported: Next.js, React, Vue")
            self._log("   Ensure package.json exists")
            raise

        except BuildError as e:
            self._log(f"❌ Build failed: {e}")
            self._log("   Try running build manually first")
            raise

        except IPFSUploadError as e:
            self._log(f"❌ Deployment failed: {e}")
            raise

        except Exception as e:
            self._log(f"❌ Deployment failed: {e}")
            raise DeploymentError(f"Deployment failed: {e}")

    def _detect_project(self, project_path: str) -> ProjectInfo:
        """
        Detect project type using ProjectDetector (Agent 1).

        Args:
            project_path: Path to project directory

        Returns:
            ProjectInfo with detected project details
        """
        return self.detector.detect(project_path)

    def _build_project(self, project_path: str, project_info: ProjectInfo) -> BuildArtifacts:
        """
        Build project using BuildManager (Agent 1).

        Args:
            project_path: Path to project directory
            project_info: Detected project information

        Returns:
            BuildArtifacts with build results
        """
        return self.builder.build(
            project_path=project_path,
            build_command=project_info.build_command,
            output_dir=project_info.output_dir
        )

    def _upload_to_ipfs(self, build_artifacts: BuildArtifacts) -> dict:
        """
        Upload build artifacts to IPFS using IPFSUploader (Agent 2).

        Args:
            build_artifacts: Build output to upload

        Returns:
            Dictionary with IPFS upload result:
            {
                'success': bool,
                'cid': str,
                'gatewayUrl': str,
                'thirdwebUrl': str,
                'totalSize': int,
                'fileCount': int
            }
        """
        result = self.ipfs.upload(build_artifacts.output_dir)

        # Convert IPFSUploadResult to dictionary
        return {
            'success': result.success,
            'cid': result.cid,
            'gatewayUrl': result.gateway_url,
            'thirdwebUrl': result.thirdweb_url,
            'totalSize': result.total_size,
            'fileCount': result.file_count,
        }

    def _create_manifest(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        ipfs_result: Optional[dict],
        network: str,
        hosting: str = "ipfs",
        tier: str = "free",
        akash_result=None,
    ) -> dict:
        """
        Create deployment manifest.

        Args:
            project_info: Detected project information
            build_artifacts: Build output
            ipfs_result: IPFS upload result (None if using Akash)
            network: Target network
            hosting: Hosting type ("ipfs" or "akash")
            akash_result: Akash deployment result (None if using IPFS)

        Returns:
            Deployment manifest dictionary
        """
        # Use timestamp with microseconds to ensure uniqueness
        now = datetime.now()
        timestamp_microseconds = int(now.timestamp() * 1_000_000)
        deployment_id = f"deploy-{timestamp_microseconds}"

        manifest = {
            "version": "1.0",
            "deployment_id": deployment_id,
            "timestamp": datetime.now().isoformat(),
            "network": network,
            "hosting": hosting,
            "tier": tier,
            "project": {
                "type": project_info.project_type,
                "framework_version": project_info.framework_version,
                "build_command": project_info.build_command,
                "package_manager": project_info.package_manager,
            },
            "build": {
                "success": build_artifacts.success,
                "files": len(build_artifacts.files),
                "size_mb": build_artifacts.total_size_mb,
                "time_seconds": build_artifacts.build_time_seconds,
                "output_dir": build_artifacts.output_dir,
            },
        }

        # Add hosting-specific metadata
        if hosting == "akash" and akash_result:
            manifest["akash"] = {
                "deployment_id": akash_result.deployment_id,
                "lease_id": akash_result.lease_id,
                "provider": akash_result.provider,
                "url": akash_result.url,
                "status": akash_result.status.value if akash_result.status else "unknown",
                "price_per_block": akash_result.price_per_block,
                "estimated_monthly_cost": akash_result.estimated_monthly_cost,
            }
        elif ipfs_result:
            manifest["ipfs"] = {
                "cid": ipfs_result["cid"],
                "gateway_url": ipfs_result["gatewayUrl"],
                "thirdweb_url": ipfs_result["thirdwebUrl"],
                "total_size": ipfs_result.get("totalSize", 0),
                "file_count": ipfs_result.get("fileCount", 0),
            }

        return manifest

    def _save_deployment(self, manifest: dict) -> str:
        """
        Save deployment metadata locally.

        Args:
            manifest: Deployment manifest dictionary

        Returns:
            Deployment ID
        """
        # Create deployments directory
        deployments_dir = Path.home() / ".varietykit" / "deployments"
        deployments_dir.mkdir(parents=True, exist_ok=True)

        deployment_id = manifest["deployment_id"]
        filepath = deployments_dir / f"{deployment_id}.json"

        # Save manifest to file
        with open(filepath, "w") as f:
            json.dump(manifest, f, indent=2)

        self._log(f"   Saved deployment metadata to: {filepath}")

        return deployment_id

    def get_deployment(self, deployment_id: str) -> Optional[dict]:
        """
        Retrieve deployment manifest by ID.

        Args:
            deployment_id: Deployment ID to retrieve

        Returns:
            Deployment manifest dictionary or None if not found
        """
        deployments_dir = Path.home() / ".varietykit" / "deployments"
        filepath = deployments_dir / f"{deployment_id}.json"

        if not filepath.exists():
            return None

        with open(filepath, "r") as f:
            return json.load(f)

    def list_deployments(self, network: Optional[str] = None) -> list:
        """
        List all deployments.

        Args:
            network: Filter by network (optional)

        Returns:
            List of deployment manifest dictionaries
        """
        deployments_dir = Path.home() / ".varietykit" / "deployments"

        if not deployments_dir.exists():
            return []

        deployments = []
        for filepath in deployments_dir.glob("deploy-*.json"):
            with open(filepath, "r") as f:
                manifest = json.load(f)

                # Filter by network if specified
                if network is None or manifest.get("network") == network:
                    deployments.append(manifest)

        # Sort by timestamp (newest first)
        deployments.sort(key=lambda x: x["timestamp"], reverse=True)

        return deployments

    def _submit_to_app_store(
        self, project_info: ProjectInfo, deployment_result: dict, project_path: str, network: str
    ):
        """
        Submit app to Varity App Store (Phase 2 - Agent 6).

        Args:
            project_info: Detected project information
            deployment_result: Deployment result with frontend_url
            project_path: Path to project directory
            network: Target network

        Returns:
            SubmissionResult or None if submission fails
        """
        try:
            from .app_store.metadata_builder import MetadataBuilder

            # Determine chain ID from network
            chain_id_map = {
                "varity": 33529,
                "arbitrum": 42161,
                "arbitrum-sepolia": 421614,
                "base": 8453,
                "base-sepolia": 84532,
            }
            chain_id = chain_id_map.get(network, 33529)

            # Build package.json path
            import os

            package_json_path = os.path.join(project_path, "package.json")

            if not os.path.exists(package_json_path):
                self._log(f"   ⚠️  package.json not found at {package_json_path}")
                return None

            # Build metadata from deployment
            builder = MetadataBuilder()
            metadata = builder.build_from_deployment(
                project_info=project_info,
                deployment_result=deployment_result,
                package_json_path=package_json_path,
                chain_id=chain_id,
            )

            # Submit to App Store contract
            result = self.app_store.submit_app(metadata)

            return result

        except Exception as e:
            self._log(f"   ⚠️  App Store submission error: {e}")
            return None

    def _log(self, message: str):
        """Log message if verbose mode is enabled."""
        if self.verbose:
            print(message)

    def _deploy_to_akash(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        deploy_backend: bool = False,
    ):
        """
        Deploy to Akash Network using Console API.

        Args:
            project_info: Detected project information
            build_artifacts: Built artifacts
            deploy_backend: Whether to deploy backend

        Returns:
            AkashDeploymentResult

        Raises:
            DeploymentError: If Akash deployment fails
        """
        from .akash.types import AkashError
        from .akash.manifest_generator import ManifestGenerator

        try:
            # Generate SDL manifest
            manifest_gen = ManifestGenerator()
            manifest = manifest_gen.generate_frontend_manifest(
                project_info,
                build_artifacts,
                cpu_units=0.5,
                memory_size="512Mi",
                storage_size="1Gi",
            )

            # Deploy using Console API (simple!)
            result = self.akash.deploy_from_manifest(manifest)

            # TODO: Backend deployment support
            if deploy_backend and project_info.has_backend:
                self._log("   ⚠️  Backend deployment not yet implemented")
                self._log("   Deploy backend manually or wait for future update")

            return result

        except AkashError as e:
            raise DeploymentError(f"Akash deployment failed: {e}")
