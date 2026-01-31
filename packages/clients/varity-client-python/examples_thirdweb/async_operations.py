"""
Async Operations Example

Demonstrates efficient async/await patterns and parallel operations.
"""

import asyncio
import time
from varity_client import VarityClient


async def main():
    """Async operations examples."""
    print("=== Varity Client - Async Operations ===\n")

    # Initialize client
    client = VarityClient(
        chain_id=33529,
        thirdweb_client_id="acb17e07e34ab2b8317aa40cbb1b5e1d",
    )

    # 1. Sequential operations (slow)
    print("1. Sequential operations (slow)...")
    start_time = time.time()

    try:
        block_number = await client.get_block_number()
        gas_price = await client.get_gas_price()
        balance = await client.wallet.get_balance(
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
        )

        elapsed = time.time() - start_time
        print(f"   Block: {block_number}")
        print(f"   Gas price: {gas_price} Wei")
        print(f"   Balance: {balance.balance} {balance.symbol}")
        print(f"   ⏱️  Time: {elapsed:.2f}s\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 2. Parallel operations (fast)
    print("2. Parallel operations (fast)...")
    start_time = time.time()

    try:
        # Execute all operations concurrently
        results = await asyncio.gather(
            client.get_block_number(),
            client.get_gas_price(),
            client.wallet.get_balance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"),
            return_exceptions=True,
        )

        block_number, gas_price, balance = results

        elapsed = time.time() - start_time
        print(f"   Block: {block_number}")
        print(f"   Gas price: {gas_price} Wei")
        print(f"   Balance: {balance.balance if not isinstance(balance, Exception) else 'Error'}")
        print(f"   ⏱️  Time: {elapsed:.2f}s (faster!)\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 3. Batch balance queries
    print("3. Batch balance queries...")
    addresses = [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
        "0x" + "a" * 40,
        "0x" + "b" * 40,
        "0x" + "c" * 40,
        "0x" + "d" * 40,
    ]

    start_time = time.time()

    try:
        # Query all balances in parallel
        balance_tasks = [client.wallet.get_balance(addr) for addr in addresses]
        balances = await asyncio.gather(*balance_tasks, return_exceptions=True)

        elapsed = time.time() - start_time

        print(f"   Queried {len(addresses)} addresses in {elapsed:.2f}s")
        for addr, bal in zip(addresses, balances):
            if isinstance(bal, Exception):
                print(f"   {addr[:10]}...: Error")
            else:
                print(f"   {addr[:10]}...: {bal.balance} {bal.symbol}")
        print()
    except Exception as e:
        print(f"   Error: {e}\n")

    # 4. Context manager pattern
    print("4. Context manager pattern...")
    try:
        async with asyncio.timeout(10):  # Python 3.11+
            with VarityClient(chain_id=33529) as client_ctx:
                block = await client_ctx.get_block_number()
                print(f"   Block (with context): {block}")
        print()
    except Exception as e:
        # Fallback for Python < 3.11
        with VarityClient(chain_id=33529) as client_ctx:
            block = await client_ctx.get_block_number()
            print(f"   Block (with context): {block}\n")

    # 5. Task cancellation
    print("5. Task cancellation example...")

    async def long_running_task():
        """Simulate long-running operation."""
        print("   Starting long task...")
        await asyncio.sleep(5)
        print("   Task completed!")
        return "result"

    try:
        # Create task with timeout
        task = asyncio.create_task(long_running_task())

        # Cancel after 1 second
        await asyncio.sleep(1)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            print("   ✅ Task cancelled successfully\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 6. Error handling in async operations
    print("6. Error handling in async operations...")

    async def operation_with_error():
        """Simulate operation that might fail."""
        await asyncio.sleep(0.1)
        raise ValueError("Simulated error")

    async def safe_operation():
        """Operation that succeeds."""
        await asyncio.sleep(0.1)
        return "Success!"

    try:
        # Execute multiple operations, some might fail
        results = await asyncio.gather(
            safe_operation(),
            operation_with_error(),
            safe_operation(),
            return_exceptions=True,  # Continue even if some fail
        )

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"   Operation {i + 1}: ❌ Error - {result}")
            else:
                print(f"   Operation {i + 1}: ✅ {result}")
        print()
    except Exception as e:
        print(f"   Error: {e}\n")

    # 7. Rate limiting
    print("7. Rate limiting example...")

    async def rate_limited_operation(semaphore, operation_id):
        """Operation with rate limiting."""
        async with semaphore:
            print(f"   Executing operation {operation_id}...")
            await asyncio.sleep(0.2)
            return f"Result {operation_id}"

    try:
        # Allow only 2 concurrent operations
        semaphore = asyncio.Semaphore(2)

        # Create 5 operations
        tasks = [
            rate_limited_operation(semaphore, i) for i in range(1, 6)
        ]

        # Execute with rate limiting
        results = await asyncio.gather(*tasks)
        print(f"   ✅ Completed {len(results)} operations with rate limiting\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # 8. Best practices
    print("8. Async Best Practices:")
    print("   ✅ Use asyncio.gather() for parallel operations")
    print("   ✅ Use return_exceptions=True to handle errors gracefully")
    print("   ✅ Implement timeouts for operations that might hang")
    print("   ✅ Use semaphores for rate limiting")
    print("   ✅ Always use context managers when available")
    print("   ✅ Handle exceptions properly in async code")
    print("   ✅ Use asyncio.create_task() for fire-and-forget operations\n")

    print("=== Async Operations Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
