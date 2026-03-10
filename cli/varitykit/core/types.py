"""
Data structures for the deployment system.

This module defines the core data types used throughout the deployment
orchestration system.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ProjectInfo:
    """
    Information about a detected project.

    Attributes:
        name: Project name slug (from package.json, used for subdomain)
        display_name: Human-readable name for deployment card (auto title-cased or varity.displayName)
        description: Short description (from package.json, used as card tagline)
        project_type: Type of project ('nextjs', 'react', 'vue', 'nodejs', 'python')
        framework_version: Version of the framework (e.g., '14.0.0')
        build_command: Command to build the project (e.g., 'npm run build')
        output_dir: Directory where build artifacts are created (e.g., './out', './build')
        package_manager: Package manager used ('npm', 'yarn', 'pnpm')
        has_backend: Whether the project includes a backend (server/ directory)
    """

    name: str
    project_type: str
    framework_version: Optional[str]
    build_command: str
    output_dir: str
    package_manager: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    has_backend: bool = False


@dataclass
class BuildArtifacts:
    """
    Output from the build process.

    Attributes:
        success: Whether the build was successful
        output_dir: Directory containing build artifacts
        files: List of file paths relative to output_dir
        entrypoint: Main entrypoint file (e.g., 'index.html' for SPA)
        total_size_mb: Total size of build artifacts in megabytes
        build_time_seconds: Time taken to build in seconds
    """

    success: bool
    output_dir: str
    files: List[str]
    entrypoint: str
    total_size_mb: float
    build_time_seconds: float


@dataclass
class DeploymentOptions:
    """
    Options for deployment configuration.

    Attributes:
        submit_to_store: Whether to submit to App Store after deployment
        deploy_backend: Whether to deploy backend (if exists)
        deployment_method: Deployment method ('ipfs' or 'akash')
    """

    submit_to_store: bool = False
    deploy_backend: bool = True
    deployment_method: str = "ipfs"


@dataclass
class DeploymentResult:
    """
    Complete deployment result.

    Attributes:
        deployment_id: Unique identifier for this deployment
        frontend_url: URL where app is accessible (IPFS gateway or varity.app/{name})
        thirdweb_url: thirdweb CDN URL (faster alternative, IPFS only)
        cid: IPFS Content Identifier (CID) or akash:{dseq} for Akash
        app_store_url: App Store submission URL (Phase 2, optional)
        manifest: Full deployment manifest dictionary
        custom_domain: Custom domain URL (e.g., https://varity.app/my-app)
        hosting_type: "static" or "akash"
        provider_url: Raw Akash provider URL (Akash only)
        estimated_monthly_cost: Estimated monthly cost in USD (Akash only)
        free_credits_remaining: Remaining free credits in USD (Akash only)
        docker_image: Docker image used for deployment (Akash only)
    """

    deployment_id: str
    frontend_url: str
    thirdweb_url: str
    cid: str
    app_store_url: Optional[str]
    manifest: dict
    custom_domain: Optional[str] = None
    hosting_type: str = "static"
    provider_url: Optional[str] = None
    estimated_monthly_cost: float = 0.0
    free_credits_remaining: float = 0.0
    docker_image: Optional[str] = None

    def __str__(self):
        """Pretty string representation"""
        if self.hosting_type == "akash":
            return f"""Deployment {self.deployment_id}
  URL: {self.frontend_url}
  Provider: {self.provider_url}
  Monthly Cost: ~${self.estimated_monthly_cost:.0f}
  Deployment ID: {self.deployment_id}"""
        return f"""Deployment {self.deployment_id}
  Frontend: {self.frontend_url}
  CID: {self.cid}
  Deployment ID: {self.deployment_id}"""


# Error classes
class DeploymentError(Exception):
    """Base class for deployment errors"""

    pass


class ProjectDetectionError(DeploymentError):
    """Raised when project type cannot be detected"""

    pass


class BuildError(DeploymentError):
    """Raised when build fails"""

    pass


class IPFSUploadError(DeploymentError):
    """Raised when IPFS upload fails"""

    pass
