# Thirdweb REST API Documentation

Comprehensive REST API endpoints for Thirdweb SDK integration on Varity L3 Testnet.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Contracts API](#contracts-api)
- [Chains API](#chains-api)
- [Wallets API](#wallets-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

Most endpoints support optional authentication using JWT tokens or wallet signatures. Some write operations require authentication and private keys.

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.varity.network/api/v1
```

## Contracts API

### Deploy Contract

Deploy a smart contract to Varity L3.

**Endpoint:** `POST /contracts/deploy`

**Rate Limit:** Strict (10 requests per 15 minutes)

**Request Body:**

```json
{
  "contractType": "custom",
  "name": "MyContract",
  "symbol": "MYC",
  "abi": [...],
  "bytecode": "0x...",
  "constructorArgs": [],
  "privateKey": "0x..." // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "deployed": true,
    "method": "create2",
    "transactionHash": "0x...",
    "contractType": "custom",
    "name": "MyContract",
    "chainId": 33529,
    "network": "Varity L3 Testnet"
  }
}
```

### Get Contract Details

Get information about a deployed contract.

**Endpoint:** `GET /contracts/:address`

**Example:** `GET /contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "chainId": 33529,
    "network": "Varity L3 Testnet",
    "contract": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "chain": {...}
    }
  }
}
```

### Read from Contract

Call a read-only function on a smart contract.

**Endpoint:** `POST /contracts/:address/read`

**Request Body:**

```json
{
  "abi": [...],
  "functionName": "balanceOf",
  "args": ["0x1234..."]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "result": "1000000",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "functionName": "balanceOf",
    "chainId": 33529
  }
}
```

### Call Contract Function

Execute a write operation on a smart contract.

**Endpoint:** `POST /contracts/:address/call`

**Rate Limit:** Strict (10 requests per 15 minutes)

**Request Body:**

```json
{
  "abi": [...],
  "functionName": "transfer",
  "args": ["0x5678...", "100000"],
  "privateKey": "0x..." // Required
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transactionHash": "0xabc...",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "functionName": "transfer",
    "chainId": 33529
  }
}
```

### Get Contract Events

Query events emitted by a contract.

**Endpoint:** `GET /contracts/:address/events`

**Query Parameters:**

- `fromBlock` (optional): Starting block number
- `toBlock` (optional): Ending block number (default: "latest")
- `eventName` (optional): Filter by specific event name

**Example:** `GET /contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/events?fromBlock=1000&eventName=Transfer`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "events": [
      {
        "eventName": "Transfer",
        "args": {
          "from": "0x...",
          "to": "0x...",
          "value": "1000000"
        },
        "blockNumber": 1234,
        "transactionHash": "0x..."
      }
    ],
    "count": 1,
    "fromBlock": "1000",
    "toBlock": "latest"
  }
}
```

### Get Contract ABI

Retrieve the ABI of a verified contract.

**Endpoint:** `GET /contracts/:address/abi`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "verified": false,
    "message": "ABI retrieval from block explorer coming soon. Please provide ABI manually for now."
  }
}
```

### Upload to IPFS

Upload data to IPFS via Thirdweb.

**Endpoint:** `POST /contracts/ipfs/upload`

**Rate Limit:** Strict (10 requests per 15 minutes)

**Request Body:**

```json
{
  "data": {
    "name": "My NFT",
    "description": "An awesome NFT",
    "image": "..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uri": "ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    "ipfsHash": "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
  }
}
```

### Download from IPFS

Download data from IPFS via Thirdweb.

**Endpoint:** `POST /contracts/ipfs/download`

**Request Body:**

```json
{
  "uri": "ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "data": {
      "name": "My NFT",
      "description": "An awesome NFT"
    },
    "uri": "ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx"
  }
}
```

## Chains API

### Get Chain Information

Get complete information about Varity L3 Testnet.

**Endpoint:** `GET /chains`

**Response:**

```json
{
  "success": true,
  "data": {
    "chainId": 33529,
    "name": "Varity L3 Testnet",
    "shortName": "varity-l3",
    "network": "varity-testnet",
    "nativeCurrency": {
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6
    },
    "rpc": {
      "primary": "http://localhost:8545",
      "public": ["http://localhost:8545"],
      "websocket": ["ws://localhost:8545"]
    },
    "blockExplorers": {
      "default": {
        "name": "Varity Explorer",
        "url": "https://explorer.varity.network"
      }
    },
    "testnet": true,
    "parent": {
      "chain": "arbitrum-one",
      "chainId": 42161,
      "type": "L2"
    },
    "features": {
      "dataAvailability": "Celestia",
      "encryption": "Lit Protocol",
      "storage": "Filecoin/IPFS",
      "compute": "Akash Network",
      "thirdwebSupport": true
    }
  }
}
```

### Get Supported Chains

List all supported chains.

**Endpoint:** `GET /chains/supported`

**Response:**

```json
{
  "success": true,
  "data": {
    "chains": [
      {
        "chainId": 33529,
        "name": "Varity L3 Testnet",
        "symbol": "USDC",
        "decimals": 6,
        "testnet": true,
        "active": true
      }
    ],
    "count": 1
  }
}
```

### Validate Chain ID

Validate if a chain ID is supported.

**Endpoint:** `POST /chains/validate`

**Request Body:**

```json
{
  "chainId": 33529
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "chainId": 33529,
    "valid": true,
    "testnet": true,
    "name": "Varity L3 Testnet",
    "supported": true
  }
}
```

### Get Chain by ID

Get details for a specific chain.

**Endpoint:** `GET /chains/:chainId`

**Example:** `GET /chains/33529`

**Response:** Same as "Get Chain Information"

### Get Block

Get information about a specific block.

**Endpoint:** `GET /chains/:chainId/block/:blockNumber`

**Example:** `GET /chains/33529/block/latest` or `GET /chains/33529/block/1000`

**Response:**

```json
{
  "success": true,
  "data": {
    "block": {
      "number": 1000,
      "hash": "0x...",
      "timestamp": 1234567890,
      "transactions": [...],
      "gasUsed": "21000",
      "gasLimit": "8000000"
    },
    "chainId": 33529
  }
}
```

### Get Transaction

Get information about a specific transaction.

**Endpoint:** `GET /chains/:chainId/tx/:hash`

**Example:** `GET /chains/33529/tx/0xabc...`

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0xabc...",
      "from": "0x1234...",
      "to": "0x5678...",
      "value": "1000000",
      "gasUsed": "21000",
      "blockNumber": 1000,
      "status": "success"
    },
    "chainId": 33529
  }
}
```

### Get Gas Price

Get current gas prices on the network.

**Endpoint:** `GET /chains/:chainId/gas`

**Example:** `GET /chains/33529/gas`

**Response:**

```json
{
  "success": true,
  "data": {
    "gasPrice": "100",
    "chainId": 33529,
    "currency": "USDC",
    "decimals": 6
  }
}
```

## Wallets API

### Get Wallet Balance

Get the native token balance of a wallet.

**Endpoint:** `GET /wallets/:address/balance`

**Example:** `GET /wallets/0x1234.../balance`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "balance": "1500000",
    "displayBalance": "1.5",
    "symbol": "USDC",
    "decimals": 6,
    "chainId": 33529,
    "currency": "USDC"
  }
}
```

### Get Wallet NFTs

Get all NFTs owned by a wallet.

**Endpoint:** `GET /wallets/:address/nfts`

**Query Parameters:**

- `limit` (optional): Number of NFTs to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `GET /wallets/0x1234.../nfts?limit=10&offset=0`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "nfts": [
      {
        "tokenId": "1",
        "contractAddress": "0x5678...",
        "name": "Cool NFT #1",
        "description": "A cool NFT",
        "image": "ipfs://...",
        "metadata": {...}
      }
    ],
    "count": 1,
    "limit": 10,
    "offset": 0,
    "chainId": 33529
  }
}
```

### Get Wallet Transactions

Get transaction history for a wallet.

**Endpoint:** `GET /wallets/:address/transactions`

**Query Parameters:**

- `limit` (optional): Number of transactions (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `GET /wallets/0x1234.../transactions?limit=20`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "transactions": [
      {
        "hash": "0xabc...",
        "from": "0x1234...",
        "to": "0x5678...",
        "value": "1000000",
        "timestamp": 1234567890,
        "status": "success"
      }
    ],
    "count": 1,
    "limit": 20,
    "offset": 0,
    "chainId": 33529
  }
}
```

### Get Token Balances

Get all ERC20 token balances for a wallet.

**Endpoint:** `GET /wallets/:address/tokens`

**Example:** `GET /wallets/0x1234.../tokens`

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "tokens": [
      {
        "contractAddress": "0x5678...",
        "name": "Test Token",
        "symbol": "TEST",
        "decimals": 18,
        "balance": "1000000000000000000",
        "displayBalance": "1.0"
      }
    ],
    "count": 1,
    "chainId": 33529
  }
}
```

### Send Transaction

Send a transaction from a wallet.

**Endpoint:** `POST /wallets/:address/send`

**Request Body:**

```json
{
  "to": "0x5678...",
  "amount": "1.5",
  "token": "0x...",  // Optional: ERC20 token address
  "privateKey": "0x..."  // Required
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transactionHash": "0xabc...",
    "from": "0x1234...",
    "to": "0x5678...",
    "amount": "1.5",
    "token": "USDC",
    "chainId": 33529
  }
}
```

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Valid wallet address is required",
    "details": {...}
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400): Invalid input parameters
- `UNAUTHORIZED` (401): Authentication required
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

## Rate Limiting

### Standard Rate Limit

- **Window:** 15 minutes
- **Max Requests:** 100 per window

Applied to: Read operations (GET requests)

### Strict Rate Limit

- **Window:** 15 minutes
- **Max Requests:** 10 per window

Applied to: Write operations (POST/PUT/DELETE requests that modify state)

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Best Practices

1. **USDC Decimals:** Always use 6 decimals for USDC (not 18!)
2. **Address Validation:** Validate Ethereum addresses before making requests
3. **Error Handling:** Implement proper error handling and retry logic
4. **Rate Limiting:** Respect rate limits and implement exponential backoff
5. **Private Keys:** Never expose private keys in logs or client-side code
6. **Gas Estimation:** Estimate gas before sending transactions
7. **Transaction Monitoring:** Monitor transaction status after submission

## Security Notes

1. **Private Keys:** Store private keys securely using environment variables or secure vaults
2. **HTTPS Only:** Always use HTTPS in production
3. **API Keys:** Rotate API keys regularly
4. **Input Validation:** Validate all inputs on the client side
5. **Rate Limiting:** Implement client-side rate limiting
6. **CORS:** Configure CORS appropriately for your domain

## Support

For support, please contact:
- Documentation: https://docs.varity.network
- Discord: https://discord.gg/varity
- Email: support@varity.network
