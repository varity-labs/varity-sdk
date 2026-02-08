"""
Data structures for App Store integration.

This module defines all data types used in the App Store submission system.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional


class AppCategory(str, Enum):
    """Valid app categories for the Varity App Store."""

    DEFI = "DeFi"
    GAMING = "Gaming"
    NFT = "NFT"
    DAO = "DAO"
    SOCIAL = "Social"
    INFRASTRUCTURE = "Infrastructure"
    TOOLING = "Tooling"
    OTHER = "Other"


class InfrastructureTier(str, Enum):
    """Infrastructure tier for billing (Revenue Stream #1)."""

    FREE = "free"
    STARTER = "starter"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"


class PartnershipService(str, Enum):
    """Partnership services for billing (Revenue Stream #2).

    These are auto-detected from package.json dependencies.
    """

    PRIVY = "privy"
    THIRDWEB = "thirdweb"
    FILECOIN = "filecoin"


# Mapping of npm package patterns to service IDs
SERVICE_DETECTION_PATTERNS = {
    "@privy-io/react-auth": PartnershipService.PRIVY,
    "@privy-io/server-auth": PartnershipService.PRIVY,
    "thirdweb": PartnershipService.THIRDWEB,
    "@thirdweb-dev/sdk": PartnershipService.THIRDWEB,
    "@thirdweb-dev/react": PartnershipService.THIRDWEB,
    "@web3-storage/w3up-client": PartnershipService.FILECOIN,
    "@web3-storage/upload-client": PartnershipService.FILECOIN,
    "web3.storage": PartnershipService.FILECOIN,
}

# Service display names and monthly prices (for CLI display)
SERVICE_INFO = {
    PartnershipService.PRIVY: {"name": "Privy (Authentication)", "price": 85},
    PartnershipService.THIRDWEB: {"name": "thirdweb (Smart Contracts)", "price": 85},
    PartnershipService.FILECOIN: {"name": "Filecoin (Storage)", "price": 170},
}


class AppStatusEnum(str, Enum):
    """App approval status in the store."""

    PENDING = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    INACTIVE = "inactive"


@dataclass
class AppMetadata:
    """
    Metadata for submitting an app to the Varity App Store.

    This structure matches the submitApp() function parameters in the
    VarityAppStore smart contract (Arbitrum Stylus).

    Attributes:
        name: Application name (from package.json)
        description: Application description (from package.json)
        app_url: Deployed application URL (from deployment result)
        logo_url: IPFS URL to app logo (uploaded automatically)
        github_url: GitHub repository URL (from package.json repository field)
        category: App category (from varity field in package.json)
        screenshots: List of IPFS URLs to screenshot images (optional)
        chain_id: Chain ID where app is deployed (e.g., 33529 for Varity L3)
        tier: Infrastructure tier for billing (free, starter, growth, enterprise)
        services: Comma-separated list of detected partnership services (e.g., "privy,thirdweb")
        has_payment_widget: MANDATORY - Whether app uses PaymentWidget from @varity/ui-kit
    """

    name: str
    description: str
    app_url: str
    logo_url: str
    github_url: str
    category: str
    screenshots: List[str]
    chain_id: int
    tier: str = "free"
    services: str = ""
    has_payment_widget: bool = False  # MANDATORY for monetization

    def validate(self) -> None:
        """
        Validate metadata before submission.

        Raises:
            MetadataValidationError: If any field is invalid
        """
        if not self.name or len(self.name) < 3:
            raise MetadataValidationError("App name must be at least 3 characters")

        if not self.description or len(self.description) < 10:
            raise MetadataValidationError("Description must be at least 10 characters")

        if not self.app_url or not self.app_url.startswith("http"):
            raise MetadataValidationError("Invalid app URL")

        if not self.logo_url or not self.logo_url.startswith("http"):
            raise MetadataValidationError("Invalid logo URL")

        if self.category not in [c.value for c in AppCategory]:
            raise MetadataValidationError(
                f"Invalid category: {self.category}. "
                f"Must be one of: {[c.value for c in AppCategory]}"
            )

        if self.chain_id <= 0:
            raise MetadataValidationError("Invalid chain ID")

        # GitHub URL is optional but must be valid if provided
        if self.github_url and not self.github_url.startswith("http"):
            raise MetadataValidationError("Invalid GitHub URL")

        # Validate tier
        if self.tier not in [t.value for t in InfrastructureTier]:
            raise MetadataValidationError(
                f"Invalid tier: {self.tier}. "
                f"Must be one of: {[t.value for t in InfrastructureTier]}"
            )

        # MANDATORY: PaymentWidget must be detected for monetization
        # This ensures all payments go through Varity with 90/10 split
        if not self.has_payment_widget:
            raise MetadataValidationError(
                "PaymentWidget not detected. All apps submitted to the Varity App Store "
                "must use PaymentWidget from @varity/ui-kit for monetization. "
                "This ensures the 90/10 revenue split (90% to developer, 10% to Varity). "
                "Add PaymentWidget to your app and redeploy."
            )

    def to_contract_params(self) -> dict:
        """
        Convert metadata to contract function parameters.

        Returns:
            Dictionary with parameters for submitApp() contract call
        """
        return {
            "name": self.name,
            "description": self.description,
            "appUrl": self.app_url,
            "logoUrl": self.logo_url,
            "githubUrl": self.github_url,
            "category": self.category,
            "screenshots": self.screenshots,
            "chainId": self.chain_id,
            "tier": self.tier,
            "services": self.services,
        }


@dataclass
class SubmissionResult:
    """
    Result from submitting an app to the App Store.

    Attributes:
        success: Whether submission was successful
        app_id: Unique app ID assigned by the contract
        tx_hash: Transaction hash of the submission
        url: URL to view the app in the store (e.g., https://store.varity.so/apps/42)
        error_message: Error message if submission failed
    """

    success: bool
    app_id: Optional[int] = None
    tx_hash: Optional[str] = None
    url: Optional[str] = None
    error_message: Optional[str] = None

    def __str__(self):
        """Pretty string representation"""
        if self.success:
            return f"App submitted successfully!\n  App ID: {self.app_id}\n  Transaction: {self.tx_hash}\n  View at: {self.url}"
        else:
            return f"Submission failed: {self.error_message}"


@dataclass
class AppStatus:
    """
    Status of an app in the App Store.

    Attributes:
        app_id: Unique app identifier
        developer: Developer wallet address
        name: Application name
        is_approved: Whether app is approved by admin
        is_active: Whether app is currently active
        built_with_varity: Whether app uses Varity SDK
        published_at: Unix timestamp of publication
        status: Current approval status
    """

    app_id: int
    developer: str
    name: str
    is_approved: bool
    is_active: bool
    built_with_varity: bool
    published_at: int
    status: AppStatusEnum


# Error classes
class AppStoreError(Exception):
    """Base class for App Store errors"""

    pass


class ContractInteractionError(AppStoreError):
    """Raised when contract interaction fails"""

    pass


class MetadataValidationError(AppStoreError):
    """Raised when metadata validation fails"""

    pass


class AssetUploadError(AppStoreError):
    """Raised when logo/screenshot upload fails"""

    pass


class TransactionError(AppStoreError):
    """Raised when transaction signing/submission fails"""

    pass
