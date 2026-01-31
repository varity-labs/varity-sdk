"""
Contract Interaction Example

Demonstrates smart contract deployment and interaction.
"""

import asyncio
import os
from varity_client import VarityClient
from varity_client.types import ContractType


async def main():
    """Contract interaction examples."""
    print("=== Varity Client - Contract Interaction ===\n")

    # Initialize client with wallet
    private_key = os.getenv("PRIVATE_KEY") or "0x" + "0" * 64

    client = VarityClient(
        chain_id=33529,
        private_key=private_key,
        thirdweb_client_id="acb17e07e34ab2b8317aa40cbb1b5e1d",
    )

    print(f"Connected address: {client.address}\n")

    # 1. Deploy ERC20 token contract
    print("1. Deploying ERC20 token contract...")
    print("   (This is a simulation - replace with actual deployment)\n")

    try:
        contract_deployment = await client.contracts.deploy_contract(
            contract_type=ContractType.ERC20,
            name="MyToken",
            symbol="MTK",
            initial_supply="1000000",  # 1 million tokens
        )

        print(f"   Contract deployed!")
        print(f"   Address: {contract_deployment.address}")
        print(f"   Transaction: {contract_deployment.transaction_hash}")
        print(f"   Block: {contract_deployment.block_number}")
        print(f"   Type: {contract_deployment.contract_type.value}\n")

        contract_address = contract_deployment.address
    except Exception as e:
        print(f"   Error: {e}\n")
        # Use example address for demonstration
        contract_address = "0x" + "a" * 40

    # 2. Get contract instance
    print("2. Getting contract instance...")
    try:
        contract = await client.contracts.get_contract(contract_address)
        print(f"   Contract loaded at: {contract.address}\n")
    except Exception as e:
        print(f"   Error: {e}\n")
        return

    # 3. Read contract data (view functions)
    print("3. Reading contract data...")

    # Read token name
    print("   Reading token name...")
    try:
        name = await client.contracts.read_contract(contract, "name")
        print(f"   Name: {name}")
    except Exception as e:
        print(f"   Error reading name: {e}")

    # Read token symbol
    print("   Reading token symbol...")
    try:
        symbol = await client.contracts.read_contract(contract, "symbol")
        print(f"   Symbol: {symbol}")
    except Exception as e:
        print(f"   Error reading symbol: {e}")

    # Read total supply
    print("   Reading total supply...")
    try:
        total_supply = await client.contracts.read_contract(contract, "totalSupply")
        print(f"   Total Supply: {total_supply}\n")
    except Exception as e:
        print(f"   Error reading totalSupply: {e}\n")

    # 4. Read token balance
    print("4. Reading token balance...")
    try:
        balance = await client.contracts.read_contract(
            contract, "balanceOf", client.address
        )
        print(f"   Balance of {client.address[:10]}...: {balance}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 5. Write to contract (state-changing functions)
    print("5. Preparing token transfer (not sending)...")
    recipient = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
    transfer_amount = 1000000  # 1 token (assuming 6 decimals)

    print(f"   To: {recipient}")
    print(f"   Amount: {transfer_amount}")
    print(f"   (Set SEND_TX=true environment variable to actually send)\n")

    if os.getenv("SEND_TX") == "true":
        try:
            tx_hash = await client.contracts.write_contract(
                contract, "transfer", recipient, transfer_amount
            )
            print(f"   Transaction sent: {tx_hash}")

            # Wait for confirmation
            print(f"   Waiting for confirmation...")
            tx = await client.wallet.wait_for_transaction(tx_hash)
            print(f"   Confirmed in block: {tx.block_number}\n")
        except Exception as e:
            print(f"   Error: {e}\n")

    # 6. Watch contract events
    print("6. Watching contract events (last 100 blocks)...")
    try:
        current_block = await client.get_block_number()
        from_block = max(0, current_block - 100)

        events = await client.contracts.watch_events(
            contract, "Transfer", from_block=from_block
        )

        if events:
            print(f"   Found {len(events)} Transfer events")
            for event in events[:3]:  # Show first 3
                print(f"   - Block {event['blockNumber']}: {event['args']}")
        else:
            print("   No Transfer events found in last 100 blocks")
        print()
    except Exception as e:
        print(f"   Error: {e}\n")

    # 7. Deploy custom contract (example structure)
    print("7. Custom contract deployment (placeholder)...")
    print("   For custom contracts, provide:")
    print("   - ABI (JSON or dict)")
    print("   - Bytecode (hex string)")
    print("   - Constructor arguments\n")

    print("   Example:")
    print("   contract = await client.contracts.deploy_contract(")
    print("       contract_type=ContractType.CUSTOM,")
    print("       abi=my_abi,")
    print("       bytecode=my_bytecode,")
    print("       constructor_args=[arg1, arg2]")
    print("   )\n")

    print("=== Contract Interaction Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
