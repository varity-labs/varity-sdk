"""
Varity Client Utility Functions

Helper functions for address validation, USDC formatting, and conversions.
"""

from decimal import Decimal, InvalidOperation
from typing import Union
from eth_utils import is_address, to_checksum_address, to_wei, from_wei
from .exceptions import VarityClientError


def format_usdc(amount_wei: Union[int, str]) -> Decimal:
    """
    Format USDC amount from Wei (smallest unit) to Decimal with 6 decimals.

    USDC has 6 decimals, so 1 USDC = 1,000,000 Wei.

    Args:
        amount_wei: Amount in Wei (smallest unit)

    Returns:
        Decimal with 6 decimal places

    Example:
        >>> format_usdc(1000000)
        Decimal('1.000000')
        >>> format_usdc(1500000)
        Decimal('1.500000')
    """
    try:
        amount_wei = int(amount_wei)
        # USDC has 6 decimals
        return Decimal(amount_wei) / Decimal(10**6)
    except (ValueError, InvalidOperation) as e:
        raise VarityClientError(f"Invalid USDC amount: {amount_wei}") from e


def parse_usdc(amount: Union[str, float, Decimal]) -> int:
    """
    Parse USDC amount from human-readable format to Wei (smallest unit).

    USDC has 6 decimals, so 1 USDC = 1,000,000 Wei.

    Args:
        amount: USDC amount (e.g., "1.5", 1.5, Decimal("1.5"))

    Returns:
        Amount in Wei (integer)

    Example:
        >>> parse_usdc("1.5")
        1500000
        >>> parse_usdc(Decimal("0.000001"))
        1
    """
    try:
        amount_decimal = Decimal(str(amount))
        # USDC has 6 decimals
        return int(amount_decimal * Decimal(10**6))
    except (ValueError, InvalidOperation) as e:
        raise VarityClientError(f"Invalid USDC amount: {amount}") from e


def format_eth(amount_wei: Union[int, str]) -> Decimal:
    """
    Format ETH amount from Wei to Decimal with 18 decimals.

    Args:
        amount_wei: Amount in Wei

    Returns:
        Decimal with 18 decimal places

    Example:
        >>> format_eth(1000000000000000000)
        Decimal('1.000000000000000000')
    """
    try:
        amount_wei = int(amount_wei)
        return Decimal(from_wei(amount_wei, "ether"))
    except (ValueError, InvalidOperation) as e:
        raise VarityClientError(f"Invalid ETH amount: {amount_wei}") from e


def parse_eth(amount: Union[str, float, Decimal]) -> int:
    """
    Parse ETH amount from human-readable format to Wei.

    Args:
        amount: ETH amount (e.g., "1.5")

    Returns:
        Amount in Wei (integer)

    Example:
        >>> parse_eth("1.5")
        1500000000000000000
    """
    try:
        amount_str = str(amount)
        return to_wei(amount_str, "ether")
    except (ValueError, InvalidOperation) as e:
        raise VarityClientError(f"Invalid ETH amount: {amount}") from e


def validate_address(address: str) -> bool:
    """
    Validate Ethereum address format.

    Args:
        address: Ethereum address to validate

    Returns:
        True if valid, False otherwise

    Example:
        >>> validate_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5")
        True
        >>> validate_address("0xinvalid")
        False
    """
    if not address:
        return False
    return is_address(address)


def to_checksum(address: str) -> str:
    """
    Convert Ethereum address to checksum format.

    Args:
        address: Ethereum address

    Returns:
        Checksummed address

    Raises:
        VarityClientError: If address is invalid

    Example:
        >>> to_checksum("0x742d35cc6634c0532925a3b844bc9e7595f0beb5")
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'
    """
    if not validate_address(address):
        raise VarityClientError(f"Invalid Ethereum address: {address}")
    return to_checksum_address(address)


def wei_to_gwei(amount_wei: int) -> Decimal:
    """
    Convert Wei to Gwei.

    Args:
        amount_wei: Amount in Wei

    Returns:
        Amount in Gwei as Decimal

    Example:
        >>> wei_to_gwei(1000000000)
        Decimal('1')
    """
    return Decimal(amount_wei) / Decimal(10**9)


def gwei_to_wei(amount_gwei: Union[int, float, Decimal]) -> int:
    """
    Convert Gwei to Wei.

    Args:
        amount_gwei: Amount in Gwei

    Returns:
        Amount in Wei as integer

    Example:
        >>> gwei_to_wei(1)
        1000000000
    """
    return int(Decimal(str(amount_gwei)) * Decimal(10**9))


def format_transaction_hash(tx_hash: str) -> str:
    """
    Format transaction hash with 0x prefix.

    Args:
        tx_hash: Transaction hash

    Returns:
        Formatted transaction hash with 0x prefix
    """
    if not tx_hash:
        return ""
    if tx_hash.startswith("0x"):
        return tx_hash
    return f"0x{tx_hash}"


def short_address(address: str, prefix_len: int = 6, suffix_len: int = 4) -> str:
    """
    Shorten Ethereum address for display.

    Args:
        address: Full Ethereum address
        prefix_len: Number of characters to show at start (including 0x)
        suffix_len: Number of characters to show at end

    Returns:
        Shortened address (e.g., "0x742d...bEb5")

    Example:
        >>> short_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5")
        '0x742d...bEb5'
    """
    if not validate_address(address):
        return address
    if len(address) <= prefix_len + suffix_len + 3:
        return address
    return f"{address[:prefix_len]}...{address[-suffix_len:]}"
