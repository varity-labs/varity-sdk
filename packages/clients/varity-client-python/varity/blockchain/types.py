"""
Type definitions for Varity blockchain module.

Production patterns extracted from generic-template-dashboard.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ContractConfig:
    """Configuration for a smart contract."""

    name: str
    address: str
    abi: List[Dict[str, Any]]
    chain_id: int


@dataclass
class NFTMetadata:
    """Metadata for an NFT (ERC-1155)."""

    tool_id: int
    name: str
    description: str
    price: Decimal
    creator: str
    is_active: bool

    @classmethod
    def from_contract_response(cls, tool_id: int, response: tuple) -> "NFTMetadata":
        """Parse contract response into NFTMetadata."""
        return cls(
            tool_id=tool_id,
            name=response[0] if len(response) > 0 else "",
            description=response[1] if len(response) > 1 else "",
            price=Decimal(str(response[2])) if len(response) > 2 else Decimal("0"),
            creator=response[3] if len(response) > 3 else "",
            is_active=response[4] if len(response) > 4 else False,
        )


@dataclass
class LicenseInfo:
    """Information about a user's NFT license."""

    tool_id: int
    balance: int
    expires_at: Optional[int] = None
    is_valid: bool = True

    @property
    def has_license(self) -> bool:
        """Check if license is valid and non-zero balance."""
        return self.balance > 0 and self.is_valid


@dataclass
class RevenueSplit:
    """Revenue split configuration."""

    creator_percentage: int  # e.g., 70 for 70%
    platform_percentage: int  # e.g., 30 for 30%
    creator_address: str
    platform_address: str

    def validate(self) -> bool:
        """Validate that percentages sum to 100."""
        return self.creator_percentage + self.platform_percentage == 100


@dataclass
class TransactionResult:
    """Result of a blockchain transaction."""

    tx_hash: str
    block_number: Optional[int] = None
    gas_used: Optional[int] = None
    status: int = 1  # 1 = success, 0 = failure

    @property
    def is_success(self) -> bool:
        """Check if transaction was successful."""
        return self.status == 1
