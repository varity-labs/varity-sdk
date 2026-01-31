# Varity GCS Gateway

Google Cloud Storage-compatible JSON API gateway with Filecoin/IPFS backend. Provides a drop-in replacement for GCS that stores data on decentralized infrastructure.

## Features

- **GCS JSON API v1 Compatibility**: Full implementation of Google Cloud Storage JSON API
- **Hybrid Authentication**: Support for OAuth2, Web3 wallets, or both simultaneously
  - **OAuth2 Authentication**: Verify tokens against Google's OAuth2 service
  - **Web3 Wallet Authentication**: Sign-In with Ethereum (SIWE) for decentralized access
  - **Service Account Support**: JWT-based authentication for service accounts
- **Wallet-to-GCS Permission Mapping**: Fine-grained access control per wallet address
- **3-Layer Storage Architecture**: Varity Internal, Industry RAG, Customer Data layers
- **Resumable Uploads**: Support for large file uploads with resume capability
- **Filecoin/IPFS Backend**: All data stored on decentralized storage via Pinata
- **Rate Limiting**: Configurable rate limits for API and upload endpoints
- **Health Monitoring**: Built-in health check endpoint
- **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
pnpm install @varity/gcs-gateway
```

## Quick Start

### 1. Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Configure your environment:

```env
PORT=8080
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### 2. Start the Server

```bash
# Development mode with auto-reload
pnpm dev

# Production mode
pnpm build
pnpm start
```

### 3. Test the API

```bash
# Health check
curl http://localhost:8080/health

# List buckets (requires authentication)
curl -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \
  http://localhost:8080/storage/v1/b?project=my-project
```

## API Documentation

### Authentication

The gateway supports three authentication modes with five authentication methods:

#### OAuth2 Authentication

Use Google OAuth2 access tokens:

```bash
curl -H "Authorization: Bearer ya29.a0AfH6SMB..." \
  http://localhost:8080/storage/v1/b
```

#### Service Account Authentication

Use JWT tokens signed with service account credentials:

```bash
# Set service account credentials in environment
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Use Bearer token in requests
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:8080/storage/v1/b
```

#### Web3 Wallet Authentication (SIWE)

Use wallet signatures for decentralized access control:

**Step 1: Get Nonce**

```bash
curl "http://localhost:8080/auth/nonce?address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```

Response:
```json
{
  "nonce": "0x1234567890abcdef",
  "address": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  "chainId": 33529
}
```

**Step 2: Generate SIWE Message**

```bash
curl -X POST http://localhost:8080/auth/message \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}'
```

Response:
```json
{
  "message": {
    "domain": "gcs.varity.dev",
    "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "statement": "Sign in to Varity GCS Gateway to access decentralized storage",
    "uri": "https://gcs.varity.dev",
    "version": "1",
    "chainId": 33529,
    "nonce": "0x1234567890abcdef",
    "issuedAt": "2024-01-15T10:30:00.000Z",
    "expirationTime": "2024-01-15T10:40:00.000Z"
  },
  "formattedMessage": "gcs.varity.dev wants you to sign in..."
}
```

**Step 3: Sign Message with Wallet**

```javascript
// Using ethers.js
import { ethers } from 'ethers';

const wallet = new ethers.Wallet(privateKey);
const signature = await wallet.signMessage(formattedMessage);
```

**Step 4: Verify Signature and Get JWT Token**

```bash
curl -X POST http://localhost:8080/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "domain": "gcs.varity.dev",
      "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      ...
    },
    "signature": "0xabcdef..."
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  "chainId": 33529,
  "expiresIn": 86400
}
```

**Step 5: Use JWT Token for GCS API Calls**

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:8080/storage/v1/b?project=my-project
```

#### Complete Wallet Authentication Example (JavaScript/TypeScript)

```typescript
import { ethers } from 'ethers';
import axios from 'axios';

const GCS_GATEWAY_URL = 'http://localhost:8080';

async function authenticateWithWallet(wallet: ethers.Wallet) {
  // 1. Get nonce
  const nonceRes = await axios.get(`${GCS_GATEWAY_URL}/auth/nonce`, {
    params: { address: wallet.address }
  });

  // 2. Generate SIWE message
  const messageRes = await axios.post(`${GCS_GATEWAY_URL}/auth/message`, {
    address: wallet.address
  });

  const { message, formattedMessage } = messageRes.data;

  // 3. Sign message
  const signature = await wallet.signMessage(formattedMessage);

  // 4. Verify signature and get JWT
  const verifyRes = await axios.post(`${GCS_GATEWAY_URL}/auth/verify`, {
    message,
    signature
  });

  const { token } = verifyRes.data;

  // 5. Use token for GCS API calls
  const bucketsRes = await axios.get(`${GCS_GATEWAY_URL}/storage/v1/b`, {
    params: { project: 'my-project' },
    headers: { Authorization: `Bearer ${token}` }
  });

  return { token, buckets: bucketsRes.data };
}

// Usage
const wallet = ethers.Wallet.createRandom();
const { token, buckets } = await authenticateWithWallet(wallet);
console.log('JWT Token:', token);
console.log('Buckets:', buckets);
```

#### Authentication Modes

Set `AUTH_MODE` in `.env` to control authentication behavior:

- **`oauth`**: OAuth2 and service account only (traditional cloud auth)
- **`wallet`**: Web3 wallet signatures only (fully decentralized)
- **`hybrid`**: Accept both OAuth2 and wallet auth (recommended)

### Bucket Operations

#### List Buckets

```bash
GET /storage/v1/b?project={project}
```

Example:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8080/storage/v1/b?project=my-project"
```

Response:
```json
{
  "kind": "storage#buckets",
  "items": [
    {
      "kind": "storage#bucket",
      "id": "my-bucket",
      "name": "my-bucket",
      "timeCreated": "2024-01-01T00:00:00Z",
      "updated": "2024-01-01T00:00:00Z",
      "location": "FILECOIN",
      "storageClass": "STANDARD"
    }
  ]
}
```

#### Get Bucket

```bash
GET /storage/v1/b/{bucket}
```

#### Create Bucket

```bash
POST /storage/v1/b?project={project}
Content-Type: application/json

{
  "name": "my-bucket",
  "location": "FILECOIN",
  "storageClass": "STANDARD"
}
```

#### Delete Bucket

```bash
DELETE /storage/v1/b/{bucket}
```

### Object Operations

#### List Objects

```bash
GET /storage/v1/b/{bucket}/o?prefix={prefix}&maxResults={max}
```

Example:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8080/storage/v1/b/my-bucket/o?prefix=documents/"
```

Response:
```json
{
  "kind": "storage#objects",
  "items": [
    {
      "kind": "storage#object",
      "id": "my-bucket/file.txt/1234567890",
      "name": "file.txt",
      "bucket": "my-bucket",
      "generation": "1234567890",
      "size": "12345",
      "md5Hash": "5d41402abc4b2a76b9719d911017c592",
      "timeCreated": "2024-01-01T00:00:00Z",
      "updated": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Object Metadata

```bash
GET /storage/v1/b/{bucket}/o/{object}
```

#### Download Object

```bash
GET /storage/v1/b/{bucket}/o/{object}?alt=media
```

Example:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8080/storage/v1/b/my-bucket/o/file.txt?alt=media" \
  -o downloaded-file.txt
```

#### Upload Object (Simple)

```bash
POST /upload/storage/v1/b/{bucket}/o?uploadType=media&name={name}
Content-Type: {content-type}

[binary data]
```

Example:
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary @file.txt \
  "http://localhost:8080/upload/storage/v1/b/my-bucket/o?uploadType=media&name=file.txt"
```

#### Resumable Upload

**Step 1: Initiate Upload**

```bash
POST /upload/storage/v1/b/{bucket}/o?uploadType=resumable&name={name}
X-Upload-Content-Type: {content-type}
X-Upload-Content-Length: {size}
Content-Type: application/json

{
  "metadata": {
    "key": "value"
  }
}
```

Response includes `Location` header with upload URL.

**Step 2: Upload Chunks**

```bash
PUT {upload_url}
Content-Range: bytes {start}-{end}/{total}

[chunk data]
```

Example:
```bash
# Upload first chunk (0-999 of 2000 bytes)
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Range: bytes 0-999/2000" \
  --data-binary @chunk1.bin \
  "http://localhost:8080/upload/storage/v1/b/resumable?upload_id=abc123"

# Server responds with 308 Resume Incomplete and Range header

# Upload final chunk (1000-1999 of 2000 bytes)
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Range: bytes 1000-1999/2000" \
  --data-binary @chunk2.bin \
  "http://localhost:8080/upload/storage/v1/b/resumable?upload_id=abc123"

# Server responds with 201 Created and object metadata
```

**Step 3: Check Upload Status**

```bash
PUT {upload_url}
Content-Length: 0
```

Server responds with `Range: bytes=0-{last_byte}` header showing bytes received.

#### Delete Object

```bash
DELETE /storage/v1/b/{bucket}/o/{object}
```

## Integration with Google Cloud SDK

The gateway is compatible with Google Cloud Storage client libraries when configured with a custom endpoint:

### Python Example

```python
from google.cloud import storage

# Configure client with custom endpoint
client = storage.Client(
    project='my-project',
    credentials=your_credentials
)

# Override API endpoint
client._connection.API_BASE_URL = 'http://localhost:8080'

# Use normally
bucket = client.bucket('my-bucket')
blob = bucket.blob('file.txt')
blob.upload_from_filename('local-file.txt')
```

### Node.js Example

```javascript
const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: 'my-project',
  apiEndpoint: 'http://localhost:8080'
});

const bucket = storage.bucket('my-bucket');
await bucket.upload('local-file.txt', {
  destination: 'file.txt'
});
```

## Architecture

### Storage Backend

The gateway uses Filecoin/IPFS via Pinata for persistent decentralized storage:

1. **Upload**: Files are uploaded to Pinata, returning IPFS CID
2. **Storage**: Files are pinned to Filecoin for permanent storage
3. **Retrieval**: Files are fetched via IPFS gateway using CID
4. **Caching**: Frequently accessed files are cached in memory

### Authentication Flow

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐
│ Client  │────────▶│ GCS Gateway  │────────▶│ Google Auth │
└─────────┘  Token  └──────────────┘  Verify └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Filecoin   │
                    │     IPFS     │
                    └──────────────┘
```

### Rate Limiting

- API endpoints: 1000 requests per 15 minutes per IP
- Upload endpoints: 100 uploads per 15 minutes per IP

## Wallet-to-GCS Permission System

The gateway implements fine-grained access control for wallet addresses mapped to GCS buckets and operations.

### Permission Types

- **`read`**: List and download objects
- **`write`**: Upload and modify objects
- **`delete`**: Delete objects and buckets
- **`admin`**: Full access to all operations
- **`*`**: Wildcard (all permissions)

### Storage Layers

The gateway enforces Varity's 3-layer storage architecture:

1. **Layer 1: Varity Internal** (`varity-internal-*`)
   - Platform documentation and internal data
   - Access: Varity admins only

2. **Layer 2: Industry RAG** (`industry-{industry}-rag-*`)
   - Shared industry knowledge (ISO, finance, healthcare, retail)
   - Access: All customers in industry + admins

3. **Layer 3: Customer Data** (`customer-{customer-id}-*`)
   - Private customer business data
   - Access: Single customer only + emergency admin access

### Configuring Wallet Permissions

Set `GCS_WALLET_BUCKET_MAPPING` environment variable with JSON configuration:

```json
[
  {
    "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "buckets": [
      {
        "name": "customer-alice-*",
        "permissions": ["read", "write", "delete"],
        "storageLayer": "customer-data"
      },
      {
        "name": "industry-iso-merchant-rag-*",
        "permissions": ["read"],
        "storageLayer": "industry-rag"
      }
    ],
    "globalPermissions": [],
    "industry": "iso-merchant",
    "customerId": "alice",
    "isAdmin": false
  },
  {
    "address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "buckets": [],
    "globalPermissions": ["*"],
    "isAdmin": true
  }
]
```

### Permission Examples

**Customer Permissions**:
```json
{
  "address": "0x123...",
  "buckets": [
    {"name": "customer-alice-*", "permissions": ["read", "write", "delete"], "storageLayer": "customer-data"},
    {"name": "industry-iso-merchant-rag-*", "permissions": ["read"], "storageLayer": "industry-rag"}
  ],
  "industry": "iso-merchant",
  "customerId": "alice",
  "isAdmin": false
}
```

**Admin Permissions**:
```json
{
  "address": "0xabc...",
  "globalPermissions": ["*"],
  "isAdmin": true
}
```

### Checking Permissions

```bash
# Get wallet permissions
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/auth/permissions

# Get storage layer access
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/auth/storage-layers
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `development` |
| `DEBUG` | Enable debug logging | `false` |
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `PINATA_API_KEY` | Pinata API key | Required |
| `PINATA_SECRET_KEY` | Pinata secret key | Required |
| `IPFS_GATEWAY` | IPFS gateway URL | `https://gateway.pinata.cloud/ipfs` |
| `LIT_PROTOCOL_ENABLED` | Enable Lit Protocol encryption | `false` |
| `CELESTIA_DA_ENABLED` | Enable Celestia DA | `false` |
| `GOOGLE_SERVICE_ACCOUNT` | Service account JSON | Optional |
| `AUTH_MODE` | Authentication mode (oauth/wallet/hybrid) | `hybrid` |
| `WALLET_AUTH_ENABLED` | Enable wallet authentication | `true` |
| `THIRDWEB_CLIENT_ID` | Thirdweb client ID | Required for wallet auth |
| `JWT_SECRET` | JWT signing secret | Required for wallet auth |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `VARITY_L3_CHAIN_ID` | Varity L3 chain ID | `33529` |
| `GCS_WALLET_BUCKET_MAPPING` | Wallet permission mapping JSON | `[]` |

## Development

### Build

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

### Format Code

```bash
pnpm format
```

## Error Handling

All errors follow GCS JSON API format:

```json
{
  "error": {
    "code": 404,
    "message": "Not found",
    "errors": [
      {
        "domain": "global",
        "reason": "notFound",
        "message": "Object not found"
      }
    ]
  }
}
```

Common error codes:
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required or failed
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

## Roadmap

- [ ] Implement bucket ACLs
- [ ] Support for object versioning
- [ ] Implement lifecycle policies
- [ ] Add encryption at rest with Lit Protocol
- [ ] Integration with Celestia DA
- [ ] Support for signed URLs
- [ ] Implement object composition
- [ ] Add metrics and monitoring
- [ ] Support for custom metadata search
- [ ] Implement notification webhooks

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://docs.varity.dev
- Issues: https://github.com/varity/varity/issues
- Discord: https://discord.gg/varity

## Related Projects

- [@varity/sdk](../varity-sdk) - Varity SDK for DePIN development
- [@varity/s3-gateway](../varity-s3-gateway) - S3-compatible gateway
- [@varity/types](../varity-types) - Shared TypeScript types
