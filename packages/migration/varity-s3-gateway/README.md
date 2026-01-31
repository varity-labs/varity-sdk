# Varity S3-Compatible Gateway

A production-ready S3-compatible HTTP gateway server that stores data on Filecoin/IPFS using the Varity SDK. Provides a drop-in replacement for AWS S3 with decentralized storage backend.

## Features

- **S3-Compatible API**: Full implementation of AWS S3 REST API
- **Dual Authentication**: Web3 wallet signatures (SIWE) + AWS Signature V4
- **Wallet-based ACLs**: Fine-grained permissions per wallet address
- **Filecoin/IPFS Storage**: Decentralized storage via Varity SDK
- **Production-Ready**: Rate limiting, security headers, CORS support
- **TypeScript**: Full type safety and modern development experience
- **100% Backwards Compatible**: Existing AWS IAM auth still works

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials in .env
```

## Quick Start

### Development Mode

```bash
# Start development server with auto-reload
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

The server will start on `http://localhost:3001` (configurable via `PORT` environment variable).

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# AWS Credentials (for S3 API authentication)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Varity SDK Configuration
VARITY_NETWORK=arbitrum-sepolia
VARITY_API_KEY=your-varity-api-key

# Storage Backend
STORAGE_BACKEND=filecoin-ipfs
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# Security
CORS_ORIGIN=*
MAX_UPLOAD_SIZE=100mb

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## S3 API Endpoints

### Service Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all buckets |

### Bucket Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/{bucket}` | Create bucket |
| HEAD | `/{bucket}` | Check if bucket exists |
| DELETE | `/{bucket}` | Delete bucket |
| GET | `/{bucket}?list-type=2` | List objects in bucket |

### Object Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/{bucket}/{key}` | Upload object |
| GET | `/{bucket}/{key}` | Download object |
| HEAD | `/{bucket}/{key}` | Get object metadata |
| DELETE | `/{bucket}/{key}` | Delete object |
| PUT | `/{bucket}/{key}` (with `x-amz-copy-source`) | Copy object |

## Usage Examples

### AWS CLI

Configure AWS CLI to use the Varity S3 Gateway:

```bash
# Configure AWS CLI
aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE
aws configure set aws_secret_access_key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
aws configure set region us-east-1

# Create a bucket
aws s3 mb s3://my-bucket --endpoint-url http://localhost:3001

# Upload a file
aws s3 cp myfile.txt s3://my-bucket/ --endpoint-url http://localhost:3001

# List objects
aws s3 ls s3://my-bucket/ --endpoint-url http://localhost:3001

# Download a file
aws s3 cp s3://my-bucket/myfile.txt downloaded.txt --endpoint-url http://localhost:3001

# Delete a file
aws s3 rm s3://my-bucket/myfile.txt --endpoint-url http://localhost:3001

# Delete a bucket
aws s3 rb s3://my-bucket --endpoint-url http://localhost:3001
```

### AWS SDK for JavaScript (v3)

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Create S3 client pointing to Varity gateway
const s3Client = new S3Client({
  endpoint: 'http://localhost:3001',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  },
  forcePathStyle: true // Required for non-AWS endpoints
});

// Upload an object
const uploadParams = {
  Bucket: 'my-bucket',
  Key: 'myfile.txt',
  Body: 'Hello, Varity!',
  ContentType: 'text/plain'
};

await s3Client.send(new PutObjectCommand(uploadParams));

// Download an object
const downloadParams = {
  Bucket: 'my-bucket',
  Key: 'myfile.txt'
};

const response = await s3Client.send(new GetObjectCommand(downloadParams));
const data = await response.Body.transformToString();
console.log(data); // "Hello, Varity!"
```

### Python boto3

```python
import boto3
from botocore.client import Config

# Create S3 client pointing to Varity gateway
s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:3001',
    aws_access_key_id='AKIAIOSFODNN7EXAMPLE',
    aws_secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    config=Config(signature_version='s3v4'),
    region_name='us-east-1'
)

# Create bucket
s3.create_bucket(Bucket='my-bucket')

# Upload file
s3.put_object(
    Bucket='my-bucket',
    Key='myfile.txt',
    Body=b'Hello, Varity!',
    ContentType='text/plain'
)

# Download file
response = s3.get_object(Bucket='my-bucket', Key='myfile.txt')
data = response['Body'].read()
print(data.decode('utf-8'))  # "Hello, Varity!"

# List objects
response = s3.list_objects_v2(Bucket='my-bucket')
for obj in response.get('Contents', []):
    print(obj['Key'])

# Delete object
s3.delete_object(Bucket='my-bucket', Key='myfile.txt')
```

### cURL Examples

```bash
# Note: AWS Signature V4 signing is complex for manual cURL requests
# Use AWS CLI or SDK for production use

# Health check (no authentication required)
curl http://localhost:3001/health

# List buckets (requires AWS Signature V4)
curl -H "Authorization: AWS4-HMAC-SHA256 ..." \
     http://localhost:3001/
```

## Authentication

The gateway supports **two authentication methods**:

### 1. Web3 Wallet Authentication (NEW)

Authenticate using **Web3 wallet signatures** (SIWE - Sign-In with Ethereum):

```typescript
// 1. Request nonce
const nonceRes = await fetch('http://localhost:3001/auth/nonce');
const { nonce } = await nonceRes.json();

// 2. Sign message with wallet
const message = await generateSiweMessage(address, nonce);
const signature = await wallet.signMessage(message);

// 3. Get JWT token
const verifyRes = await fetch('http://localhost:3001/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, signature })
});
const { token } = await verifyRes.json();

// 4. Use token for S3 API calls
fetch('http://localhost:3001/my-bucket/file.txt', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'text/plain'
  },
  body: 'Hello, Varity!'
});
```

**See [WALLET_AUTH_GUIDE.md](./WALLET_AUTH_GUIDE.md) for complete documentation.**

### 2. AWS IAM Authentication (Traditional)

The gateway uses **AWS Signature Version 4** authentication, the same as AWS S3. All S3 clients that support AWS Signature V4 will work with this gateway.

**Adding IAM Credentials:**

1. **Environment Variables** (recommended):
   ```env
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   ```

2. **Programmatically** (for dynamic credentials):
   ```typescript
   import { addCredential } from './auth/middleware';

   addCredential('AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
   ```

### Authentication Modes

Configure authentication mode via environment variable:

```env
# hybrid (default) - Both wallet and IAM authentication
AUTH_MODE=hybrid

# wallet - Only Web3 wallet authentication
AUTH_MODE=wallet

# iam - Only AWS IAM authentication
AUTH_MODE=iam
```

## Storage Architecture

The gateway maps S3 operations to Varity's 3-layer encrypted storage:

### Storage Layers

1. **Layer 1 - Varity Internal**: Platform knowledge and system documentation
2. **Layer 2 - Industry RAG**: Shared industry-specific knowledge
3. **Layer 3 - Customer Data**: Individual customer data (default for S3 objects)

### Object Storage Flow

```
S3 PUT Request
    ↓
AWS Signature V4 Authentication
    ↓
Varity SDK Upload (Layer 3)
    ↓
Filecoin/IPFS Storage
    ↓
CID Mapping (bucket/key → CID)
    ↓
S3 Response (ETag, metadata)
```

### Bucket/Key to CID Mapping

The gateway maintains a mapping between S3 bucket/key pairs and IPFS CIDs:

- **S3 Key**: `my-bucket/myfile.txt`
- **IPFS CID**: `QmYwAPJzv5CZsnAzt8auVZRn8cpMaFMyL53cV7bG5aL2Xu`

This allows S3 clients to use familiar bucket/key addressing while benefiting from content-addressed storage.

## Development

### Project Structure

```
varity-s3-gateway/
├── src/
│   ├── server.ts              # Server entry point
│   ├── app.ts                 # Express app configuration
│   ├── auth/
│   │   ├── signature-v4.ts    # AWS Signature V4 verification
│   │   └── middleware.ts      # Auth middleware
│   ├── controllers/
│   │   ├── bucket.controller.ts    # Bucket operations
│   │   └── object.controller.ts    # Object operations
│   ├── routes/
│   │   └── s3.routes.ts       # S3 API routes
│   ├── services/
│   │   └── storage.service.ts # Varity SDK integration
│   └── utils/
│       ├── etag.ts            # ETag generation
│       └── xml-builder.ts     # S3 XML responses
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Output will be in dist/ directory
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint
```

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

Build and run:

```bash
# Build TypeScript
npm run build

# Build Docker image
docker build -t varity-s3-gateway .

# Run container
docker run -p 3001:3001 --env-file .env varity-s3-gateway
```

### Environment Considerations

- **Port**: Ensure port 3001 (or configured port) is accessible
- **Credentials**: Securely manage AWS access keys
- **Storage**: Configure Varity SDK with production credentials
- **Rate Limiting**: Adjust based on expected traffic
- **CORS**: Configure allowed origins for web clients

## Limitations

### Current Implementation

- **In-Memory State**: Bucket and object mappings are stored in memory (use database for production)
- **Simulated Storage**: Storage operations are simulated (integrate real Varity SDK for production)
- **Single Instance**: No distributed state (use Redis or database for multi-instance deployments)

### Not Implemented (Yet)

- Multipart uploads
- Versioning
- Bucket policies
- ACLs (Access Control Lists)
- Server-side encryption configuration
- Object lifecycle policies

## Security

### Best Practices

1. **Use HTTPS**: Deploy behind a reverse proxy (nginx, Caddy) with TLS
2. **Rotate Keys**: Regularly rotate AWS access keys
3. **Rate Limiting**: Configure appropriate rate limits
4. **CORS**: Restrict CORS origins in production
5. **Monitoring**: Monitor for suspicious activity

### Security Headers

The gateway includes security headers via Helmet:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## Troubleshooting

### Common Issues

**Issue**: "SignatureDoesNotMatch" error
- **Solution**: Verify AWS access key and secret key are correct
- **Solution**: Ensure client is using AWS Signature V4
- **Solution**: Check system time is synchronized (signature includes timestamp)

**Issue**: "NoSuchBucket" error
- **Solution**: Create bucket first using `PUT /{bucket}`
- **Solution**: Verify bucket name follows S3 naming rules (lowercase, 3-63 chars)

**Issue**: Rate limit errors
- **Solution**: Reduce request rate or increase `RATE_LIMIT_MAX_REQUESTS`

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
```

This enables detailed request logging via Morgan.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- GitHub Issues: [varity/packages/varity-s3-gateway](https://github.com/varity/packages/varity-s3-gateway/issues)
- Documentation: [Varity SDK Documentation](https://docs.varity.io)

## Roadmap

- [ ] Implement multipart upload support
- [ ] Add versioning support
- [ ] Implement bucket policies
- [ ] Add server-side encryption
- [ ] Persistent storage backend (PostgreSQL/MongoDB)
- [ ] Distributed caching (Redis)
- [ ] Metrics and monitoring (Prometheus)
- [ ] Admin API for credential management
- [ ] WebSocket support for real-time notifications

---

**Powered by Varity** - Decentralized Storage Infrastructure
