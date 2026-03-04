# VarityKit CLI - Thirdweb Commands Reference

## Overview

The VarityKit CLI includes a complete `thirdweb` command group for contract deployment, interaction, and IPFS storage using the Thirdweb SDK.

## Command Group

```bash
varity thirdweb
```

Thirdweb SDK integration for contract deployment and interaction.

---

## Commands

### `varity thirdweb deploy`

Deploy a smart contract using Thirdweb SDK.

#### Usage

```bash
varity thirdweb deploy <contract-path> [options]
```

#### Arguments

- `CONTRACT_PATH` - Path to compiled contract JSON file (with ABI and bytecode)

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--constructor-args <args>` | Constructor arguments as JSON array | `[]` |
| `--network <name>` | Network to deploy to | `varity-testnet` |
| `--name <name>` | Contract name (auto-detected if not provided) | Auto-detected |

#### Examples

**Deploy without constructor arguments:**
```bash
varity thirdweb deploy ./out/MyContract.sol/MyContract.json
```

**Deploy with constructor arguments:**
```bash
varity thirdweb deploy ./out/MyToken.sol/MyToken.json \
  --constructor-args '["MyToken", "MTK", 1000000]'
```

**Deploy to specific network:**
```bash
varity thirdweb deploy ./out/NFT.sol/NFT.json \
  --network varity-testnet \
  --name "VarityNFT"
```

#### Output

```
✓ Contract Deployed Successfully

Address:
0x1234567890abcdef1234567890abcdef12345678

Network: varity-testnet
Chain ID: 33529
```

---

### `varity thirdweb read`

Read from a deployed contract using Thirdweb SDK.

#### Usage

```bash
varity thirdweb read <contract-address> <method-name> [options]
```

#### Arguments

- `CONTRACT_ADDRESS` - Contract address (0x...)
- `METHOD_NAME` - Method name to call

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--params <params>` | Method parameters as JSON array | `[]` |
| `--network <name>` | Network to read from | `varity-testnet` |

#### Examples

**Read simple value:**
```bash
varity thirdweb read 0x123... name
```

**Read with parameters:**
```bash
varity thirdweb read 0x123... balanceOf \
  --params '["0xabc..."]'
```

**Multi-parameter read:**
```bash
varity thirdweb read 0x123... allowance \
  --params '["0xowner...", "0xspender..."]'
```

**Read from specific network:**
```bash
varity thirdweb read 0x123... totalSupply \
  --network varity-testnet
```

#### Output

```
✓ Call Successful

Result:
1000000
```

---

### `varity thirdweb write`

Write to a deployed contract (send transaction) using Thirdweb SDK.

#### Usage

```bash
varity thirdweb write <contract-address> <method-name> --params <params> [options]
```

#### Arguments

- `CONTRACT_ADDRESS` - Contract address (0x...)
- `METHOD_NAME` - Method name to call

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--params <params>` | Method parameters as JSON array **(required)** | - |
| `--network <name>` | Network to send transaction to | `varity-testnet` |
| `--value <value>` | Native token value to send (in wei) | `0` |

#### Examples

**Transfer tokens:**
```bash
varity thirdweb write 0x123... transfer \
  --params '["0xrecipient...", 1000000]'
```

**Approve spending:**
```bash
varity thirdweb write 0x123... approve \
  --params '["0xspender...", 1000000000]'
```

**Send with value:**
```bash
varity thirdweb write 0x123... deposit \
  --params '[]' \
  --value 1000000
```

**Multi-parameter transaction:**
```bash
varity thirdweb write 0x123... complexMethod \
  --params '["arg1", 123, true, "0xaddr..."]' \
  --network varity-testnet
```

#### Output

```
Send transaction? [y/N]: y

✓ Transaction Successful

Transaction Hash:
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

### `varity thirdweb storage`

Upload files to or download files from Thirdweb IPFS.

#### Usage

```bash
varity thirdweb storage <file-path> [options]
```

#### Arguments

- `FILE_PATH` - File path (for upload) or IPFS URI (for download)

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--download` | Download from IPFS instead of upload | `false` |
| `--output <path>` | Output path for downloaded file | Console output |

#### Examples

**Upload file:**
```bash
varity thirdweb storage ./metadata.json
```

**Upload directory:**
```bash
varity thirdweb storage ./images/
```

**Download from IPFS:**
```bash
varity thirdweb storage ipfs://QmXxx... --download
```

**Download to specific path:**
```bash
varity thirdweb storage ipfs://QmXxx... \
  --download \
  --output ./downloaded-metadata.json
```

#### Output (Upload)

```
✓ Upload Successful

IPFS URI:
ipfs://QmXhX9fC8V7K7LqQz3qY8hZ5V9fC8V7K7LqQz3qY8hZ5
```

#### Output (Download)

```
✓ Download Successful

Downloaded to: ./downloaded-metadata.json
```

---

### `varity thirdweb setup`

Setup Thirdweb integration scripts.

#### Usage

```bash
varity thirdweb setup
```

#### Description

Installs required Node.js dependencies and creates helper scripts for Thirdweb SDK operations.

This command:
1. Creates `scripts/thirdweb/` directory
2. Generates `package.json` with dependencies
3. Installs `@thirdweb-dev/sdk` and `@thirdweb-dev/storage`
4. Creates helper scripts for deploy, read, write, and storage operations

#### Example

```bash
varity thirdweb setup
```

#### Output

```
✓ Thirdweb Setup Complete

Helper scripts installed successfully.
You can now use:
  varietykit thirdweb deploy
  varietykit thirdweb read
  varietykit thirdweb write
  varietykit thirdweb storage
```

---

## Environment Variables

All Thirdweb commands require specific environment variables to be configured.

### Required

```bash
# Thirdweb Client ID (get from https://thirdweb.com/dashboard)
THIRDWEB_CLIENT_ID=your_client_id_here

# Deployer wallet private key
DEPLOYER_PRIVATE_KEY=0x...
```

### Optional

```bash
# Thirdweb Secret Key (for backend operations)
THIRDWEB_SECRET_KEY=your_secret_key_here

# Network configuration (auto-detected from .env.testnet)
CHAIN_ID=33529
RPC_HTTP=https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz
```

### Configuration Files

Environment variables can be loaded from:

1. **Current directory**: `./.env.testnet`
2. **Deployments directory**: `./deployments/testnet/.env.testnet`
3. **Environment**: System environment variables

The CLI will automatically search in this order.

---

## Networks

Currently supported networks:

### Varity Testnet

- **Network Name**: `varity-testnet`
- **Chain ID**: 33529
- **RPC URL**: `https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz`
- **Explorer**: `https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz`
- **Native Token**: USDC (6 decimals)

---

## Contract JSON Format

The `deploy` command expects a compiled contract JSON file with this structure:

```json
{
  "abi": [...],
  "bytecode": "0x..."
}
```

Or with nested bytecode:

```json
{
  "abi": [...],
  "bytecode": {
    "object": "0x...",
    "linkReferences": {},
    "deployedBytecode": "0x..."
  }
}
```

### How to Generate Contract JSON

**Using Forge (Foundry):**
```bash
forge build
# Output: ./out/MyContract.sol/MyContract.json
```

**Using Hardhat:**
```bash
npx hardhat compile
# Output: ./artifacts/contracts/MyContract.sol/MyContract.json
```

---

## Parameter Format

All commands accepting parameters use JSON array format:

### Strings

```bash
--params '["string_value"]'
```

### Numbers

```bash
--params '[1000000]'
```

### Addresses

```bash
--params '["0x1234567890abcdef1234567890abcdef12345678"]'
```

### Booleans

```bash
--params '[true]'
```

### Multiple Parameters

```bash
--params '["string", 123, true, "0xaddr..."]'
```

### Nested Arrays

```bash
--params '[["item1", "item2"], 123]'
```

---

## Error Handling

### Common Errors

#### "Environment Configuration Error"

**Problem**: Missing required environment variables

**Solution**:
```bash
# Add to .env.testnet
THIRDWEB_CLIENT_ID=your_client_id
DEPLOYER_PRIVATE_KEY=0x...
```

#### "Thirdweb helper script not found"

**Problem**: Thirdweb scripts not installed

**Solution**:
```bash
varity thirdweb setup
```

#### "Contract file not found"

**Problem**: Invalid contract path

**Solution**: Verify path and compile contracts first:
```bash
forge build  # or npx hardhat compile
varity thirdweb deploy ./out/MyContract.sol/MyContract.json
```

#### "Deployment failed: insufficient funds"

**Problem**: Deployer wallet has no USDC

**Solution**: Bridge USDC to Varity L3:
```bash
# Use Superbridge
open https://varity-testnet-rroe52pwjp-86d3bf2e4517f78c.testnets.rollbridge.app/
```

---

## Best Practices

### 1. Use Environment Files

Store credentials in `.env.testnet`, never commit:

```bash
# .env.testnet
THIRDWEB_CLIENT_ID=a35636133eb5ec6f30eb9f4c15fce2f3
THIRDWEB_SECRET_KEY=  # KEEP EMPTY - DO NOT COMMIT!
DEPLOYER_PRIVATE_KEY=  # KEEP EMPTY - DO NOT COMMIT!
```

Add sensitive values locally only.

### 2. Validate Before Deployment

```bash
# Check contract compiles
forge build

# Check wallet balance
varity thirdweb read 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d balanceOf \
  --params '["YOUR_WALLET_ADDRESS"]'

# Deploy
varity thirdweb deploy ./out/MyContract.sol/MyContract.json
```

### 3. Test Reads Before Writes

```bash
# Read first (no gas cost)
varity thirdweb read 0x123... balanceOf --params '["0xabc..."]'

# Then write (costs gas)
varity thirdweb write 0x123... transfer --params '["0xabc...", 1000]'
```

### 4. Use Named Parameters

```bash
# Good: Named parameters
varity thirdweb deploy ./out/MyToken.sol/MyToken.json \
  --constructor-args '["MyToken", "MTK", 1000000]' \
  --network varity-testnet

# Avoid: Positional-only parameters
varity thirdweb deploy ./out/MyToken.sol/MyToken.json '["MyToken", "MTK", 1000000]'
```

---

## Advanced Usage

### Scripting

Use Thirdweb commands in shell scripts:

```bash
#!/bin/bash
# deploy-all.sh

# Deploy Token
TOKEN_ADDRESS=$(varity thirdweb deploy ./out/Token.sol/Token.json \
  --constructor-args '["MyToken", "MTK", 1000000]')

echo "Token deployed at: $TOKEN_ADDRESS"

# Deploy NFT
NFT_ADDRESS=$(varity thirdweb deploy ./out/NFT.sol/NFT.json \
  --constructor-args '["MyNFT", "MNFT"]')

echo "NFT deployed at: $NFT_ADDRESS"

# Upload metadata
METADATA_URI=$(varity thirdweb storage ./metadata/)

echo "Metadata uploaded to: $METADATA_URI"
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy Contracts

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3

      - name: Install dependencies
        run: |
          npm install
          varity thirdweb setup

      - name: Deploy contracts
        env:
          THIRDWEB_CLIENT_ID: ${{ secrets.THIRDWEB_CLIENT_ID }}
          DEPLOYER_PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}
        run: |
          varity thirdweb deploy ./out/MyContract.sol/MyContract.json
```

---

## Comparison with Standard Commands

### Deployment

**Standard (ethers.js):**
```bash
varity deploy run
```

**Thirdweb:**
```bash
varity thirdweb deploy ./out/MyContract.sol/MyContract.json
```

**Differences**:
- Thirdweb: Explicit contract path, simpler configuration
- Standard: Uses deployment scripts, more customization

### Contract Interaction

**Standard:**
```bash
varity contract call 0x123... balanceOf 0xabc...
```

**Thirdweb:**
```bash
varity thirdweb read 0x123... balanceOf --params '["0xabc..."]'
```

**Differences**:
- Thirdweb: JSON array params, clearer syntax
- Standard: Positional params, more compact

---

## Troubleshooting

### Debug Mode

Enable verbose output:

```bash
varity --debug thirdweb deploy ./out/MyContract.sol/MyContract.json
```

### Check Configuration

Verify environment variables are loaded:

```bash
# Read from env file
cat .env.testnet | grep THIRDWEB_CLIENT_ID

# Verify RPC connectivity
curl https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## Support & Resources

- **Migration Guide**: [MIGRATION_THIRDWEB.md](./MIGRATION_THIRDWEB.md)
- **SDK Documentation**: [varity-sdk README](../../packages/varity-sdk/README.md)
- **Thirdweb Docs**: [https://portal.thirdweb.com](https://portal.thirdweb.com)
- **API Keys Guide**: [API-KEYS-GUIDE.md](../../deployments/testnet/API-KEYS-GUIDE.md)
- **Discord**: https://discord.gg/varity
- **Email**: support@varity.so

---

**Last Updated**: 2025-11-14
