"""
Akash Network Deployment Module

This module provides integration with Akash Network for deploying applications
to decentralized compute infrastructure.

Components:
- AkashConsoleDeployer: Simple API-based deployment (RECOMMENDED)
- ManifestGenerator: Creates Akash SDL manifests for deployments
- AkashDeployer: Legacy CLI-based deployment (deprecated)
- Akash-specific type definitions

Uses Akash Console Managed Wallet API - no local CLI or wallet required.
"""

from .console_deployer import AkashConsoleDeployer
from .akash_deployer import AkashDeployer  # Legacy, deprecated
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

__all__ = [
    # Types
    "AkashDeploymentResult",
    "AkashProviderBid",
    "AkashDeploymentStatus",
    "AkashManifest",
    "AkashError",
    "AkashProviderError",
    "AkashTimeoutError",
    # Classes
    "AkashConsoleDeployer",  # Recommended
    "ManifestGenerator",
    "AkashDeployer",  # Legacy/deprecated
    "ProviderSelector",  # Legacy/deprecated
]
