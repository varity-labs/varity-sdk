"""
Varity Blockchain Module

Production-grade blockchain integration for Varity L3 and other EVM chains.
Extracted from generic-template-dashboard production deployment.

Features:
- Contract ABI loading and management
- NFT licensing (ERC-1155)
- Revenue split distribution
- Multi-chain support (Varity L3, Arbitrum, Base)
- Error handling and retry logic

Example:
    >>> from varity.blockchain import BlockchainService
    >>> service = BlockchainService(rpc_url="https://rpc-varity-testnet...")
    >>> has_license = await service.has_license(wallet_address, tool_id=1)
"""

from .service import BlockchainService
from .nft_licensing import NFTLicensingService
from .revenue_split import RevenueSplitService
from .types import (
    ContractConfig,
    NFTMetadata,
    LicenseInfo,
    RevenueSplit,
    TransactionResult,
)

__all__ = [
    "BlockchainService",
    "NFTLicensingService",
    "RevenueSplitService",
    "ContractConfig",
    "NFTMetadata",
    "LicenseInfo",
    "RevenueSplit",
    "TransactionResult",
]

__version__ = "2.0.0-alpha.1"
