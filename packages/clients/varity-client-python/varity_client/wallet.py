"""
Wallet Operations Module

Wallet management, transactions, and balance operations.
"""

import asyncio
from decimal import Decimal
from typing import List, Optional, Dict, Any
from eth_account import Account
from eth_account.messages import encode_defunct

from .types import Balance, Transaction, TransactionStatus, TransactionHash
from .exceptions import WalletError
from .utils import (
    validate_address,
    to_checksum,
    format_usdc,
    parse_usdc,
    format_eth,
)


class WalletManager:
    """
    Manager for wallet operations.

    Handles wallet connections, balance queries, and transactions.
    """

    def __init__(self, client):
        """
        Initialize wallet manager.

        Args:
            client: VarityClient instance
        """
        self.client = client
        self.w3 = client.w3

    async def connect_wallet(self, private_key: str) -> str:
        """
        Connect wallet using private key.

        Args:
            private_key: Private key (hex string with or without 0x prefix)

        Returns:
            Wallet address

        Example:
            >>> address = await client.wallet.connect_wallet("0x...")
            >>> print(f"Connected: {address}")
        """
        try:
            self.client.account = Account.from_key(private_key)
            return self.client.account.address
        except Exception as e:
            raise WalletError(f"Failed to connect wallet: {str(e)}") from e

    async def get_balance(
        self, address: Optional[str] = None, block: str = "latest"
    ) -> Balance:
        """
        Get account balance.

        For Varity L3, this returns USDC balance (6 decimals).
        For other chains, returns ETH balance (18 decimals).

        Args:
            address: Account address (uses connected account if None)
            block: Block number or "latest"

        Returns:
            Balance object with formatted balance

        Example:
            >>> balance = await client.wallet.get_balance()
            >>> print(f"Balance: {balance.balance} {balance.symbol}")
        """
        if address is None:
            if not self.client.account:
                raise WalletError("No address provided and no account connected")
            address = self.client.account.address

        if not validate_address(address):
            raise WalletError(f"Invalid address: {address}")

        try:
            address = to_checksum(address)

            # Get balance in Wei
            balance_wei = await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.get_balance, address, block
            )

            # Format based on chain
            if self.client.chain.native_currency_decimals == 6:
                # USDC (6 decimals)
                balance_decimal = format_usdc(balance_wei)
                symbol = "USDC"
                decimals = 6
            else:
                # ETH (18 decimals)
                balance_decimal = format_eth(balance_wei)
                symbol = "ETH"
                decimals = 18

            return Balance(
                address=address,
                balance=balance_decimal,
                balance_wei=balance_wei,
                symbol=symbol,
                decimals=decimals,
            )
        except Exception as e:
            raise WalletError(f"Failed to get balance: {str(e)}") from e

    async def send_transaction(
        self,
        to_address: str,
        amount: str,
        gas: Optional[int] = None,
        gas_price: Optional[int] = None,
        data: str = "0x",
    ) -> TransactionHash:
        """
        Send transaction to another address.

        Args:
            to_address: Recipient address
            amount: Amount to send (human-readable, e.g., "1.5" for 1.5 USDC/ETH)
            gas: Gas limit (optional, auto-estimate if not provided)
            gas_price: Gas price in Wei (optional, uses network price if not provided)
            data: Transaction data (hex string, default: "0x")

        Returns:
            Transaction hash

        Example:
            >>> # Send 1.5 USDC
            >>> tx_hash = await client.wallet.send_transaction(
            ...     to_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
            ...     amount="1.5"
            ... )
            >>> print(f"Transaction: {tx_hash}")
        """
        if not self.client.account:
            raise WalletError("No account connected. Provide private_key to client.")

        if not validate_address(to_address):
            raise WalletError(f"Invalid recipient address: {to_address}")

        try:
            to_address = to_checksum(to_address)

            # Parse amount based on chain
            if self.client.chain.native_currency_decimals == 6:
                value_wei = parse_usdc(amount)
            else:
                from .utils import parse_eth
                value_wei = parse_eth(amount)

            # Get gas price if not provided
            if gas_price is None:
                gas_price = await self.client.get_gas_price()

            # Get nonce
            nonce = await asyncio.get_event_loop().run_in_executor(
                None,
                self.w3.eth.get_transaction_count,
                self.client.account.address,
            )

            # Build transaction
            transaction = {
                "to": to_address,
                "value": value_wei,
                "gas": gas or 21000,  # Standard gas for simple transfer
                "gasPrice": gas_price,
                "nonce": nonce,
                "data": data,
                "chainId": self.client.chain_id,
            }

            # Sign transaction
            signed_txn = self.client.account.sign_transaction(transaction)

            # Send transaction
            tx_hash = await asyncio.get_event_loop().run_in_executor(
                None,
                self.w3.eth.send_raw_transaction,
                signed_txn.rawTransaction,
            )

            return tx_hash.hex()
        except Exception as e:
            raise WalletError(f"Failed to send transaction: {str(e)}") from e

    async def sign_message(self, message: str) -> str:
        """
        Sign arbitrary message with connected wallet.

        Args:
            message: Message to sign (plain text)

        Returns:
            Signature (hex string)

        Example:
            >>> signature = await client.wallet.sign_message("Hello, Varity!")
            >>> print(f"Signature: {signature}")
        """
        if not self.client.account:
            raise WalletError("No account connected. Provide private_key to client.")

        try:
            # Encode message
            encoded_message = encode_defunct(text=message)

            # Sign message
            signed_message = self.client.account.sign_message(encoded_message)

            return signed_message.signature.hex()
        except Exception as e:
            raise WalletError(f"Failed to sign message: {str(e)}") from e

    async def get_transaction(self, tx_hash: str) -> Transaction:
        """
        Get transaction details.

        Args:
            tx_hash: Transaction hash

        Returns:
            Transaction object with details

        Example:
            >>> tx = await client.wallet.get_transaction("0x...")
            >>> print(f"Status: {tx.status}")
        """
        try:
            # Get transaction
            tx = await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.get_transaction, tx_hash
            )

            # Get transaction receipt (may not exist if pending)
            try:
                receipt = await asyncio.get_event_loop().run_in_executor(
                    None, self.w3.eth.get_transaction_receipt, tx_hash
                )
                status = (
                    TransactionStatus.CONFIRMED
                    if receipt["status"] == 1
                    else TransactionStatus.FAILED
                )
                block_number = receipt["blockNumber"]
            except Exception:
                status = TransactionStatus.PENDING
                block_number = None

            return Transaction(
                hash=tx_hash,
                from_address=tx["from"],
                to_address=tx["to"] or "",
                value=tx["value"],
                gas=tx["gas"],
                gas_price=tx["gasPrice"],
                nonce=tx["nonce"],
                data=tx["input"],
                status=status,
                block_number=block_number,
            )
        except Exception as e:
            raise WalletError(f"Failed to get transaction: {str(e)}") from e

    async def get_transaction_history(
        self,
        address: Optional[str] = None,
        start_block: int = 0,
        end_block: int = None,
        limit: int = 100,
    ) -> List[Transaction]:
        """
        Get transaction history for address.

        Note: This is a simplified implementation. For production,
        use indexer services like The Graph or Etherscan API.

        Args:
            address: Account address (uses connected account if None)
            start_block: Starting block number
            end_block: Ending block number (None = latest)
            limit: Maximum number of transactions to return

        Returns:
            List of Transaction objects

        Example:
            >>> history = await client.wallet.get_transaction_history(limit=10)
            >>> for tx in history:
            ...     print(f"{tx.hash}: {tx.value} Wei")
        """
        if address is None:
            if not self.client.account:
                raise WalletError("No address provided and no account connected")
            address = self.client.account.address

        if not validate_address(address):
            raise WalletError(f"Invalid address: {address}")

        address = to_checksum(address)

        # Note: This is a placeholder implementation
        # In production, you would use:
        # 1. The Graph protocol for indexed blockchain data
        # 2. Etherscan/Arbiscan API
        # 3. Your own indexer service

        # For now, return empty list
        # Implementing full transaction history requires either:
        # - Scanning all blocks (very slow and not recommended)
        # - Using external indexer services
        return []

    async def wait_for_transaction(
        self, tx_hash: str, timeout: int = 120
    ) -> Transaction:
        """
        Wait for transaction to be confirmed.

        Args:
            tx_hash: Transaction hash
            timeout: Timeout in seconds (default: 120)

        Returns:
            Transaction object with confirmed status

        Example:
            >>> tx_hash = await client.wallet.send_transaction(...)
            >>> tx = await client.wallet.wait_for_transaction(tx_hash)
            >>> print(f"Confirmed in block: {tx.block_number}")
        """
        try:
            # Wait for transaction receipt
            receipt = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.w3.eth.wait_for_transaction_receipt(
                    tx_hash, timeout=timeout
                ),
            )

            # Get full transaction
            return await self.get_transaction(tx_hash)
        except Exception as e:
            raise WalletError(
                f"Failed to wait for transaction: {str(e)}"
            ) from e
