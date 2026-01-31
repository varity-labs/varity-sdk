"""
Core modules for VarityKit
"""

# Phase 2: App Store integration (Agent 6)
from varietykit.core.app_store import (
    AppMetadata,
    AppStatus,
    AppStoreClient,
    AppStoreError,
    ContractInteractionError,
    MetadataBuilder,
    MetadataValidationError,
    SubmissionResult,
)
from varietykit.core.build_manager import BuildManager
from varietykit.core.config import ConfigManager, VarityConfig
from varietykit.core.deployment_orchestrator import DeploymentOrchestrator
from varietykit.core.project_detector import ProjectDetector
from varietykit.core.templates import TemplateManager
from varietykit.core.types import (
    BuildArtifacts,
    BuildError,
    DeploymentError,
    DeploymentOptions,
    DeploymentResult,
    IPFSUploadError,
    ProjectDetectionError,
    ProjectInfo,
)

__all__ = [
    "VarityConfig",
    "ConfigManager",
    "TemplateManager",
    "ProjectDetector",
    "BuildManager",
    "DeploymentOrchestrator",
    "ProjectInfo",
    "BuildArtifacts",
    "DeploymentResult",
    "DeploymentOptions",
    "DeploymentError",
    "ProjectDetectionError",
    "BuildError",
    "IPFSUploadError",
    # App Store integration
    "AppStoreClient",
    "MetadataBuilder",
    "AppMetadata",
    "SubmissionResult",
    "AppStatus",
    "AppStoreError",
    "ContractInteractionError",
    "MetadataValidationError",
]
