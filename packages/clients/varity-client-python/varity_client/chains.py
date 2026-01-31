"""
Varity Chain Configurations

Chain configuration dataclasses for Varity L3 and related networks.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Chain:
    """
    Blockchain network configuration.

    Attributes:
        chain_id: Network chain ID
        name: Human-readable network name
        rpc_url: Primary RPC endpoint URL
        rpc_urls: List of fallback RPC URLs
        explorer_url: Block explorer URL
        native_currency_name: Name of native currency
        native_currency_symbol: Symbol of native currency
        native_currency_decimals: Decimals for native currency
        is_testnet: Whether this is a testnet
    """

    chain_id: int
    name: str
    rpc_url: str
    rpc_urls: list[str]
    explorer_url: str
    native_currency_name: str
    native_currency_symbol: str
    native_currency_decimals: int
    is_testnet: bool = True


# Varity L3 Testnet Configuration (Chain ID: 33529)
VARITY_L3_TESTNET = Chain(
    chain_id=33529,
    name="Varity L3 Testnet",
    rpc_url="https://varity-l3-testnet.rpc.caldera.xyz/http",
    rpc_urls=[
        "https://varity-l3-testnet.rpc.caldera.xyz/http",
        "https://varity-l3-testnet.rpc.caldera.xyz/ws",
    ],
    explorer_url="https://varity-l3-testnet.explorer.caldera.xyz",
    native_currency_name="USDC",
    native_currency_symbol="USDC",
    native_currency_decimals=6,  # USDC has 6 decimals
    is_testnet=True,
)

# Arbitrum Sepolia (Testnet)
ARBITRUM_SEPOLIA = Chain(
    chain_id=421614,
    name="Arbitrum Sepolia",
    rpc_url="https://sepolia-rollup.arbitrum.io/rpc",
    rpc_urls=[
        "https://sepolia-rollup.arbitrum.io/rpc",
        "https://arbitrum-sepolia.publicnode.com",
    ],
    explorer_url="https://sepolia.arbiscan.io",
    native_currency_name="Sepolia Ether",
    native_currency_symbol="ETH",
    native_currency_decimals=18,
    is_testnet=True,
)

# Arbitrum One (Mainnet)
ARBITRUM_ONE = Chain(
    chain_id=42161,
    name="Arbitrum One",
    rpc_url="https://arb1.arbitrum.io/rpc",
    rpc_urls=[
        "https://arb1.arbitrum.io/rpc",
        "https://arbitrum-one.publicnode.com",
    ],
    explorer_url="https://arbiscan.io",
    native_currency_name="Ether",
    native_currency_symbol="ETH",
    native_currency_decimals=18,
    is_testnet=False,
)


def get_chain_by_id(chain_id: int) -> Optional[Chain]:
    """
    Get chain configuration by chain ID.

    Args:
        chain_id: Network chain ID

    Returns:
        Chain configuration or None if not found
    """
    chains = {
        33529: VARITY_L3_TESTNET,
        421614: ARBITRUM_SEPOLIA,
        42161: ARBITRUM_ONE,
    }
    return chains.get(chain_id)
