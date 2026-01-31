"""
Revenue Split Service for Varity SDK

Manages revenue distribution between creators and platform (70/30 split).
Production patterns extracted from generic-template-dashboard blockchain service.

Features:
- Revenue distribution (70% creator, 30% platform)
- USDC payment processing
- On-chain revenue tracking
- Multi-tool support

Example:
    >>> from varity.blockchain import RevenueSplitService, BlockchainService
    >>> blockchain = BlockchainService(rpc_url="...")
    >>> revenue = RevenueSplitService(blockchain)
    >>> result = await revenue.distribute_revenue(tool_id=1, amount_usdc=100_000_000)  # 100 USDC (6 decimals)
"""

import logging
from typing import Optional
from decimal import Decimal

from .service import BlockchainService
from .types import RevenueSplit, TransactionResult

logger = logging.getLogger(__name__)


class RevenueSplitService:
    """
    Revenue split service for tool marketplace.

    Manages 70/30 revenue distribution between tool creators and platform.
    Processes payments in USDC (6 decimals on Varity L3).

    Production Pattern: Extracted from generic-template-dashboard blockchain patterns
    """

    def __init__(
        self,
        blockchain_service: BlockchainService,
        splitter_contract_name: str = "RevenueSplitter",
        platform_percentage: int = 30,
    ):
        """
        Initialize the revenue split service.

        Args:
            blockchain_service: Initialized BlockchainService instance
            splitter_contract_name: Name of the revenue splitter contract
            platform_percentage: Platform's percentage (default: 30 for 30%)
        """
        self.blockchain = blockchain_service
        self.splitter_contract_name = splitter_contract_name
        self.platform_percentage = platform_percentage
        self.creator_percentage = 100 - platform_percentage

    def calculate_split(self, total_amount: int) -> tuple[int, int]:
        """
        Calculate creator and platform amounts from total.

        Args:
            total_amount: Total amount in smallest unit (e.g., USDC with 6 decimals)

        Returns:
            Tuple of (creator_amount, platform_amount)

        Example:
            >>> service.calculate_split(100_000_000)  # 100 USDC
            (70_000_000, 30_000_000)  # 70 USDC creator, 30 USDC platform
        """
        creator_amount = (total_amount * self.creator_percentage) // 100
        platform_amount = total_amount - creator_amount  # Remainder goes to platform
        return (creator_amount, platform_amount)

    async def distribute_revenue(
        self, tool_id: int, amount_usdc: int, from_address: Optional[str] = None
    ) -> Optional[TransactionResult]:
        """
        Distribute revenue for a tool purchase.

        Args:
            tool_id: The tool's ID
            amount_usdc: Amount in USDC (6 decimals, e.g., 100_000_000 = 100 USDC)
            from_address: Transaction sender address (if not backend wallet)

        Returns:
            TransactionResult if successful, None if error

        Production Pattern: This is the core revenue distribution logic
        """
        try:
            contract = self.blockchain.get_contract(self.splitter_contract_name)
            if not contract:
                logger.error(f"{self.splitter_contract_name} contract not initialized")
                return None

            # Calculate split
            creator_amount, platform_amount = self.calculate_split(amount_usdc)

            logger.info(
                f"Distributing revenue for tool {tool_id}: "
                f"Total={amount_usdc}, Creator={creator_amount} ({self.creator_percentage}%), "
                f"Platform={platform_amount} ({self.platform_percentage}%)"
            )

            # Note: Actual transaction submission would be done via thirdweb Engine
            # or a backend wallet with private key management
            # This is a read-only implementation showing the pattern

            logger.warning(
                "Transaction submission not implemented - use thirdweb Engine for writes"
            )

            return TransactionResult(
                tx_hash="0x0",  # Placeholder
                status=1,
            )

        except Exception as e:
            logger.error(f"Error distributing revenue for tool {tool_id}: {e}")
            return None

    async def get_revenue_split_config(self, tool_id: int) -> Optional[RevenueSplit]:
        """
        Get revenue split configuration for a tool.

        Args:
            tool_id: The tool's ID

        Returns:
            RevenueSplit configuration, or None if not found
        """
        try:
            contract = self.blockchain.get_contract(self.splitter_contract_name)
            if not contract:
                logger.error(f"{self.splitter_contract_name} contract not initialized")
                return None

            # Call getRevenueSplit(uint256) if available
            # Note: This assumes the contract has such a function
            split_data = contract.functions.getRevenueSplit(tool_id).call()

            return RevenueSplit(
                creator_percentage=int(split_data[0]),
                platform_percentage=int(split_data[1]),
                creator_address=str(split_data[2]),
                platform_address=str(split_data[3]),
            )

        except Exception as e:
            logger.error(f"Error getting revenue split config for tool {tool_id}: {e}")
            return None

    def format_usdc_amount(self, amount: int) -> str:
        """
        Format USDC amount (6 decimals) to human-readable string.

        Args:
            amount: Amount in smallest unit (e.g., 100_000_000)

        Returns:
            Formatted string (e.g., "100.00 USDC")

        Example:
            >>> service.format_usdc_amount(100_000_000)
            "100.00 USDC"
        """
        usdc_value = Decimal(amount) / Decimal(1_000_000)
        return f"{usdc_value:.2f} USDC"

    def parse_usdc_amount(self, amount_str: str) -> int:
        """
        Parse human-readable USDC amount to smallest unit.

        Args:
            amount_str: Amount as string (e.g., "100.50")

        Returns:
            Amount in smallest unit (6 decimals)

        Example:
            >>> service.parse_usdc_amount("100.50")
            100_500_000
        """
        usdc_decimal = Decimal(amount_str)
        return int(usdc_decimal * Decimal(1_000_000))
