## Varity Thirdweb Python Client

Comprehensive Python client library for Varity L3 blockchain with full support for smart contract operations, wallet management, SIWE authentication, and IPFS storage.

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chain ID](https://img.shields.io/badge/chain-33529-purple.svg)](https://varity-l3-testnet.explorer.caldera.xyz)

---

## Features

- ✅ **Smart Contract Operations**: Deploy and interact with ERC20, ERC721, ERC1155, and custom contracts
- ✅ **Wallet Management**: Full wallet operations with USDC (6 decimals) support
- ✅ **SIWE Authentication**: Complete Sign-In with Ethereum implementation
- ✅ **IPFS Storage**: Decentralized file storage via Thirdweb gateway
- ✅ **Async/Await**: Fully asynchronous operations for optimal performance
- ✅ **Type Hints**: Complete type annotations for better IDE support
- ✅ **Python 3.8+**: Compatible with Python 3.8 through 3.12
- ✅ **USDC Native Gas**: Support for USDC as native gas token (6 decimals)

---

## Installation

```bash
pip install varity-thirdweb-client
```

### Development Installation

```bash
git clone https://github.com/varity/client-python.git
cd client-python
pip install -e ".[dev]"
```

---

## Quick Start

```python
import asyncio
from varity_client import VarityClient

async def main():
    # Initialize client
    client = VarityClient(
        chain_id=33529,  # Varity L3 Testnet
        private_key="0x...",  # Optional, for write operations
        thirdweb_client_id="acb17e07e34ab2b8317aa40cbb1b5e1d"
    )

    # Get balance (returns Decimal with 6 decimal places for USDC)
    balance = await client.wallet.get_balance("0x...")
    print(f"Balance: {balance.balance} {balance.symbol}")

    # Deploy smart contract
    contract = await client.contracts.deploy_contract(
        contract_type="ERC20",
        name="MyToken",
        symbol="MTK",
        initial_supply="1000000"
    )
    print(f"Contract deployed at: {contract.address}")

    # Authenticate with SIWE
    session = await client.auth.authenticate(
        domain="app.varity.io",
        uri="https://app.varity.io"
    )
    print(f"Authenticated: {session.address}")
    print(f"Token: {session.token}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Network Configuration

### Varity L3 Testnet (Default)

```python
from varity_client import VarityClient, VARITY_L3_TESTNET

client = VarityClient()  # Uses Varity L3 Testnet by default

# Or explicitly:
client = VarityClient(chain=VARITY_L3_TESTNET)
```

**Network Details:**
- **Chain ID**: 33529
- **RPC URL**: https://varity-l3-testnet.rpc.caldera.xyz/http
- **Explorer**: https://varity-l3-testnet.explorer.caldera.xyz
- **Native Currency**: USDC (6 decimals)

### Arbitrum Sepolia

```python
from varity_client import VarityClient, ARBITRUM_SEPOLIA

client = VarityClient(chain=ARBITRUM_SEPOLIA)
```

---

## API Reference

### Client Initialization

```python
from varity_client import VarityClient

client = VarityClient(
    chain_id=33529,                                    # Network chain ID
    chain=None,                                         # Custom chain config
    private_key="0x...",                               # Private key (optional)
    thirdweb_client_id="acb17e07e34ab2b8317aa40cbb1b5e1d",  # Thirdweb client ID
    rpc_url=None,                                      # Custom RPC URL
    ipfs_gateway="https://gateway.ipfscdn.io/ipfs/"   # IPFS gateway
)
```

### Wallet Operations

#### Get Balance

```python
# Get USDC balance (returns Decimal with 6 decimals)
balance = await client.wallet.get_balance("0x...")

print(f"Balance: {balance.balance} {balance.symbol}")
print(f"Balance (Wei): {balance.balance_wei}")
print(f"Decimals: {balance.decimals}")  # 6 for USDC
```

#### Send Transaction

```python
# Send 1.5 USDC
tx_hash = await client.wallet.send_transaction(
    to_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
    amount="1.5",  # Human-readable amount
    gas=21000,     # Optional
    gas_price=None # Optional, uses network price if not provided
)

print(f"Transaction: {tx_hash}")

# Wait for confirmation
tx = await client.wallet.wait_for_transaction(tx_hash)
print(f"Confirmed in block: {tx.block_number}")
```

#### Sign Message

```python
signature = await client.wallet.sign_message("Hello, Varity!")
print(f"Signature: {signature}")
```

#### Get Transaction Details

```python
tx = await client.wallet.get_transaction("0x...")
print(f"From: {tx.from_address}")
print(f"To: {tx.to_address}")
print(f"Value: {tx.value} Wei")
print(f"Status: {tx.status}")
```

### Smart Contract Operations

#### Deploy Contract

```python
from varity_client.types import ContractType

# Deploy ERC20 token
contract = await client.contracts.deploy_contract(
    contract_type=ContractType.ERC20,
    name="MyToken",
    symbol="MTK",
    initial_supply="1000000"
)

print(f"Contract: {contract.address}")
print(f"Transaction: {contract.transaction_hash}")
print(f"Block: {contract.block_number}")
```

#### Deploy Custom Contract

```python
# Deploy custom contract with ABI and bytecode
contract = await client.contracts.deploy_contract(
    contract_type=ContractType.CUSTOM,
    abi=my_contract_abi,      # JSON or dict
    bytecode=my_bytecode,      # Hex string
    constructor_args=[arg1, arg2]
)
```

#### Read Contract

```python
# Get contract instance
contract = await client.contracts.get_contract("0x...")

# Read data (view/pure functions)
name = await client.contracts.read_contract(contract, "name")
symbol = await client.contracts.read_contract(contract, "symbol")
balance = await client.contracts.read_contract(
    contract,
    "balanceOf",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
)

print(f"Token: {name} ({symbol})")
print(f"Balance: {balance}")
```

#### Write Contract

```python
# Execute state-changing functions
tx_hash = await client.contracts.write_contract(
    contract,
    "transfer",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",  # recipient
    1000000,                                          # amount (1 USDC in Wei)
    gas=200000                                        # optional gas limit
)

print(f"Transaction: {tx_hash}")
```

#### Watch Events

```python
# Watch contract events
events = await client.contracts.watch_events(
    contract,
    "Transfer",
    from_block=1000000,
    to_block="latest"
)

for event in events:
    print(f"Transfer: {event['args']}")
```

### SIWE Authentication

#### Complete Flow (All-in-One)

```python
# Authenticate with one call
session = await client.auth.authenticate(
    domain="app.varity.io",
    uri="https://app.varity.io",
    statement="Sign in to Varity Dashboard",
    session_duration_minutes=1440  # 24 hours
)

print(f"Authenticated: {session.address}")
print(f"Token: {session.token}")
print(f"Expires: {session.expires_at}")
```

#### Step-by-Step Flow

```python
# 1. Generate SIWE message
message = await client.auth.generate_siwe_message(
    domain="app.varity.io",
    uri="https://app.varity.io",
    statement="Sign in to Varity",
    expiration_minutes=60
)

# 2. Sign message
signature = await client.auth.sign_siwe_message(message)

# 3. Verify signature
is_valid = await client.auth.verify_siwe_signature(message, signature)

# 4. Create session
if is_valid:
    session = await client.auth.create_session(message, signature)
    print(f"Token: {session.token}")
```

### IPFS Storage Operations

#### Upload to IPFS

```python
# Upload string
result = await client.storage.upload_to_ipfs(
    content="Hello, IPFS!",
    filename="hello.txt",
    pin=True
)

print(f"CID: {result.cid}")
print(f"URL: {result.gateway_url}")
print(f"Size: {result.size} bytes")
```

#### Upload File

```python
# Upload file from filesystem
result = await client.storage.upload_file(
    file_path="/path/to/file.pdf",
    pin=True
)

print(f"Uploaded: {result.cid}")
print(f"Gateway URL: {result.gateway_url}")
```

#### Upload JSON

```python
# Upload JSON metadata (e.g., for NFTs)
metadata = {
    "name": "My NFT",
    "description": "NFT on Varity L3",
    "image": "ipfs://Qm...",
    "attributes": [
        {"trait_type": "Rarity", "value": "Legendary"}
    ]
}

result = await client.storage.upload_json(metadata, pin=True)
print(f"Metadata CID: {result.cid}")
print(f"Use URI: ipfs://{result.cid}")
```

#### Download from IPFS

```python
# Download to memory
content = await client.storage.download_from_ipfs("Qm...")
print(content.decode('utf-8'))

# Download to file
await client.storage.download_from_ipfs(
    "Qm...",
    output_path="/path/to/save/file.pdf"
)

# Download JSON
data = await client.storage.download_json("Qm...")
print(data["name"])
```

### Utility Functions

#### USDC Formatting (6 Decimals)

```python
from varity_client.utils import format_usdc, parse_usdc
from decimal import Decimal

# Format USDC from Wei to human-readable
amount = format_usdc(1500000)
print(amount)  # Decimal('1.500000')

# Parse USDC from human-readable to Wei
wei = parse_usdc("1.5")
print(wei)  # 1500000
```

#### Address Validation

```python
from varity_client.utils import validate_address, to_checksum, short_address

# Validate address
is_valid = validate_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5")
print(is_valid)  # True

# Convert to checksum format
checksum_addr = to_checksum("0x742d35cc6634c0532925a3b844bc9e7595f0beb5")
print(checksum_addr)  # 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5

# Shorten address for display
short = short_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5")
print(short)  # 0x742d...bEb5
```

#### Gas Conversions

```python
from varity_client.utils import wei_to_gwei, gwei_to_wei

# Convert Wei to Gwei
gwei = wei_to_gwei(1000000000)
print(gwei)  # Decimal('1')

# Convert Gwei to Wei
wei = gwei_to_wei(1.5)
print(wei)  # 1500000000
```

---

## Async/Await Patterns

### Parallel Operations

```python
import asyncio

# Execute operations in parallel
results = await asyncio.gather(
    client.get_block_number(),
    client.get_gas_price(),
    client.wallet.get_balance("0x..."),
    return_exceptions=True
)

block_number, gas_price, balance = results
```

### Batch Balance Queries

```python
addresses = ["0x...", "0x...", "0x..."]

# Query all balances in parallel
balance_tasks = [client.wallet.get_balance(addr) for addr in addresses]
balances = await asyncio.gather(*balance_tasks)

for addr, bal in zip(addresses, balances):
    print(f"{addr}: {bal.balance} USDC")
```

### Rate Limiting

```python
async def rate_limited_operation(semaphore, address):
    async with semaphore:
        return await client.wallet.get_balance(address)

# Allow only 5 concurrent operations
semaphore = asyncio.Semaphore(5)
tasks = [rate_limited_operation(semaphore, addr) for addr in addresses]
results = await asyncio.gather(*tasks)
```

---

## Examples

Comprehensive examples are available in the `examples_thirdweb/` directory:

- **basic_usage.py**: Client initialization and basic operations
- **wallet_operations.py**: Wallet management and transactions
- **contract_interaction.py**: Smart contract deployment and interaction
- **siwe_auth.py**: SIWE authentication flow
- **async_operations.py**: Async/await patterns and parallel operations
- **storage_operations.py**: IPFS storage operations

Run examples:

```bash
python examples_thirdweb/basic_usage.py
python examples_thirdweb/wallet_operations.py
python examples_thirdweb/contract_interaction.py
```

---

## Testing

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest tests_thirdweb/ -v

# Run with coverage
pytest tests_thirdweb/ --cov=varity_client --cov-report=html

# Run specific test file
pytest tests_thirdweb/test_client.py -v

# Run async tests
pytest tests_thirdweb/ -v -m asyncio
```

---

## Error Handling

```python
from varity_client.exceptions import (
    VarityClientError,
    ContractError,
    WalletError,
    AuthenticationError,
    StorageError,
    NetworkError
)

try:
    balance = await client.wallet.get_balance("0x...")
except WalletError as e:
    print(f"Wallet error: {e.message}")
    print(f"Details: {e.details}")
except NetworkError as e:
    print(f"Network error: {e.message}")
except VarityClientError as e:
    print(f"General error: {e.message}")
```

---

## Best Practices

### Security

✅ **Never commit private keys** to version control
✅ Use environment variables: `os.getenv("PRIVATE_KEY")`
✅ Use `.env` files with `.gitignore`
✅ Validate all user inputs
✅ Verify signatures server-side

### Performance

✅ Use `asyncio.gather()` for parallel operations
✅ Implement rate limiting for API calls
✅ Use connection pooling for multiple requests
✅ Cache frequently accessed data

### USDC Handling

✅ Always use `Decimal` for USDC amounts
✅ Remember USDC has 6 decimals (not 18 like ETH)
✅ Use `format_usdc()` and `parse_usdc()` utilities
✅ Validate amounts before transactions

### Smart Contracts

✅ Test contracts on testnet first
✅ Verify contract addresses before interaction
✅ Set appropriate gas limits
✅ Handle transaction failures gracefully

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/varity/client-python.git
cd client-python
pip install -e ".[dev]"

# Run tests
pytest tests_thirdweb/ -v

# Format code
black varity_client/
flake8 varity_client/

# Type checking
mypy varity_client/
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [https://docs.varity.io](https://docs.varity.io)
- **Discord**: [https://discord.gg/varity](https://discord.gg/varity)
- **GitHub Issues**: [https://github.com/varity/client-python/issues](https://github.com/varity/client-python/issues)
- **Email**: support@varity.io

---

## Acknowledgments

- Built on [Web3.py](https://web3py.readthedocs.io/)
- IPFS storage via [Thirdweb](https://thirdweb.com/)
- SIWE implementation using [siwe-py](https://github.com/spruceid/siwe-py)
- Deployed on [Varity L3](https://varity.io) - Arbitrum Orbit L3

---

**Made with ❤️ by the Varity team**
