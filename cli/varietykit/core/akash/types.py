"""
Akash Network Type Definitions

Data structures for Akash deployment operations.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class AkashDeploymentStatus(Enum):
    """Akash deployment status states"""

    PENDING = "pending"
    BIDDING = "bidding"
    ACTIVE = "active"
    CLOSED = "closed"
    FAILED = "failed"


@dataclass
class AkashProviderBid:
    """
    Represents a bid from an Akash provider.

    Attributes:
        provider: Provider address/URL
        price: Bid price in uakt per block
        location: Provider location (e.g., "us-east")
        uptime: Provider uptime percentage (0-100)
        reputation_score: Provider reputation (0-100)
        attributes: Provider-specific attributes
    """

    provider: str
    price: int  # uakt per block
    location: Optional[str] = None
    uptime: float = 0.0
    reputation_score: float = 0.0
    attributes: Dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        """Validate bid data"""
        if self.price < 0:
            raise ValueError("Bid price cannot be negative")
        if not 0 <= self.uptime <= 100:
            raise ValueError("Uptime must be between 0 and 100")
        if not 0 <= self.reputation_score <= 100:
            raise ValueError("Reputation score must be between 0 and 100")


@dataclass
class AkashDeploymentResult:
    """
    Result of an Akash deployment operation.

    Attributes:
        success: Whether deployment succeeded
        deployment_id: Akash deployment identifier (DSEQ)
        lease_id: Akash lease identifier
        provider: Selected provider address
        url: Deployed application URL
        service_urls: URLs for individual services
        status: Current deployment status
        price_per_block: Final price in uakt per block
        estimated_monthly_cost: Estimated monthly cost in AKT
        error_message: Error message if deployment failed
        metadata: Additional deployment metadata
    """

    success: bool
    deployment_id: Optional[str] = None
    lease_id: Optional[str] = None
    provider: Optional[str] = None
    url: Optional[str] = None
    service_urls: Dict[str, str] = field(default_factory=dict)
    status: AkashDeploymentStatus = AkashDeploymentStatus.PENDING
    price_per_block: int = 0
    estimated_monthly_cost: float = 0.0
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_active(self) -> bool:
        """Check if deployment is active"""
        return self.status == AkashDeploymentStatus.ACTIVE

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "success": self.success,
            "deployment_id": self.deployment_id,
            "lease_id": self.lease_id,
            "provider": self.provider,
            "url": self.url,
            "service_urls": self.service_urls,
            "status": self.status.value if self.status else None,
            "price_per_block": self.price_per_block,
            "estimated_monthly_cost": self.estimated_monthly_cost,
            "error_message": self.error_message,
            "metadata": self.metadata,
        }


@dataclass
class AkashManifest:
    """
    Represents an Akash SDL manifest.

    Attributes:
        version: SDL version (e.g., "2.0")
        services: Service definitions
        profiles: Resource profiles
        deployment: Deployment configuration
        yaml_content: Full YAML manifest content
    """

    version: str
    services: Dict[str, Dict] = field(default_factory=dict)
    profiles: Dict[str, Dict] = field(default_factory=dict)
    deployment: Dict[str, Dict] = field(default_factory=dict)
    yaml_content: Optional[str] = None

    def to_yaml(self) -> str:
        """
        Convert manifest to YAML string.

        Returns:
            YAML-formatted manifest
        """
        if self.yaml_content:
            return self.yaml_content

        # Build YAML from components
        import yaml  # type: ignore[import-untyped]

        manifest_dict = {
            "version": self.version,
            "services": self.services,
            "profiles": self.profiles,
            "deployment": self.deployment,
        }
        result: str = yaml.dump(manifest_dict, default_flow_style=False, sort_keys=False)
        return result


# Exceptions


class AkashError(Exception):
    """Base exception for Akash-related errors"""

    pass


class AkashProviderError(AkashError):
    """Raised when no suitable provider is found or provider fails"""

    pass


class AkashTimeoutError(AkashError):
    """Raised when Akash operation times out"""

    pass
