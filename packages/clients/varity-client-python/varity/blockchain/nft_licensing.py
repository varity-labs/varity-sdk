"""
NFT Licensing Service for Varity SDK

ERC-1155 NFT-based licensing system.
Production patterns extracted from generic-template-dashboard (lines 218-280).

Features:
- License ownership verification
- License metadata retrieval
- Multi-token support (ERC-1155)
- Tool marketplace integration

Example:
    >>> from varity.blockchain import NFTLicensingService, BlockchainService
    >>> blockchain = BlockchainService(rpc_url="...")
    >>> licensing = NFTLicensingService(blockchain)
    >>> has_license = await licensing.has_license("0x...", tool_id=1)
"""

import logging
from typing import List, Optional

from .service import BlockchainService
from .types import NFTMetadata, LicenseInfo

logger = logging.getLogger(__name__)


class NFTLicensingService:
    """
    NFT-based licensing service using ERC-1155.

    This service manages license NFTs for tools and features, allowing
    businesses to gate access based on NFT ownership.

    Production Pattern: Extracted from generic-template-dashboard lines 218-280
    """

    def __init__(
        self,
        blockchain_service: BlockchainService,
        nft_contract_name: str = "ToolLicenseNFT",
    ):
        """
        Initialize the NFT licensing service.

        Args:
            blockchain_service: Initialized BlockchainService instance
            nft_contract_name: Name of the NFT contract (default: "ToolLicenseNFT")
        """
        self.blockchain = blockchain_service
        self.nft_contract_name = nft_contract_name

    async def has_license(self, customer_wallet: str, tool_id: int) -> bool:
        """
        Check if customer owns license NFT for a specific tool.

        Args:
            customer_wallet: Customer's wallet address
            tool_id: The tool's ID

        Returns:
            True if customer owns the license NFT, False otherwise

        Production Pattern: Extracted from lines 220-246
        """
        try:
            contract = self.blockchain.get_contract(self.nft_contract_name)
            if not contract:
                logger.error(f"{self.nft_contract_name} contract not initialized")
                return False

            # Convert to checksum address
            checksum_address = self.blockchain.to_checksum_address(customer_wallet)

            # Call balanceOf(address, uint256) - ERC-1155 function
            balance = contract.functions.balanceOf(checksum_address, tool_id).call()

            return int(balance) > 0

        except Exception as e:
            logger.error(
                f"Error checking license for wallet {customer_wallet}, tool {tool_id}: {e}"
            )
            return False

    async def get_user_licenses(self, customer_wallet: str) -> List[int]:
        """
        Get all tool IDs that the user has licenses for.

        Args:
            customer_wallet: Customer's wallet address

        Returns:
            List of tool IDs the user has licenses for

        Production Pattern: Extracted from lines 248-280
        """
        try:
            contract = self.blockchain.get_contract(self.nft_contract_name)
            if not contract:
                logger.error(f"{self.nft_contract_name} contract not initialized")
                return []

            checksum_address = self.blockchain.to_checksum_address(customer_wallet)

            # Get all active tools from marketplace
            marketplace_contract = self.blockchain.get_contract("ToolMarketplace")
            if not marketplace_contract:
                logger.error("ToolMarketplace contract not initialized")
                return []

            # Get active tool IDs
            tool_ids = marketplace_contract.functions.getActiveTools().call()

            # Check balance for each tool
            licenses = []
            for tool_id in tool_ids:
                balance = contract.functions.balanceOf(checksum_address, tool_id).call()
                if int(balance) > 0:
                    licenses.append(int(tool_id))

            return licenses

        except Exception as e:
            logger.error(f"Error getting user licenses for wallet {customer_wallet}: {e}")
            return []

    async def get_tool_metadata(self, tool_id: int) -> Optional[NFTMetadata]:
        """
        Get tool metadata including price and details.

        Args:
            tool_id: The tool's unique ID

        Returns:
            NFTMetadata object, or None if not found

        Production Pattern: Extracted from lines 186-216
        """
        try:
            contract = self.blockchain.get_contract(self.nft_contract_name)
            if not contract:
                logger.error(f"{self.nft_contract_name} contract not initialized")
                return None

            # Call getToolMetadata function
            metadata = contract.functions.getToolMetadata(tool_id).call()

            # Parse response
            return NFTMetadata.from_contract_response(tool_id, metadata)

        except Exception as e:
            logger.error(f"Error getting tool metadata for tool {tool_id}: {e}")
            return None

    async def get_license_info(
        self, customer_wallet: str, tool_id: int
    ) -> Optional[LicenseInfo]:
        """
        Get detailed license information for a user's NFT.

        Args:
            customer_wallet: Customer's wallet address
            tool_id: The tool's ID

        Returns:
            LicenseInfo object, or None if not found
        """
        try:
            contract = self.blockchain.get_contract(self.nft_contract_name)
            if not contract:
                logger.error(f"{self.nft_contract_name} contract not initialized")
                return None

            checksum_address = self.blockchain.to_checksum_address(customer_wallet)

            # Get balance
            balance = contract.functions.balanceOf(checksum_address, tool_id).call()

            return LicenseInfo(
                tool_id=tool_id,
                balance=int(balance),
                is_valid=int(balance) > 0,
            )

        except Exception as e:
            logger.error(
                f"Error getting license info for wallet {customer_wallet}, tool {tool_id}: {e}"
            )
            return None

    async def get_active_tools(self) -> List[int]:
        """
        Get list of all active tool IDs from the marketplace.

        Returns:
            List of active tool IDs

        Production Pattern: Extracted from lines 165-184
        """
        try:
            contract = self.blockchain.get_contract("ToolMarketplace")
            if not contract:
                logger.error("ToolMarketplace contract not initialized")
                return []

            # Call getActiveTools function
            tool_ids = contract.functions.getActiveTools().call()
            return [int(tool_id) for tool_id in tool_ids]

        except Exception as e:
            logger.error(f"Error getting active tools: {e}")
            return []
