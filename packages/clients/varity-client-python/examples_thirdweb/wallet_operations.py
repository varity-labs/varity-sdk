"""
Wallet Operations Example

Demonstrates wallet management, transactions, and balance queries.
"""

import asyncio
import os
from varity_client import VarityClient


async def main():
    """Wallet operations examples."""
    print("=== Varity Client - Wallet Operations ===\n")

    # Initialize client with wallet
    # IMPORTANT: Use environment variable for private key
    private_key = os.getenv("PRIVATE_KEY") or "0x" + "0" * 64

    client = VarityClient(
        chain_id=33529,  # Varity L3 Testnet
        private_key=private_key,
        thirdweb_client_id="a35636133eb5ec6f30eb9f4c15fce2f3",
    )

    print(f"Connected address: {client.address}\n")

    # 1. Get balance
    print("1. Getting balance...")
    try:
        balance = await client.wallet.get_balance()
        print(f"   Balance: {balance.balance} {balance.symbol}")
        print(f"   Decimals: {balance.decimals}")
        print(f"   Balance (Wei): {balance.balance_wei}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 2. Check another address balance
    print("2. Checking another address balance...")
    other_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
    try:
        other_balance = await client.wallet.get_balance(other_address)
        print(f"   Address: {other_balance.address}")
        print(f"   Balance: {other_balance.balance} {other_balance.symbol}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 3. Sign message
    print("3. Signing message...")
    message = "Hello, Varity L3!"
    try:
        signature = await client.wallet.sign_message(message)
        print(f"   Message: {message}")
        print(f"   Signature: {signature[:20]}...{signature[-10:]}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 4. Send transaction (uncomment to actually send)
    print("4. Preparing transaction (not sending)...")
    recipient = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
    amount = "0.1"  # 0.1 USDC
    print(f"   To: {recipient}")
    print(f"   Amount: {amount} USDC")
    print(f"   (Set SEND_TX=true environment variable to actually send)\n")

    if os.getenv("SEND_TX") == "true":
        try:
            tx_hash = await client.wallet.send_transaction(
                to_address=recipient, amount=amount
            )
            print(f"   Transaction sent: {tx_hash}")

            # Wait for confirmation
            print(f"   Waiting for confirmation...")
            tx = await client.wallet.wait_for_transaction(tx_hash)
            print(f"   Confirmed in block: {tx.block_number}")
            print(f"   Status: {tx.status.value}\n")
        except Exception as e:
            print(f"   Error: {e}\n")

    # 5. Get transaction details
    print("5. Getting transaction details (example)...")
    example_tx_hash = "0x" + "1" * 64
    try:
        tx = await client.wallet.get_transaction(example_tx_hash)
        print(f"   Hash: {tx.hash}")
        print(f"   From: {tx.from_address}")
        print(f"   To: {tx.to_address}")
        print(f"   Value: {tx.value} Wei")
        print(f"   Status: {tx.status.value}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 6. Transaction history
    print("6. Getting transaction history...")
    try:
        history = await client.wallet.get_transaction_history(limit=5)
        if history:
            print(f"   Found {len(history)} transactions")
            for tx in history[:3]:
                print(f"   - {tx.hash}: {tx.value} Wei")
        else:
            print("   No transaction history available")
            print("   (Use indexer services like The Graph for production)\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    print("=== Wallet Operations Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
