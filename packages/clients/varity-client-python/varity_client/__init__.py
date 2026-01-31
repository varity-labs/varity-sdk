"""
Varity Thirdweb Python Client Library

Comprehensive blockchain client for Varity L3 with contract deployment,
wallet operations, SIWE authentication, and IPFS storage.
"""

from .client import VarityClient
from .chains import VARITY_L3_TESTNET, ARBITRUM_SEPOLIA, Chain
from .exceptions import (
    VarityClientError,
    ContractError,
    WalletError,
    AuthenticationError,
    StorageError,
)

__version__ = "1.0.0"

__all__ = [
    "VarityClient",
    "VARITY_L3_TESTNET",
    "ARBITRUM_SEPOLIA",
    "Chain",
    "VarityClientError",
    "ContractError",
    "WalletError",
    "AuthenticationError",
    "StorageError",
]
