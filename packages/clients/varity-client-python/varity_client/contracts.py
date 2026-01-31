"""
Contract Operations Module

Smart contract deployment and interaction functionality.
"""

import asyncio
import json
from typing import Any, Dict, List, Optional, Union
from web3 import Web3
from web3.contract import Contract
from eth_account.signers.local import LocalAccount

from .types import ContractDeployment, ContractType, ContractFunction
from .exceptions import ContractError
from .utils import validate_address, to_checksum


# Standard ERC20 ABI (minimal for demo)
ERC20_ABI = json.dumps([
    {
        "constant": True,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [
            {"name": "recipient", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
])


class ContractManager:
    """
    Manager for smart contract operations.

    Handles contract deployment, reading, and writing operations.
    """

    def __init__(self, client):
        """
        Initialize contract manager.

        Args:
            client: VarityClient instance
        """
        self.client = client
        self.w3 = client.w3

    async def deploy_contract(
        self,
        contract_type: Union[str, ContractType],
        abi: Optional[Union[str, List[Dict]]] = None,
        bytecode: Optional[str] = None,
        constructor_args: Optional[List[Any]] = None,
        **kwargs
    ) -> ContractDeployment:
        """
        Deploy a smart contract to the blockchain.

        Args:
            contract_type: Type of contract (ERC20, ERC721, ERC1155, CUSTOM)
            abi: Contract ABI (JSON string or list of dicts)
            bytecode: Contract bytecode (hex string)
            constructor_args: Constructor arguments
            **kwargs: Additional arguments (name, symbol, initial_supply, etc.)

        Returns:
            ContractDeployment with deployment details

        Raises:
            ContractError: If deployment fails

        Example:
            >>> # Deploy ERC20 token
            >>> contract = await client.contracts.deploy_contract(
            ...     contract_type="ERC20",
            ...     name="MyToken",
            ...     symbol="MTK",
            ...     initial_supply="1000000"
            ... )
            >>> print(f"Token deployed at: {contract.address}")
        """
        if not self.client.account:
            raise ContractError("No account configured. Provide private_key to client.")

        # Convert contract_type to enum
        if isinstance(contract_type, str):
            try:
                contract_type = ContractType(contract_type.upper())
            except ValueError:
                raise ContractError(f"Invalid contract type: {contract_type}")

        # For demo purposes, we'll simulate deployment
        # In production, you would compile contracts and deploy them
        if contract_type == ContractType.ERC20:
            return await self._deploy_erc20(
                name=kwargs.get("name", "Token"),
                symbol=kwargs.get("symbol", "TKN"),
                initial_supply=kwargs.get("initial_supply", "1000000"),
            )
        elif contract_type == ContractType.CUSTOM:
            if not abi or not bytecode:
                raise ContractError("Custom contracts require abi and bytecode")
            return await self._deploy_custom(abi, bytecode, constructor_args or [])
        else:
            raise ContractError(f"Contract type {contract_type} not yet implemented")

    async def _deploy_erc20(
        self, name: str, symbol: str, initial_supply: str
    ) -> ContractDeployment:
        """
        Deploy ERC20 token contract.

        This is a simplified implementation for demonstration.
        In production, you would use actual compiled contract bytecode.
        """
        try:
            # In production, you would:
            # 1. Load compiled contract (ABI + bytecode)
            # 2. Create contract factory
            # 3. Build deployment transaction
            # 4. Sign and send transaction
            # 5. Wait for receipt

            # For now, simulate deployment
            # This would be replaced with actual Web3 deployment
            tx_hash = "0x" + "0" * 64  # Simulated transaction hash
            contract_address = "0x" + "a" * 40  # Simulated contract address

            return ContractDeployment(
                address=contract_address,
                transaction_hash=tx_hash,
                contract_type=ContractType.ERC20,
                block_number=await self._get_block_number(),
                deployer=self.client.address,
            )
        except Exception as e:
            raise ContractError(f"Failed to deploy ERC20 contract: {str(e)}") from e

    async def _deploy_custom(
        self, abi: Union[str, List[Dict]], bytecode: str, constructor_args: List[Any]
    ) -> ContractDeployment:
        """Deploy custom contract with provided ABI and bytecode."""
        try:
            # Parse ABI if string
            if isinstance(abi, str):
                abi = json.loads(abi)

            # Create contract factory
            Contract_Factory = self.w3.eth.contract(abi=abi, bytecode=bytecode)

            # Build constructor transaction
            construct_txn = Contract_Factory.constructor(*constructor_args).build_transaction(
                {
                    "from": self.client.address,
                    "nonce": await self._get_nonce(),
                    "gas": 2000000,
                    "gasPrice": await self._get_gas_price(),
                }
            )

            # Sign transaction
            signed_txn = self.client.account.sign_transaction(construct_txn)

            # Send transaction
            tx_hash = await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.send_raw_transaction, signed_txn.rawTransaction
            )

            # Wait for receipt
            receipt = await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.wait_for_transaction_receipt, tx_hash
            )

            return ContractDeployment(
                address=receipt["contractAddress"],
                transaction_hash=tx_hash.hex(),
                contract_type=ContractType.CUSTOM,
                block_number=receipt["blockNumber"],
                deployer=self.client.address,
            )
        except Exception as e:
            raise ContractError(f"Failed to deploy custom contract: {str(e)}") from e

    async def get_contract(
        self, address: str, abi: Optional[Union[str, List[Dict]]] = None
    ) -> Contract:
        """
        Get contract instance for interaction.

        Args:
            address: Contract address
            abi: Contract ABI (optional, uses ERC20 ABI as default)

        Returns:
            Web3 Contract instance

        Example:
            >>> contract = await client.contracts.get_contract("0x...")
            >>> name = await client.contracts.read_contract(contract, "name")
        """
        if not validate_address(address):
            raise ContractError(f"Invalid contract address: {address}")

        # Use ERC20 ABI as default
        if abi is None:
            abi = json.loads(ERC20_ABI)
        elif isinstance(abi, str):
            abi = json.loads(abi)

        try:
            return self.w3.eth.contract(address=to_checksum(address), abi=abi)
        except Exception as e:
            raise ContractError(f"Failed to load contract: {str(e)}") from e

    async def read_contract(
        self, contract: Union[Contract, str], function_name: str, *args
    ) -> Any:
        """
        Read data from smart contract (view/pure function).

        Args:
            contract: Contract instance or address
            function_name: Name of function to call
            *args: Function arguments

        Returns:
            Function return value

        Example:
            >>> # Get ERC20 token balance
            >>> balance = await client.contracts.read_contract(
            ...     "0x...",
            ...     "balanceOf",
            ...     "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
            ... )
        """
        if isinstance(contract, str):
            contract = await self.get_contract(contract)

        try:
            function = getattr(contract.functions, function_name)
            return await asyncio.get_event_loop().run_in_executor(
                None, function(*args).call
            )
        except Exception as e:
            raise ContractError(
                f"Failed to read contract function {function_name}: {str(e)}"
            ) from e

    async def write_contract(
        self,
        contract: Union[Contract, str],
        function_name: str,
        *args,
        value: int = 0,
        gas: Optional[int] = None
    ) -> str:
        """
        Write to smart contract (state-changing function).

        Args:
            contract: Contract instance or address
            function_name: Name of function to call
            *args: Function arguments
            value: ETH/USDC value to send (in Wei)
            gas: Gas limit (optional)

        Returns:
            Transaction hash

        Example:
            >>> # Transfer ERC20 tokens
            >>> tx_hash = await client.contracts.write_contract(
            ...     "0x...",
            ...     "transfer",
            ...     "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
            ...     1000000  # 1 USDC (6 decimals)
            ... )
        """
        if not self.client.account:
            raise ContractError("No account configured. Provide private_key to client.")

        if isinstance(contract, str):
            contract = await self.get_contract(contract)

        try:
            function = getattr(contract.functions, function_name)

            # Build transaction
            txn = function(*args).build_transaction(
                {
                    "from": self.client.address,
                    "nonce": await self._get_nonce(),
                    "gas": gas or 200000,
                    "gasPrice": await self._get_gas_price(),
                    "value": value,
                }
            )

            # Sign transaction
            signed_txn = self.client.account.sign_transaction(txn)

            # Send transaction
            tx_hash = await asyncio.get_event_loop().run_in_executor(
                None, self.w3.eth.send_raw_transaction, signed_txn.rawTransaction
            )

            return tx_hash.hex()
        except Exception as e:
            raise ContractError(
                f"Failed to write contract function {function_name}: {str(e)}"
            ) from e

    async def watch_events(
        self,
        contract: Union[Contract, str],
        event_name: str,
        from_block: int = 0,
        to_block: Union[int, str] = "latest",
    ) -> List[Dict[str, Any]]:
        """
        Watch contract events.

        Args:
            contract: Contract instance or address
            event_name: Name of event to watch
            from_block: Starting block number
            to_block: Ending block number or "latest"

        Returns:
            List of event logs

        Example:
            >>> # Watch ERC20 Transfer events
            >>> events = await client.contracts.watch_events(
            ...     "0x...",
            ...     "Transfer",
            ...     from_block=1000000
            ... )
        """
        if isinstance(contract, str):
            contract = await self.get_contract(contract)

        try:
            event = getattr(contract.events, event_name)
            return await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: event.create_filter(
                    fromBlock=from_block, toBlock=to_block
                ).get_all_entries()
            )
        except Exception as e:
            raise ContractError(
                f"Failed to watch event {event_name}: {str(e)}"
            ) from e

    async def _get_nonce(self) -> int:
        """Get transaction nonce for current account."""
        return await asyncio.get_event_loop().run_in_executor(
            None, self.w3.eth.get_transaction_count, self.client.address
        )

    async def _get_gas_price(self) -> int:
        """Get current gas price."""
        return await self.client.get_gas_price()

    async def _get_block_number(self) -> int:
        """Get current block number."""
        return await self.client.get_block_number()
