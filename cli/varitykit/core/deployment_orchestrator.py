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
import re
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from .types import (
    BuildArtifacts,
    BuildError,
    DeploymentError,
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
        submit_to_store: bool = False,
        tier: str = "free",
        custom_name: Optional[str] = None,
        skip_build: bool = False,
        repo_url: Optional[str] = None,
    ) -> DeploymentResult:
        """
        Deploy application to decentralized infrastructure.

        Args:
            project_path: Path to project directory (default: current directory)
            network: Target network (default: "varity")
            hosting: Hosting type - "ipfs" for static sites, "akash" for dynamic apps
            submit_to_store: Auto-submit to App Store

        Returns:
            DeploymentResult with URLs, CID, and manifest

        Raises:
            ProjectDetectionError: If project type cannot be detected
            BuildError: If build fails
            IPFSUploadError: If IPFS upload fails
            DeploymentError: For other deployment failures
        """
        from varitykit.services.gateway_client import (
            register_domain, sanitize_subdomain,
            check_availability, get_deploy_key, GatewayError,
        )
        import varitykit as _vk
        _run_id = str(uuid.uuid4())
        _t_start = time.monotonic()
        _telem: Dict = {
            "run_id": _run_id,
            "ts": datetime.now().isoformat(),
            "hosting_requested": hosting,
            "cli_version": getattr(_vk, "__version__", "unknown"),
        }

        try:
            self._log("🚀 Starting deployment...")

            # Step 1: Detect project
            self._log("📦 Detecting project type...")
            project_info = self._detect_project(project_path)
            self._log(f"   Detected: {project_info.project_type}")
            _telem["project_type"] = project_info.project_type

            # Capture size signals and anonymized user_id for all deploy paths
            _size_bytes, _file_count = self._compute_project_size(project_path)
            _telem.update({"repo_size_bytes": _size_bytes, "file_count": _file_count})
            try:
                import hashlib as _hl
                _dk = get_deploy_key()
                _telem["user_id"] = _hl.sha256(_dk.encode()).hexdigest()[:16] if _dk else None
            except Exception:
                pass

            # Step 2: Build project
            # For Akash hosting, Docker handles the build inside the container,
            # so we skip the local npm/build step and create a placeholder.
            #
            # Static subpath routing is handled after build by the path rewriter
            # and gateway. Do not inject NEXT_PUBLIC_BASE_PATH here: apps that
            # honor it at build time produce /app/_next/... URLs, which the
            # gateway then prefixes again to /app/app/_next/... .
            _extra_build_env: dict = {}

            if hosting == "akash":
                self._log("📦 Preparing for compute deployment...")
                build_artifacts = BuildArtifacts(
                    success=True,
                    output_dir=project_path,
                    files=[],
                    entrypoint="",
                    total_size_mb=0.0,
                    build_time_seconds=0.0,
                )
            elif skip_build:
                self._log("⚡ Using existing build output...")
                build_artifacts = self.builder._collect_artifacts(
                    Path(project_path), project_info.output_dir, 0.0,
                )
            else:
                self._log(f"🔨 Building project ({project_info.build_command})...")
                build_artifacts = self._build_project(project_path, project_info, extra_env=_extra_build_env if _extra_build_env else None)

                if not build_artifacts.success:
                    raise BuildError("Build failed")

                self._log(
                    f"   Built {len(build_artifacts.files)} files ({build_artifacts.total_size_mb:.2f} MB)"
                )

            # Step 2.5: Rewrite paths for static hosting (IPFS compatibility)
            if hosting != "akash":
                from .path_rewriter import rewrite_paths_for_static_hosting
                self._log("   Optimizing for static hosting...")
                modified = rewrite_paths_for_static_hosting(build_artifacts.output_dir)
                self._log(f"   Rewrote {modified} files for portable paths")

            # Step 2.7: Check domain availability BEFORE uploading (fail fast)
            subdomain = None
            owner_id = None
            if hosting != "akash":
                try:
                    subdomain = sanitize_subdomain(custom_name or project_info.name)
                    owner_id = get_deploy_key()

                    availability = check_availability(subdomain, owner_id=owner_id)
                    if not availability.get("available") and not availability.get("ownedByYou"):
                        reason = availability.get("reason", "taken")
                        if reason == "reserved":
                            raise GatewayError(
                                f'"{subdomain}" is reserved. Use --name to pick a different name.'
                            )
                        raise GatewayError(
                            f'"{subdomain}" is taken by another developer. '
                            f"Use --name to pick a different name."
                        )
                    self._log(f"   Domain varity.app/{subdomain} ✓")
                except GatewayError as e:
                    self._log(f"   ⚠️ Domain check skipped: {e}")
                    # Continue — domain registration will be attempted after upload
                except Exception:
                    pass  # Gateway unreachable — proceed, registration will fail later if needed

            # Ensure relative URLs resolve under varity.app/<subdomain>/ even if
            # the incoming request omits trailing slash.
            if hosting != "akash" and subdomain:
                try:
                    from .path_rewriter import inject_base_tag
                    tagged = inject_base_tag(build_artifacts.output_dir, f"/{subdomain}/")
                    self._log(f"   Injected <base> tag in {tagged} files")
                except Exception:
                    pass

            # Step 3: Deploy based on hosting type
            frontend_url = ""
            thirdweb_url = ""
            cid = ""
            akash_deploy_result = None
            ipfs_result = None

            if hosting == "akash":
                # Deploy to Akash Network via Console API (git clone at runtime)
                self._log("☁️  Deploying to compute platform...")

                # Resolve GitHub repo URL — use provided repo_url first, fall back to .git/config
                github_url = repo_url if repo_url else self._resolve_github_url(project_path)

                # Capture Akash-specific telemetry signals (idempotent file reads)
                _telem_svc = self._detect_services(project_path)
                _telem_env = self._load_env_vars(project_path)
                from varitykit.services.akash_deploy_service import detect_app_port as _dap
                _telem_port = _dap(project_path, project_info.project_type)
                _node_types = {"nextjs", "react", "vue", "nodejs"}
                _telem.update({
                    "repo_url": github_url,
                    "sidecars_added": _telem_svc,
                    "env_var_count": len(_telem_env),
                    "port": _telem_port,
                    "image": "node:20-bookworm-slim" if project_info.project_type in _node_types else "python:3.11-slim",
                    "memory_mb": 8192 if project_info.project_type in _node_types else 4096,
                    "dependency_signals": {
                        "has_pg": "postgres" in _telem_svc,
                        "has_redis": "redis" in _telem_svc,
                        "has_mongodb": "mongodb" in _telem_svc,
                        "has_ollama": "ollama" in _telem_svc,
                        "has_mysql": "mysql" in _telem_svc,
                        "has_prisma": self._has_prisma(project_path),
                    },
                })

                _akash_t0 = time.monotonic()
                akash_deploy_result = self._deploy_to_akash_service(
                    project_path, project_info, custom_name,
                    github_repo_url=github_url,
                )
                _telem["container_first_response_seconds"] = round(time.monotonic() - _akash_t0, 1)

                if not akash_deploy_result.success:
                    # If Akash accepted the SDL (dseq assigned) but warmup timed
                    # out, save a ghost record so the deployment is discoverable
                    # and cancellable even though the health check failed.
                    if akash_deploy_result.dseq:
                        self._save_ghost_deployment(
                            akash_deploy_result, project_info, project_path, network
                        )
                    raise DeploymentError(
                        akash_deploy_result.error_message or "Compute deployment failed"
                    )

                frontend_url = akash_deploy_result.url
                cid = f"akash:{akash_deploy_result.dseq}"
                self._log(f"   App running at: {frontend_url}")
                self._log(f"   Monthly cost: ~${akash_deploy_result.estimated_monthly_cost:.0f}")
            else:
                # Default: Upload to IPFS
                self._log("☁️  Deploying your app...")
                ipfs_result = self._upload_to_ipfs(build_artifacts)

                if not ipfs_result.success:
                    raise IPFSUploadError("IPFS upload failed")

                cid = ipfs_result.cid
                frontend_url = ipfs_result.gateway_url
                thirdweb_url = ipfs_result.thirdweb_url
                self._log(f"   URL: {frontend_url}")

                # Capture service/env signals for IPFS deploys
                _ipfs_svc = self._detect_services(project_path)
                _ipfs_env = self._load_env_vars(project_path)
                _telem.update({
                    "sidecars_added": [],
                    "env_var_count": len(_ipfs_env),
                    "port": None,
                    "image": None,
                    "memory_mb": 0,
                    "dependency_signals": {
                        "has_pg": "postgres" in _ipfs_svc,
                        "has_redis": "redis" in _ipfs_svc,
                        "has_mongodb": "mongodb" in _ipfs_svc,
                        "has_ollama": "ollama" in _ipfs_svc,
                        "has_mysql": "mysql" in _ipfs_svc,
                        "has_prisma": self._has_prisma(project_path),
                    },
                })

            # Step 3.5: Register custom domain
            custom_domain_url = None

            # For Akash deployments, register with deployment URL
            if hosting == "akash" and akash_deploy_result and akash_deploy_result.success:
                try:
                    from varitykit.services.gateway_client import (
                        register_akash_domain, sanitize_subdomain,
                        get_deploy_key,
                    )
                    # Prefer directory name over package.json `name` when no --name flag was given.
                    # package.json names are npm artifact names (e.g. "dx-express-v2") that don't
                    # reflect the developer's intended URL slug — the directory does.
                    subdomain = sanitize_subdomain(custom_name or Path(project_path).name)
                    owner_id = get_deploy_key()

                    self._log("   Registering custom URL...")
                    register_akash_domain(
                        subdomain=subdomain,
                        deployment_url=akash_deploy_result.url,
                        deployment_id=akash_deploy_result.dseq,
                        app_name=project_info.display_name or project_info.name,
                        tagline=project_info.description,
                        owner_id=owner_id,
                    )
                    custom_domain_url = f"https://varity.app/{subdomain}/"
                    frontend_url = custom_domain_url
                    self._log(f"   🌐 {custom_domain_url}")

                    if not owner_id:
                        self._log("   💡 Tip: Run 'varitykit login' to protect your domains.")
                except Exception as e:
                    self._log(f"   ⚠️ Custom domain unavailable: {e}")
                    # Don't fail the deploy — provider URL still works

            # For IPFS deployments, register with CID
            elif cid and subdomain and hosting != "akash":
                try:
                    register_domain(
                        subdomain, cid,
                        app_name=project_info.display_name or project_info.name,
                        tagline=project_info.description,
                        owner_id=owner_id,
                    )
                    custom_domain_url = f"https://varity.app/{subdomain}/"
                    frontend_url = custom_domain_url
                    self._log(f"   🌐 {custom_domain_url}")

                    if not owner_id:
                        self._log("   💡 Tip: Run 'varitykit login' to protect your domains.")
                except GatewayError as e:
                    self._log(f"   ⚠️ Custom domain unavailable: {e}")
                    self._log(f"   App is still accessible via IPFS URL above.")
                except Exception as e:
                    self._log(f"   ⚠️ Custom domain unavailable: {e}")
                    self._log(f"   App is still accessible via IPFS URL above.")

            # Step 4: Create deployment manifest
            manifest = self._create_manifest(
                project_info, build_artifacts, ipfs_result, network, hosting,
                akash_result=akash_deploy_result,
                project_path=project_path,
            )

            # Store custom domain info in manifest
            if custom_domain_url and subdomain:
                manifest["custom_domain"] = {
                    "subdomain": subdomain,
                    "url": custom_domain_url,
                    "owner_id": owner_id,
                }

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
                        tier=tier,
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
                custom_domain=custom_domain_url,
                hosting_type="akash" if hosting == "akash" else "static",
                provider_url=akash_deploy_result.url if akash_deploy_result else None,
                estimated_monthly_cost=akash_deploy_result.estimated_monthly_cost if akash_deploy_result else 0.0,
                free_credits_remaining=0.0,
                docker_image=None,  # No Docker — apps deploy via git clone on Akash
            )

            self._log("✅ Deployment complete!")
            self._log(f"\n   🌐 Your app: {result.frontend_url}")
            self._log(f"   📋 Deployment ID: {result.deployment_id}\n")

            _telem.update({
                "success": True,
                "duration_seconds": round(time.monotonic() - _t_start, 1),
                "deploy_id": result.deployment_id,
                "frontend_url": result.frontend_url,
            })
            self._emit_telemetry(_telem)
            self._write_wm_entities(_telem)
            self._run_learned_recommender(_telem)
            return result

        except ProjectDetectionError as e:
            self._log(f"❌ Could not detect project type: {e}")
            self._log("   Supported: Next.js, React, Vue")
            self._log("   Ensure package.json exists")
            _telem.update({"success": False, "error_class": "detection_error", "duration_seconds": round(time.monotonic() - _t_start, 1)})
            self._emit_telemetry(_telem)
            self._write_wm_entities(_telem)
            raise

        except BuildError as e:
            self._log(f"❌ Build failed: {e}")
            self._log("   Try running build manually first")
            _telem.update({"success": False, "error_class": "build_error", "duration_seconds": round(time.monotonic() - _t_start, 1)})
            self._emit_telemetry(_telem)
            self._write_wm_entities(_telem)
            raise

        except IPFSUploadError as e:
            self._log(f"❌ Deployment failed: {e}")
            self._log("   Please try again or contact support: https://discord.gg/7vWsdwa2Bg")
            _telem.update({"success": False, "error_class": "upload_error", "duration_seconds": round(time.monotonic() - _t_start, 1)})
            self._emit_telemetry(_telem)
            self._write_wm_entities(_telem)
            raise

        except Exception as e:
            self._log(f"❌ Deployment failed: {e}")
            _telem.update({"success": False, "error_class": "runtime_error", "duration_seconds": round(time.monotonic() - _t_start, 1)})
            self._emit_telemetry(_telem)
            self._write_wm_entities(_telem)
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

    def _build_project(self, project_path: str, project_info: ProjectInfo, extra_env: Optional[Dict[str, str]] = None) -> BuildArtifacts:
        """
        Build project using BuildManager (Agent 1).

        Args:
            project_path: Path to project directory
            project_info: Detected project information
            extra_env: Extra env vars to inject (e.g. NEXT_PUBLIC_BASE_PATH for sub-path deploys)

        Returns:
            BuildArtifacts with build results
        """
        return self.builder.build(
            project_path=project_path,
            build_command=project_info.build_command,
            output_dir=project_info.output_dir,
            extra_env=extra_env,
        )

    def _upload_to_ipfs(self, build_artifacts: BuildArtifacts):
        """
        Upload build artifacts to IPFS using IPFSUploader (Agent 2).

        Args:
            build_artifacts: Build output to upload

        Returns:
            IPFSUploadResult with CID, URLs, and metadata
        """
        return self.ipfs.upload(build_artifacts.output_dir)

    def _create_manifest(
        self,
        project_info: ProjectInfo,
        build_artifacts: BuildArtifacts,
        ipfs_result=None,
        network: str = "varity",
        hosting: str = "ipfs",
        akash_result=None,
        project_path: Optional[str] = None,
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
            project_path: Absolute path to the project directory

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
            # app_name / project_name are the slug used by varity_deploy_status to construct
            # the clean varity.app/<app_name>/ URL instead of falling back to deployment-ID URLs.
            "app_name": project_info.name,
            "project_name": project_info.display_name or project_info.name,
            "cwd": str(project_path) if project_path else None,
            "project": {
                "name": project_info.name,
                "display_name": project_info.display_name or project_info.name,
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
                "dseq": akash_result.dseq,
                "url": akash_result.url,
                "provider": akash_result.provider,
                "estimated_monthly_cost": akash_result.estimated_monthly_cost,
            }
        elif ipfs_result:
            manifest["ipfs"] = {
                "cid": ipfs_result.cid,
                "gateway_url": ipfs_result.gateway_url,
                "thirdweb_url": ipfs_result.thirdweb_url,
                "total_size": ipfs_result.total_size,
                "file_count": ipfs_result.file_count,
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
        deployments_dir = Path.home() / ".varitykit" / "deployments"
        deployments_dir.mkdir(parents=True, exist_ok=True)

        deployment_id = manifest["deployment_id"]
        filepath = deployments_dir / f"{deployment_id}.json"

        # Save manifest to file
        with open(filepath, "w") as f:
            json.dump(manifest, f, indent=2)

        self._log(f"   Saved deployment metadata to: {filepath}")

        return deployment_id

    def _save_ghost_deployment(self, akash_result, project_info: "ProjectInfo", project_path: str, network: str) -> str:
        """Save a minimal record for a deployment whose container warmup timed out.

        The Akash network accepted the SDL (dseq assigned) but the container
        never passed the health check. Without this record the user cannot
        discover or cancel the running ghost deploy, and credits keep draining.
        """
        deployments_dir = Path.home() / ".varitykit" / "deployments"
        deployments_dir.mkdir(parents=True, exist_ok=True)

        now = datetime.now()
        deployment_id = f"deploy-{int(now.timestamp() * 1_000_000)}"
        filepath = deployments_dir / f"{deployment_id}.json"

        manifest = {
            "version": "1.0",
            "deployment_id": deployment_id,
            "timestamp": now.isoformat(),
            "network": network,
            "hosting": "akash",
            "status": "warmup_timeout",
            "app_name": project_info.name,
            "project_name": project_info.display_name or project_info.name,
            "cwd": str(project_path),
            "akash": {
                "dseq": akash_result.dseq,
                "url": akash_result.url,
                "provider": akash_result.provider,
            },
        }

        with open(filepath, "w") as f:
            json.dump(manifest, f, indent=2)

        self._log(f"   Ghost deployment record saved: {deployment_id}")
        self._log(f"   dseq: {akash_result.dseq} — check status with: varitykit app status {akash_result.dseq}")
        return deployment_id

    def get_deployment(self, deployment_id: str) -> Optional[dict]:
        """
        Retrieve deployment manifest by ID.

        Args:
            deployment_id: Deployment ID to retrieve

        Returns:
            Deployment manifest dictionary or None if not found
        """
        deployments_dir = Path.home() / ".varitykit" / "deployments"
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
        deployments_dir = Path.home() / ".varitykit" / "deployments"

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
        self, project_info: ProjectInfo, deployment_result: dict, project_path: str, network: str, tier: str = "free"
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
                tier=tier,
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

    @staticmethod
    def _resolve_github_url(project_path: str) -> str:
        """
        Resolve GitHub repo URL from the project directory.

        Checks (in order):
        1. varity.config.json → github_repo field
        2. .git/config → remote origin URL
        3. Raises error if neither found
        """
        from pathlib import Path
        import json
        import subprocess

        path = Path(project_path)

        # 1. Check varity.config.json
        config_path = path / "varity.config.json"
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text())
                repo = config.get("github_repo") or config.get("repo") or config.get("repository")
                if repo:
                    return repo
            except (json.JSONDecodeError, IOError):
                pass

        # 2. Check git remote
        try:
            result = subprocess.run(
                ["git", "remote", "get-url", "origin"],
                cwd=project_path,
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0 and result.stdout.strip():
                url = result.stdout.strip()
                # Convert SSH to HTTPS if needed
                if url.startswith("git@github.com:"):
                    url = url.replace("git@github.com:", "https://github.com/")
                if url.endswith(".git"):
                    url = url[:-4]
                return url + ".git"
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass

        raise DeploymentError(
            "No GitHub repository found. Dynamic hosting requires a public GitHub repo.\n"
            "Push your code to GitHub first, or add 'github_repo' to varity.config.json."
        )

    # ------------------------------------------------------------------
    # Service detection — which backend services does this app need?
    # Today: postgres, redis, ollama, mongodb. Future: vector DBs, kafka,
    # crypto-project modules (IPFS node, Graph node, Ceramic, etc.).
    # The orchestrator is intentionally small — adding a service means
    # extending the signal maps + the SDL template, not rewiring control flow.
    # ------------------------------------------------------------------

    _JS_DEPENDENCY_SIGNALS = {
        "postgres": {
            "pg", "postgres", "@neondatabase/serverless", "pg-promise",
            "sequelize", "typeorm", "drizzle-orm",
            "kysely", "knex", "@supabase/supabase-js", "mikro-orm",
            "slonik", "pgvector",
        },
        "mysql": {"mysql2", "mysql", "@planetscale/database"},
        "mongodb": {"mongoose", "mongodb", "mongosh"},
        "redis": {
            "ioredis", "redis", "bullmq", "bull", "connect-redis",
            "@upstash/redis",
        },
        "ollama": {
            "@langchain/ollama", "ollama", "ollama-ai-provider",
        },
    }

    _PY_DEPENDENCY_SIGNALS = {
        "postgres": {
            "psycopg", "psycopg2", "psycopg2-binary", "asyncpg",
            "sqlalchemy", "databases", "tortoise-orm", "peewee",
            "django", "pgvector",
        },
        "mysql": {
            "mysqlclient", "mysql-connector-python", "aiomysql",
            "asyncmy", "PyMySQL",
        },
        "mongodb": {"pymongo", "motor", "beanie", "mongoengine", "odmantic"},
        "redis": {"redis", "aioredis", "hiredis", "rq", "celery", "dramatiq", "huey"},
        "ollama": {"ollama", "langchain-ollama"},
    }

    _SERVICE_ORDER = ("postgres", "mysql", "redis", "ollama", "mongodb", "needs_human_input")

    @classmethod
    def _detect_services(cls, project_path: str) -> List[str]:
        """Detect backend services this app needs.

        Returns service names in canonical order: postgres, redis, ollama,
        mongodb. The caller passes this list to akash_deploy_service.deploy()
        which renders the matching sidecars into the SDL.

        Signals checked (all additive — any match triggers the service):
          1. package.json dependencies (JS projects)
          2. Prisma schema datasource provider (determines postgres vs mongodb)
          3. requirements.txt / pyproject.toml (Python projects)
          4. varity.config.json database.collections (legacy Varity DB signal)
        """
        path = Path(project_path)
        detected: set[str] = set()

        # 1. JS dependencies
        pkg_path = path / "package.json"
        if pkg_path.exists():
            try:
                pkg = json.loads(pkg_path.read_text())
                js_deps = set(pkg.get("dependencies", {}).keys()) | set(
                    pkg.get("devDependencies", {}).keys()
                )
                for service, signals in cls._JS_DEPENDENCY_SIGNALS.items():
                    if signals & js_deps:
                        detected.add(service)

                # 2. Prisma is provider-agnostic — inspect schema to choose
                # postgres vs mongodb/mysql. Without schema evidence we must
                # avoid guessing a DB sidecar.
                if "@prisma/client" in js_deps or "prisma" in js_deps:
                    provider = cls._prisma_provider(path)
                    if provider in ("postgresql", "postgres"):
                        detected.add("postgres")
                    elif provider == "mongodb":
                        detected.add("mongodb")
                    elif provider in ("mysql", "mariadb"):
                        detected.add("mysql")
            except (json.JSONDecodeError, IOError):
                pass

        # 3. Python dependencies
        for dep_file in ("requirements.txt", "pyproject.toml"):
            dep_path = path / dep_file
            if dep_path.exists():
                try:
                    text = dep_path.read_text()
                    for service, signals in cls._PY_DEPENDENCY_SIGNALS.items():
                        for sig in signals:
                            # Match at line start or after a quote/whitespace,
                            # followed by extras ([srv]), version spec, quote,
                            # whitespace, or EOL.  Prevents substring false
                            # positives (e.g. "mongodb-stubs" not matching
                            # "mongodb") while allowing extras like pymongo[srv].
                            pattern = (
                                rf'(?:^|["\'\s]){re.escape(sig)}'
                                rf'(?:\[[\w,]+\])?'
                                rf'(?:\s*[<>=!~]|["\'\s,]|$)'
                            )
                            if re.search(pattern, text, re.MULTILINE):
                                detected.add(service)
                                break
                except IOError:
                    pass

        # 4. Legacy Varity DB collections → postgres
        config_path = path / "varity.config.json"
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text())
                if config.get("database", {}).get("collections"):
                    detected.add("postgres")
            except (json.JSONDecodeError, IOError):
                pass

        # 5. Dockerfile-only fallback: mark confidence gap so callers can
        # branch to human input instead of silently guessing sidecars.
        if not detected and (path / "Dockerfile").exists():
            detected.add("needs_human_input")

        return [s for s in cls._SERVICE_ORDER if s in detected]

    @staticmethod
    def _prisma_provider(project_root: Path) -> Optional[str]:
        """Read prisma/schema.prisma and return the DATASOURCE provider
        (e.g. 'postgresql', 'mongodb', 'mysql').

        IMPORTANT: schema.prisma has TWO `provider = "..."` fields — one
        in the `generator` block (e.g. `prisma-client-js`) and one in the
        `datasource` block (the DB driver). We MUST pick the datasource
        one, not the first match in the file. Getting this wrong means
        Prisma apps never get the postgres sidecar auto-added.
        """
        schema = project_root / "prisma" / "schema.prisma"
        if not schema.exists():
            return None
        try:
            content = schema.read_text()
            # Match: datasource <name> { ... provider = "..." ... }
            # The datasource block is where the real DB provider lives.
            ds_match = re.search(
                r'datasource\s+\w+\s*\{[^}]*?provider\s*=\s*"([^"]+)"',
                content,
                re.DOTALL,
            )
            if ds_match:
                return ds_match.group(1).lower()
        except IOError:
            pass
        return None

    # ------------------------------------------------------------------
    # Env var loading — reads the user's local .env file and forwards
    # non-reserved / non-platform-leakage keys into the Akash SDL.
    # Filepath precedence: .env.varity → .env.local → .env
    # (first match wins; the rest are ignored to avoid merging surprises).
    # ------------------------------------------------------------------

    # Keys Varity generates/controls — if the user has them in .env we
    # silently skip, so we never let a stale local DATABASE_URL override
    # the one we wire to the postgres sidecar.
    _VARITY_RESERVED_ENV_KEYS = frozenset({
        "NODE_ENV", "PORT", "NODE_OPTIONS",
        "PYTHONUNBUFFERED",
        "DATABASE_URL", "REDIS_URL", "OLLAMA_URL", "MONGODB_URI",
        "MYSQL_URL",
        "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "PGDATA",
        "MONGO_INITDB_ROOT_USERNAME", "MONGO_INITDB_ROOT_PASSWORD",
        "MONGO_INITDB_DATABASE",
        "MYSQL_ROOT_PASSWORD", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD",
        "APP_NAME",
    })

    # Prefixes that indicate a platform-injected var from another host.
    # A Vercel user migrating to Varity shouldn't carry over VERCEL_URL,
    # VERCEL_ENV, etc. — they're meaningless on Akash and often misleading.
    _PLATFORM_LEAK_PREFIXES = (
        "VERCEL_",
        "NEXT_RUNTIME",
        "AWS_",
        "RAILWAY_",
        "RENDER_",
        "NETLIFY_",
        "FLY_",
    )

    _ENV_FILE_PRECEDENCE = (".env.varity", ".env.local", ".env")

    @classmethod
    def _load_env_vars(cls, project_path: str) -> Dict[str, str]:
        """Load user-defined env vars from the project's .env file.

        Precedence: .env.varity > .env.local > .env. First match wins.
        Reserved Varity keys and platform-leaked prefixes are filtered so
        they don't override Varity-managed wiring or pollute the deployment.

        Returns {} if no recognized env file exists.
        """
        path = Path(project_path)
        for filename in cls._ENV_FILE_PRECEDENCE:
            env_file = path / filename
            if env_file.exists():
                raw = cls._parse_env_file(env_file)
                return {
                    k: v for k, v in raw.items()
                    if cls._is_user_env_key(k)
                }
        return {}

    @staticmethod
    def _parse_env_file(env_file: Path) -> Dict[str, str]:
        """Parse a .env file.

        Supports:
          - KEY=value
          - KEY="value with spaces"
          - KEY='value with spaces'
          - Lines starting with # (comments)
          - Blank lines
          - `export KEY=value` (shell-style prefix is stripped)

        Does not support multiline values or shell expansion — those aren't
        portable across .env parsers anyway.
        """
        out: Dict[str, str] = {}
        try:
            text = env_file.read_text(encoding="utf-8")
        except IOError:
            return out

        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Allow `export KEY=value`
            if line.startswith("export "):
                line = line[len("export "):].lstrip()
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            # Strip matching surrounding quotes
            if len(value) >= 2 and (
                (value[0] == value[-1] == '"') or (value[0] == value[-1] == "'")
            ):
                value = value[1:-1]
            # Trim inline comments only on UNQUOTED values (after the strip
            # above, we've lost the quote context — so only strip ` #...` if
            # the original value wasn't quoted. To keep things simple, we
            # only strip inline comments when value has no spaces + a # later).
            if key:
                out[key] = value
        return out

    @classmethod
    def _is_user_env_key(cls, key: str) -> bool:
        """True if this key should be forwarded to the deployment."""
        if not key or not key[0].isalpha() and key[0] != "_":
            # Invalid env var name — skip silently
            return False
        if key in cls._VARITY_RESERVED_ENV_KEYS:
            return False
        if any(key.startswith(p) for p in cls._PLATFORM_LEAK_PREFIXES):
            return False
        return True

    @staticmethod
    def _has_prisma(project_path: str) -> bool:
        return (Path(project_path) / "prisma" / "schema.prisma").exists()

    _SKIP_SIZE_DIRS = frozenset({
        "node_modules", ".git", ".next", "__pycache__", ".mypy_cache",
        "dist", "build", ".venv", "venv", ".pytest_cache", ".turbo",
        ".cache", "coverage", ".nyc_output",
    })

    @classmethod
    def _compute_project_size(cls, project_path: str):
        """Walk the project tree (skipping build/cache dirs) and return (size_bytes, file_count)."""
        total_bytes = 0
        total_files = 0
        try:
            for root, dirs, files in os.walk(project_path):
                dirs[:] = [d for d in dirs if d not in cls._SKIP_SIZE_DIRS]
                for f in files:
                    try:
                        total_bytes += os.path.getsize(os.path.join(root, f))
                        total_files += 1
                    except OSError:
                        pass
        except Exception:
            pass
        return total_bytes, total_files

    @staticmethod
    def _write_wm_entities(telem: Dict) -> None:
        """Write OrchestrationRun + DeployOutcome to the World Model DB.

        Fire-and-forget daemon thread. Only runs when WORLD_MODEL_DB_HOST is set
        (Varity infra). Silently no-ops on developer machines without WM access.
        """
        import os as _os
        wm_host = _os.environ.get("WORLD_MODEL_DB_HOST") or _os.environ.get("GRAPHITI_DB_HOST")
        if not wm_host:
            return

        def _write() -> None:
            try:
                import psycopg2
                import json as _json
            except ImportError:
                return
            try:
                wm_port = int(
                    _os.environ.get("WORLD_MODEL_DB_PORT")
                    or _os.environ.get("GRAPHITI_DB_PORT", "30096")
                )
                wm_user = (
                    _os.environ.get("WORLD_MODEL_DB_USER")
                    or _os.environ.get("GRAPHITI_DB_USER", "varity_wm")
                )
                wm_name = (
                    _os.environ.get("WORLD_MODEL_DB_NAME")
                    or _os.environ.get("GRAPHITI_DB_NAME", "varity_world_model")
                )
                wm_pass = (
                    _os.environ.get("WORLD_MODEL_DB_PASSWORD")
                    or _os.environ.get("GRAPHITI_DB_PASSWORD", "")
                )
                run_id = telem.get("run_id", "unknown")
                outcome_id = f"outcome-{run_id}"
                _outcome_keys = {
                    "success", "duration_seconds", "error_class", "error_message",
                    "container_first_response_seconds",
                }
                orch_props = {k: v for k, v in telem.items() if k not in _outcome_keys}
                orch_props["asserted_by"] = "varitykit"
                outcome_props = {k: telem[k] for k in _outcome_keys if k in telem}
                outcome_props["run_id"] = run_id
                outcome_props["asserted_by"] = "varitykit"

                conn = psycopg2.connect(
                    host=wm_host, port=wm_port, user=wm_user,
                    dbname=wm_name, password=wm_pass, connect_timeout=5,
                )
                try:
                    with conn:
                        with conn.cursor() as cur:
                            for etype, eid, props in [
                                ("OrchestrationRun", run_id, orch_props),
                                ("DeployOutcome", outcome_id, outcome_props),
                            ]:
                                cur.execute(
                                    "UPDATE world_model_entities SET valid_to = NOW() "
                                    "WHERE type = %s AND entity_id = %s AND valid_to IS NULL",
                                    (etype, eid),
                                )
                                cur.execute(
                                    "INSERT INTO world_model_entities "
                                    "(type, entity_id, props, valid_from) "
                                    "VALUES (%s, %s, %s::jsonb, NOW())",
                                    (etype, eid, _json.dumps(props)),
                                )
                            cur.execute(
                                "INSERT INTO world_model_relationships "
                                "(from_type, from_id, relation, to_type, to_id, asserted_by, valid_from) "
                                "VALUES (%s, %s, %s, %s, %s, %s, NOW()) "
                                "ON CONFLICT (from_type, from_id, relation, to_type, to_id) "
                                "WHERE valid_to IS NULL DO NOTHING",
                                (
                                    "DeployOutcome", outcome_id, "PRODUCED_BY",
                                    "OrchestrationRun", run_id, "varitykit",
                                ),
                            )
                finally:
                    conn.close()
            except Exception:
                pass  # Never fail the deploy over WM write errors

        threading.Thread(target=_write, daemon=True).start()

    @staticmethod
    def _emit_telemetry(telem: Dict) -> None:
        """Fire-and-forget POST of deploy telemetry to the Gateway. Never raises."""
        import json as _json
        import urllib.request as _req

        def _post() -> None:
            try:
                _outcome_keys = {"success", "duration_seconds", "deploy_id", "frontend_url", "error_class", "error_message"}
                payload = {
                    "run_id": telem.get("run_id"),
                    "orchestration_run": {k: v for k, v in telem.items() if k not in _outcome_keys},
                    "deploy_outcome": {k: telem[k] for k in _outcome_keys if k in telem},
                }
                data = _json.dumps(payload).encode()
                request = _req.Request(
                    "https://varity.app/api/telemetry/deploy",
                    data=data,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                _req.urlopen(request, timeout=5)
            except Exception:
                pass  # Telemetry is best-effort — never fail the deploy

        threading.Thread(target=_post, daemon=True).start()

    @staticmethod
    def _run_learned_recommender(telem: Dict) -> None:
        """Run the learned recommender in a background thread (silent A/B).

        Produces a RecommenderProposal entity in the World Model for
        offline comparison against the rules-engine decision. Never
        affects the actual deployment path.
        """
        def _recommend() -> None:
            try:
                from .learned_recommender import LearnedRecommender
                rec = LearnedRecommender()
                result = rec.recommend(telem)
                rec.write_proposal(telem, result)
            except Exception:
                pass  # Never fail the deploy over recommender errors

        threading.Thread(target=_recommend, daemon=True).start()

    def _deploy_to_akash_service(
        self,
        project_path: str,
        project_info: ProjectInfo,
        custom_name: Optional[str] = None,
        github_repo_url: Optional[str] = None,
    ):
        """
        Deploy to Akash via Console API using git clone pattern.

        No Docker required. Generates SDL that clones the GitHub repo
        at runtime on the Akash provider.

        Args:
            project_path: Path to project directory
            project_info: Detected project information
            custom_name: Custom app name override
            github_repo_url: GitHub repo URL for the app code

        Returns:
            AkashDeploymentResult with deployment URL

        Raises:
            DeploymentError: If deployment fails
        """
        from varitykit.services.akash_deploy_service import (
            deploy,
            detect_app_port,
            detect_python_start_command,
        )

        try:
            app_name = custom_name or project_info.name
            port = detect_app_port(project_path, project_info.project_type)

            # Detect what services the app needs (postgres/redis/ollama/mongodb)
            services = self._detect_services(project_path)

            # GitHub URL is required for Akash deployment
            if not github_repo_url:
                raise DeploymentError(
                    "A GitHub repository is required for dynamic hosting. "
                    "Push your code to GitHub first."
                )

            # For Python projects, detect the right start command (Procfile,
            # Django manage.py, FastAPI/Flask conventions). None = caller uses
            # its uvicorn default.
            python_start = detect_python_start_command(project_path)

            # Load user env vars from .env.varity / .env.local / .env.
            # Reserved + platform-leakage keys (VERCEL_*, AWS_*, DATABASE_URL,
            # etc.) are filtered so they don't collide with Varity-managed
            # wiring or carry Vercel-isms into the Akash deployment.
            user_env = self._load_env_vars(project_path)

            result = deploy(
                github_repo_url=github_repo_url,
                app_name=app_name,
                project_type=project_info.project_type,
                services=services,
                port=port,
                python_start_command=python_start,
                env_vars=user_env,
                package_manager=project_info.package_manager or "npm",
            )

            if not result.success:
                raise DeploymentError(result.error_message or "Deployment failed")

            return result

        except DeploymentError:
            raise
        except Exception as e:
            raise DeploymentError(f"Deployment failed: {e}")

    # Legacy _deploy_to_akash() removed — all Akash deployments use
    # _deploy_to_akash_service() which calls the Console API directly.
