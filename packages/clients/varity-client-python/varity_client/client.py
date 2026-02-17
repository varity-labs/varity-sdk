"""
Varity Thirdweb Client

Main client class for interacting with Varity L3 blockchain.
"""

import asyncio
from typing import Optional, Dict, Any
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account

from .chains import Chain, VARITY_L3_TESTNET
from .contracts import ContractManager
from .wallet import WalletManager
from .auth import AuthManager
from .storage import StorageManager
from .exceptions import VarityClientError, NetworkError


class VarityClient:
    """
    Main client for interacting with Varity L3 blockchain.

    This client provides comprehensive blockchain operations including:
    - Smart contract deployment and interaction
    - Wallet management and transactions
    - SIWE (Sign-In with Ethereum) authentication
    - IPFS storage operations

    Args:
        chain_id: Network chain ID (default: 33529 for Varity L3 Testnet)
        chain: Custom chain configuration (overrides chain_id)
        private_key: Private key for wallet operations (optional)
        thirdweb_client_id: Thirdweb client ID for API access
        rpc_url: Custom RPC URL (overrides chain default)
        ipfs_gateway: IPFS gateway URL (default: Thirdweb gateway)

    Example:
        >>> from varity_client import VarityClient
        >>>
        >>> # Initialize client
        >>> client = VarityClient(
        ...     chain_id=33529,
        ...     private_key="0x...",
        ...     thirdweb_client_id="a35636133eb5ec6f30eb9f4c15fce2f3"
        ... )
        >>>
        >>> # Get balance
        >>> balance = await client.wallet.get_balance("0x...")
        >>> print(f"Balance: {balance.balance} USDC")
        >>>
        >>> # Deploy contract
        >>> contract = await client.contracts.deploy_contract(
        ...     contract_type="ERC20",
        ...     name="MyToken",
        ...     symbol="MTK",
        ...     initial_supply="1000000"
        ... )
        >>> print(f"Contract deployed at: {contract.address}")
    """

    def __init__(
        self,
        chain_id: int = 33529,
        chain: Optional[Chain] = None,
        private_key: Optional[str] = None,
        thirdweb_client_id: str = "a35636133eb5ec6f30eb9f4c15fce2f3",
        rpc_url: Optional[str] = None,
        ipfs_gateway: str = "https://gateway.ipfscdn.io/ipfs/",
    ):
        """Initialize Varity client."""
        # Set chain configuration
        if chain:
            self.chain = chain
        else:
            from .chains import get_chain_by_id

            self.chain = get_chain_by_id(chain_id)
            if not self.chain:
                self.chain = VARITY_L3_TESTNET

        # Use custom RPC URL if provided
        if rpc_url:
            self.rpc_url = rpc_url
        else:
            self.rpc_url = self.chain.rpc_url

        # Store configuration
        self.thirdweb_client_id = thirdweb_client_id
        self.ipfs_gateway = ipfs_gateway

        # Initialize Web3
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            # Add PoA middleware for Arbitrum
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

            # Verify connection
            if not self.w3.is_connected():
                raise NetworkError(
                    f"Failed to connect to RPC endpoint: {self.rpc_url}",
                    {"chain_id": self.chain.chain_id, "rpc_url": self.rpc_url},
                )
        except Exception as e:
            raise NetworkError(
                f"Failed to initialize Web3 provider: {str(e)}",
                {"chain_id": self.chain.chain_id, "rpc_url": self.rpc_url},
            ) from e

        # Initialize account if private key provided
        self.account: Optional[Account] = None
        if private_key:
            try:
                self.account = Account.from_key(private_key)
            except Exception as e:
                raise VarityClientError(
                    f"Invalid private key: {str(e)}"
                ) from e

        # Initialize managers
        self.contracts = ContractManager(self)
        self.wallet = WalletManager(self)
        self.auth = AuthManager(self)
        self.storage = StorageManager(self)

    @property
    def address(self) -> Optional[str]:
        """Get the address of the connected account."""
        return self.account.address if self.account else None

    @property
    def chain_id(self) -> int:
        """Get the current chain ID."""
        return self.chain.chain_id

    def get_config(self) -> Dict[str, Any]:
        """
        Get client configuration.

        Returns:
            Dictionary containing client configuration
        """
        return {
            "chain_id": self.chain.chain_id,
            "chain_name": self.chain.name,
            "rpc_url": self.rpc_url,
            "explorer_url": self.chain.explorer_url,
            "native_currency": {
                "name": self.chain.native_currency_name,
                "symbol": self.chain.native_currency_symbol,
                "decimals": self.chain.native_currency_decimals,
            },
            "is_testnet": self.chain.is_testnet,
            "thirdweb_client_id": self.thirdweb_client_id,
            "connected_address": self.address,
        }

    def is_connected(self) -> bool:
        """
        Check if client is connected to the blockchain.

        Returns:
            True if connected, False otherwise
        """
        return self.w3.is_connected()

    async def get_block_number(self) -> int:
        """
        Get the current block number.

        Returns:
            Current block number

        Example:
            >>> block_number = await client.get_block_number()
            >>> print(f"Current block: {block_number}")
        """
        try:
            return await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.block_number
            )
        except Exception as e:
            raise NetworkError(
                f"Failed to get block number: {str(e)}"
            ) from e

    async def get_gas_price(self) -> int:
        """
        Get the current gas price in Wei.

        Returns:
            Gas price in Wei

        Example:
            >>> gas_price = await client.get_gas_price()
            >>> print(f"Gas price: {gas_price} Wei")
        """
        try:
            return await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.gas_price
            )
        except Exception as e:
            raise NetworkError(
                f"Failed to get gas price: {str(e)}"
            ) from e

    def __enter__(self):
        """Enter context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context manager."""
        # Clean up resources if needed
        pass

    def __repr__(self) -> str:
        """String representation of client."""
        return (
            f"VarityClient(chain_id={self.chain_id}, "
            f"chain_name='{self.chain.name}', "
            f"connected={self.is_connected()})"
        )
