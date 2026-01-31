"""
Test suite for utility functions

Tests address validation, USDC formatting, and conversions.
"""

import pytest
from decimal import Decimal
from varity_client.utils import (
    format_usdc,
    parse_usdc,
    format_eth,
    parse_eth,
    validate_address,
    to_checksum,
    wei_to_gwei,
    gwei_to_wei,
    format_transaction_hash,
    short_address,
)
from varity_client.exceptions import VarityClientError


class TestUSDCFormatting:
    """Test USDC formatting functions (6 decimals)."""

    def test_format_usdc_basic(self):
        """Test basic USDC formatting."""
        result = format_usdc(1000000)
        assert result == Decimal("1.000000")

    def test_format_usdc_fractional(self):
        """Test fractional USDC formatting."""
        result = format_usdc(1500000)
        assert result == Decimal("1.500000")

    def test_format_usdc_small_amount(self):
        """Test small USDC amount."""
        result = format_usdc(1)
        assert result == Decimal("0.000001")

    def test_format_usdc_zero(self):
        """Test zero USDC."""
        result = format_usdc(0)
        assert result == Decimal("0")

    def test_format_usdc_string_input(self):
        """Test USDC formatting with string input."""
        result = format_usdc("1000000")
        assert result == Decimal("1.000000")

    def test_format_usdc_invalid(self):
        """Test invalid USDC input."""
        with pytest.raises(VarityClientError):
            format_usdc("invalid")

    def test_parse_usdc_basic(self):
        """Test basic USDC parsing."""
        result = parse_usdc("1.5")
        assert result == 1500000

    def test_parse_usdc_decimal(self):
        """Test USDC parsing with Decimal."""
        result = parse_usdc(Decimal("1.5"))
        assert result == 1500000

    def test_parse_usdc_float(self):
        """Test USDC parsing with float."""
        result = parse_usdc(1.5)
        assert result == 1500000

    def test_parse_usdc_small_amount(self):
        """Test parsing small USDC amount."""
        result = parse_usdc("0.000001")
        assert result == 1

    def test_parse_usdc_zero(self):
        """Test parsing zero USDC."""
        result = parse_usdc("0")
        assert result == 0

    def test_parse_usdc_invalid(self):
        """Test invalid USDC parsing."""
        with pytest.raises(VarityClientError):
            parse_usdc("invalid")

    def test_usdc_roundtrip(self):
        """Test USDC format and parse roundtrip."""
        original = 1234567890
        formatted = format_usdc(original)
        parsed = parse_usdc(formatted)
        assert parsed == original


class TestETHFormatting:
    """Test ETH formatting functions (18 decimals)."""

    def test_format_eth_basic(self):
        """Test basic ETH formatting."""
        result = format_eth(1000000000000000000)
        assert result == Decimal("1")

    def test_format_eth_fractional(self):
        """Test fractional ETH formatting."""
        result = format_eth(1500000000000000000)
        assert result == Decimal("1.5")

    def test_parse_eth_basic(self):
        """Test basic ETH parsing."""
        result = parse_eth("1.5")
        assert result == 1500000000000000000

    def test_parse_eth_decimal(self):
        """Test ETH parsing with Decimal."""
        result = parse_eth(Decimal("1.5"))
        assert result == 1500000000000000000


class TestAddressValidation:
    """Test address validation functions."""

    def test_validate_address_valid(self):
        """Test valid Ethereum address."""
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
        assert validate_address(address) is True

    def test_validate_address_lowercase(self):
        """Test lowercase Ethereum address."""
        address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb5"
        assert validate_address(address) is True

    def test_validate_address_invalid(self):
        """Test invalid Ethereum address."""
        assert validate_address("0xinvalid") is False
        assert validate_address("not_an_address") is False
        assert validate_address("") is False

    def test_to_checksum_valid(self):
        """Test checksum conversion."""
        address = "0x742d35cc6634c0532925a3b844bc9e7595f0beb5"
        result = to_checksum(address)
        assert result == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"

    def test_to_checksum_invalid(self):
        """Test checksum conversion with invalid address."""
        with pytest.raises(VarityClientError):
            to_checksum("invalid_address")


class TestGasConversions:
    """Test gas price conversions."""

    def test_wei_to_gwei(self):
        """Test Wei to Gwei conversion."""
        result = wei_to_gwei(1000000000)
        assert result == Decimal("1")

    def test_wei_to_gwei_fractional(self):
        """Test fractional Wei to Gwei conversion."""
        result = wei_to_gwei(1500000000)
        assert result == Decimal("1.5")

    def test_gwei_to_wei(self):
        """Test Gwei to Wei conversion."""
        result = gwei_to_wei(1)
        assert result == 1000000000

    def test_gwei_to_wei_fractional(self):
        """Test fractional Gwei to Wei conversion."""
        result = gwei_to_wei(1.5)
        assert result == 1500000000

    def test_gwei_to_wei_decimal(self):
        """Test Decimal Gwei to Wei conversion."""
        result = gwei_to_wei(Decimal("1.5"))
        assert result == 1500000000

    def test_gas_conversion_roundtrip(self):
        """Test gas conversion roundtrip."""
        original_wei = 2500000000
        gwei = wei_to_gwei(original_wei)
        wei = gwei_to_wei(gwei)
        assert wei == original_wei


class TestTransactionHelpers:
    """Test transaction helper functions."""

    def test_format_transaction_hash_with_prefix(self):
        """Test formatting transaction hash with prefix."""
        tx_hash = "0x1234567890abcdef"
        result = format_transaction_hash(tx_hash)
        assert result == tx_hash

    def test_format_transaction_hash_without_prefix(self):
        """Test formatting transaction hash without prefix."""
        tx_hash = "1234567890abcdef"
        result = format_transaction_hash(tx_hash)
        assert result == "0x1234567890abcdef"

    def test_format_transaction_hash_empty(self):
        """Test formatting empty transaction hash."""
        result = format_transaction_hash("")
        assert result == ""

    def test_short_address(self):
        """Test address shortening."""
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
        result = short_address(address)
        assert result == "0x742d...bEb5"

    def test_short_address_custom_lengths(self):
        """Test address shortening with custom lengths."""
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
        result = short_address(address, prefix_len=8, suffix_len=6)
        assert result == "0x742d35...5f0bEb5"

    def test_short_address_invalid(self):
        """Test shortening invalid address."""
        result = short_address("invalid")
        assert result == "invalid"
