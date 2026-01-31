"""
Blockchain Service for Varity SDK

Core blockchain integration using web3.py.
Production patterns extracted from generic-template-dashboard (blockchain_service.py).

Features:
- Web3 connection management
- Contract ABI loading
- Contract instance creation
- Multi-chain support (Varity L3, Arbitrum, Base)
- Connection health checks

Example:
    >>> from varity.blockchain import BlockchainService
    >>> service = BlockchainService(
    ...     rpc_url="https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz",
    ...     chain_id=33529
    ... )
    >>> is_connected = service.is_connected()
    >>> print(f"Connected: {is_connected}")
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError

from .types import ContractConfig

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Core blockchain service for interacting with smart contracts.

    This service manages Web3 connections and provides methods to read/write data
    from deployed smart contracts on EVM-compatible chains.

    Production Pattern: Extracted from generic-template-dashboard lines 39-162
    """

    def __init__(
        self,
        rpc_url: str,
        chain_id: int = 33529,
        contracts_dir: Optional[Path] = None,
    ):
        """
        Initialize the blockchain service.

        Args:
            rpc_url: RPC endpoint URL (e.g., "https://rpc-varity-testnet...")
            chain_id: Chain ID (33529 for Varity L3 Testnet)
            contracts_dir: Directory containing contract ABI JSON files
        """
        self.rpc_url = rpc_url
        self.chain_id = chain_id
        self.contracts_dir = contracts_dir or Path(__file__).parent / "abis"

        # Initialize Web3 instance
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))

        # Contract instances cache
        self.contracts: Dict[str, Contract] = {}

        # Contract ABIs cache
        self.abis: Dict[str, List[Dict]] = {}

        logger.info(f"Blockchain service initialized for chain ID {self.chain_id}")
        logger.info(f"Connected to RPC: {self.rpc_url}")
        logger.info(f"Is connected: {self.w3.is_connected()}")

    def is_connected(self) -> bool:
        """
        Check if Web3 is connected to the blockchain.

        Returns:
            True if connected, False otherwise

        Production Pattern: Extracted from lines 143-145
        """
        try:
            return self.w3.is_connected()
        except Exception as e:
            logger.error(f"Connection check failed: {e}")
            return False

    def get_block_number(self) -> int:
        """
        Get the latest block number.

        Returns:
            Current block number, or 0 if error

        Production Pattern: Extracted from lines 147-153
        """
        try:
            return self.w3.eth.block_number
        except Exception as e:
            logger.error(f"Failed to get block number: {e}")
            return 0

    def get_chain_id(self) -> int:
        """
        Get the chain ID.

        Returns:
            Chain ID, or 0 if error

        Production Pattern: Extracted from lines 155-161
        """
        try:
            return self.w3.eth.chain_id
        except Exception as e:
            logger.error(f"Failed to get chain ID: {e}")
            return 0

    def load_contract_abi(self, contract_name: str) -> List[Dict]:
        """
        Load contract ABI from JSON file.

        Args:
            contract_name: Name of the contract (e.g., "ToolMarketplace")

        Returns:
            Contract ABI as list of dictionaries

        Production Pattern: Extracted from lines 79-114
        """
        # Check cache first
        if contract_name in self.abis:
            return self.abis[contract_name]

        # Load from file
        abi_path = self.contracts_dir / f"{contract_name}.json"

        try:
            with open(abi_path, "r") as f:
                contract_data = json.load(f)

                # Handle different JSON formats
                if isinstance(contract_data, list):
                    # Already an ABI array
                    abi = contract_data
                elif isinstance(contract_data, dict) and "abi" in contract_data:
                    # Wrapped in object with "abi" key
                    abi = contract_data["abi"]
                else:
                    # Assume it's the ABI
                    abi = contract_data

                # Cache it
                self.abis[contract_name] = abi
                logger.info(f"Loaded ABI for {contract_name} ({len(abi)} items)")
                return abi

        except FileNotFoundError:
            logger.error(f"ABI file not found: {abi_path}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in ABI file {abi_path}: {e}")
            return []
        except Exception as e:
            logger.error(f"Failed to load ABI for {contract_name}: {e}")
            return []

    def initialize_contract(
        self, contract_name: str, address: str
    ) -> Optional[Contract]:
        """
        Initialize a contract instance.

        Args:
            contract_name: Name of the contract
            address: Contract address (will be checksummed)

        Returns:
            Contract instance, or None if error

        Production Pattern: Extracted from lines 116-140
        """
        # Check if zero address
        if address == "0x0000000000000000000000000000000000000000":
            logger.warning(f"Skipping {contract_name} - not deployed yet")
            return None

        # Check if already initialized
        if contract_name in self.contracts:
            return self.contracts[contract_name]

        # Load ABI
        abi = self.load_contract_abi(contract_name)
        if not abi:
            logger.warning(f"No ABI found for {contract_name}")
            return None

        try:
            # Create checksummed address
            checksum_address = self.w3.to_checksum_address(address)

            # Create contract instance
            contract = self.w3.eth.contract(address=checksum_address, abi=abi)

            # Cache it
            self.contracts[contract_name] = contract
            logger.info(f"Initialized {contract_name} at {checksum_address}")

            return contract

        except Exception as e:
            logger.error(f"Failed to initialize {contract_name}: {e}")
            return None

    def get_contract(self, contract_name: str) -> Optional[Contract]:
        """
        Get a cached contract instance.

        Args:
            contract_name: Name of the contract

        Returns:
            Contract instance, or None if not initialized
        """
        return self.contracts.get(contract_name)

    def to_checksum_address(self, address: str) -> str:
        """
        Convert an address to checksummed format.

        Args:
            address: Ethereum address

        Returns:
            Checksummed address
        """
        return self.w3.to_checksum_address(address)

    def from_wei(self, value: int, unit: str = "ether") -> float:
        """
        Convert Wei to Ether (or other unit).

        Args:
            value: Value in Wei
            unit: Target unit ("ether", "gwei", etc.)

        Returns:
            Value in target unit
        """
        return float(self.w3.from_wei(value, unit))

    def to_wei(self, value: float, unit: str = "ether") -> int:
        """
        Convert Ether (or other unit) to Wei.

        Args:
            value: Value in source unit
            unit: Source unit ("ether", "gwei", etc.)

        Returns:
            Value in Wei
        """
        return self.w3.to_wei(value, unit)
