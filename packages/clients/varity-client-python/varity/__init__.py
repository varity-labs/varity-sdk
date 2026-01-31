"""
Varity Python Client Library

Multi-module SDK for building applications on Varity L3.

Modules:
- S3 Client: boto3-compatible decentralized storage
- Blockchain: Web3 integration for smart contracts (ERC-1155 NFT, revenue splits)

Production patterns extracted from generic-template-dashboard.
"""

from .s3_client import VarityS3Client
from .version import __version__

# Blockchain module (optional import - requires web3.py)
try:
    from .blockchain import (
        BlockchainService,
        NFTLicensingService,
        RevenueSplitService,
        ContractConfig,
        NFTMetadata,
        LicenseInfo,
        RevenueSplit,
        TransactionResult,
    )

    __all__ = [
        "VarityS3Client",
        "__version__",
        "BlockchainService",
        "NFTLicensingService",
        "RevenueSplitService",
        "ContractConfig",
        "NFTMetadata",
        "LicenseInfo",
        "RevenueSplit",
        "TransactionResult",
    ]
except ImportError:
    # web3.py not installed
    __all__ = ["VarityS3Client", "__version__"]
