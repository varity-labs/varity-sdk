"""
Basic Usage Example

Demonstrates basic initialization and operations with Varity client.
"""

import asyncio
from varity_client import VarityClient


async def main():
    """Basic usage examples."""
    print("=== Varity Client - Basic Usage ===\n")

    # 1. Initialize client (read-only, no private key)
    print("1. Initializing read-only client...")
    client = VarityClient(
        chain_id=33529,  # Varity L3 Testnet
        thirdweb_client_id="a35636133eb5ec6f30eb9f4c15fce2f3",
    )

    print(f"   Chain: {client.chain.name}")
    print(f"   Chain ID: {client.chain_id}")
    print(f"   RPC URL: {client.rpc_url}")
    print(f"   Connected: {client.is_connected()}\n")

    # 2. Get configuration
    print("2. Client configuration:")
    config = client.get_config()
    print(f"   Native currency: {config['native_currency']['symbol']}")
    print(f"   Decimals: {config['native_currency']['decimals']}")
    print(f"   Explorer: {config['explorer_url']}\n")

    # 3. Get current block number
    print("3. Getting current block number...")
    block_number = await client.get_block_number()
    print(f"   Current block: {block_number}\n")

    # 4. Get gas price
    print("4. Getting current gas price...")
    gas_price = await client.get_gas_price()
    print(f"   Gas price: {gas_price} Wei\n")

    # 5. Check balance (any address)
    print("5. Checking balance for address...")
    test_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
    try:
        balance = await client.wallet.get_balance(test_address)
        print(f"   Address: {balance.address}")
        print(f"   Balance: {balance.balance} {balance.symbol}")
        print(f"   Balance (Wei): {balance.balance_wei}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 6. Initialize client with wallet (for transactions)
    print("6. Initializing client with wallet...")
    # IMPORTANT: Never commit private keys to version control!
    # Use environment variables: os.getenv("PRIVATE_KEY")
    private_key = "0x0000000000000000000000000000000000000000000000000000000000000001"

    client_with_wallet = VarityClient(
        chain_id=33529,
        private_key=private_key,
        thirdweb_client_id="a35636133eb5ec6f30eb9f4c15fce2f3",
    )

    print(f"   Connected address: {client_with_wallet.address}\n")

    # 7. Get own balance
    print("7. Getting own balance...")
    try:
        my_balance = await client_with_wallet.wallet.get_balance()
        print(f"   Balance: {my_balance.balance} {my_balance.symbol}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    print("=== Basic Usage Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
