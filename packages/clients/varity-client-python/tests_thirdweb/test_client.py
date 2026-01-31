"""
Test suite for VarityClient

Tests client initialization, configuration, and basic operations.
"""

import pytest
import asyncio
from varity_client import VarityClient, VARITY_L3_TESTNET
from varity_client.exceptions import VarityClientError, NetworkError


class TestClientInitialization:
    """Test client initialization."""

    def test_client_init_default(self):
        """Test default client initialization."""
        client = VarityClient()

        assert client.chain_id == 33529
        assert client.chain.name == "Varity L3 Testnet"
        assert client.is_connected()
        assert client.address is None  # No wallet connected

    def test_client_init_with_chain_id(self):
        """Test client initialization with chain ID."""
        client = VarityClient(chain_id=421614)  # Arbitrum Sepolia

        assert client.chain_id == 421614
        assert client.chain.name == "Arbitrum Sepolia"

    def test_client_init_with_chain(self):
        """Test client initialization with chain object."""
        client = VarityClient(chain=VARITY_L3_TESTNET)

        assert client.chain_id == 33529
        assert client.chain == VARITY_L3_TESTNET

    def test_client_init_with_private_key(self):
        """Test client initialization with private key."""
        private_key = "0x" + "1" * 64
        client = VarityClient(private_key=private_key)

        assert client.account is not None
        assert client.address is not None
        assert len(client.address) == 42  # Ethereum address format

    def test_client_init_invalid_private_key(self):
        """Test client initialization with invalid private key."""
        with pytest.raises(VarityClientError):
            VarityClient(private_key="invalid_key")

    def test_client_context_manager(self):
        """Test client as context manager."""
        with VarityClient() as client:
            assert client.is_connected()
            assert client.chain_id == 33529


class TestClientConfiguration:
    """Test client configuration."""

    def test_get_config(self):
        """Test get_config method."""
        client = VarityClient()
        config = client.get_config()

        assert "chain_id" in config
        assert "chain_name" in config
        assert "rpc_url" in config
        assert "native_currency" in config
        assert config["chain_id"] == 33529
        assert config["native_currency"]["symbol"] == "USDC"
        assert config["native_currency"]["decimals"] == 6

    def test_custom_rpc_url(self):
        """Test custom RPC URL."""
        custom_rpc = "https://custom-rpc.example.com"
        client = VarityClient(rpc_url=custom_rpc)

        assert client.rpc_url == custom_rpc

    def test_custom_thirdweb_client_id(self):
        """Test custom Thirdweb client ID."""
        custom_id = "custom_client_id_123"
        client = VarityClient(thirdweb_client_id=custom_id)

        assert client.thirdweb_client_id == custom_id


class TestClientOperations:
    """Test client operations."""

    @pytest.mark.asyncio
    async def test_get_block_number(self):
        """Test getting current block number."""
        client = VarityClient()
        block_number = await client.get_block_number()

        assert isinstance(block_number, int)
        assert block_number > 0

    @pytest.mark.asyncio
    async def test_get_gas_price(self):
        """Test getting current gas price."""
        client = VarityClient()
        gas_price = await client.get_gas_price()

        assert isinstance(gas_price, int)
        assert gas_price > 0

    def test_is_connected(self):
        """Test is_connected method."""
        client = VarityClient()
        assert client.is_connected() is True


class TestClientProperties:
    """Test client properties."""

    def test_address_property_no_wallet(self):
        """Test address property without wallet."""
        client = VarityClient()
        assert client.address is None

    def test_address_property_with_wallet(self):
        """Test address property with wallet."""
        private_key = "0x" + "1" * 64
        client = VarityClient(private_key=private_key)

        assert client.address is not None
        assert isinstance(client.address, str)
        assert client.address.startswith("0x")

    def test_chain_id_property(self):
        """Test chain_id property."""
        client = VarityClient()
        assert client.chain_id == 33529
        assert client.chain_id == client.chain.chain_id

    def test_repr(self):
        """Test string representation."""
        client = VarityClient()
        repr_str = repr(client)

        assert "VarityClient" in repr_str
        assert "chain_id=33529" in repr_str
        assert "Varity L3 Testnet" in repr_str
