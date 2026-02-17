# Varity API Server

The **Varity API Server** is the private REST API gateway that sits between the public Frontend SDK and the confidential Backend SDK. It provides secure, rate-limited access to Varity's 3-layer encrypted storage architecture, template deployment system, and DePin blockchain infrastructure.

## Architecture

```
┌─────────────────┐
│  Frontend SDK   │  (Public - Agent 1)
│  @varity/core   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  API Server     │  (Private Gateway - Agent 2) ← YOU ARE HERE
│  varity-api-    │
│  server         │
└────────┬────────┘
         │ Internal
         ▼
┌─────────────────┐
│  Backend SDK    │  (Confidential - Agent 3)
│  @varity/core-  │
│  backend        │
└─────────────────┘
```

## Features

- **100+ REST API Endpoints** across 16 categories
- **Thirdweb SDK Integration** (Smart contracts, wallets, chains)
- **SIWE Authentication** (Sign-In With Ethereum)
- **Rate Limiting** (standard, strict, auth-specific)
- **3-Layer Storage** (Varity Internal, Industry RAG, Customer Data)
- **Template Deployment** (ISO Merchant, Finance, Healthcare, Retail)
- **Dashboard Management** (Deploy, configure, monitor, scale)
- **Analytics & Forecasting** (KPIs, trends, predictions)
- **DePin Integration** (Filecoin, Akash, Celestia, Arbitrum L3)
- **Security Isolation** (Only Backend SDK can access confidential operations)

## Quick Start

### Prerequisites

- Node.js 18+
- TypeScript 5.3+
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# or
npm run watch
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Endpoint Categories

1. **Health** (`/health`)
   - `GET /health` - Basic health check
   - `GET /health/detailed` - Detailed system health
   - `GET /health/ready` - Kubernetes readiness probe
   - `GET /health/live` - Kubernetes liveness probe

2. **Authentication** (`/api/v1/auth`)
   - `POST /auth/nonce` - Get SIWE nonce
   - `POST /auth/login` - Login with SIWE signature
   - `POST /auth/logout` - Logout
   - `GET /auth/me` - Get current user
   - `POST /auth/refresh` - Refresh access token
   - `POST /auth/verify` - Verify token

3. **Storage** (`/api/v1/storage`)
   - `POST /storage/upload` - Upload to Filecoin
   - `GET /storage/download/:cid` - Download from Filecoin
   - `POST /storage/pin/:cid` - Pin data
   - `GET /storage/list` - List files
   - `GET /storage/stats` - Storage statistics
   - `DELETE /storage/:cid` - Delete data

4. **Analytics** (`/api/v1/analytics`)
   - `GET /analytics/kpis` - Key performance indicators
   - `GET /analytics/trends` - Trend analysis
   - `GET /analytics/leaderboards` - Leaderboards
   - `GET /analytics/revenue` - Revenue analytics
   - `GET /analytics/customers` - Customer analytics
   - `GET /analytics/transactions` - Transaction analytics
   - `GET /analytics/forecast` - Forecasting
   - `GET /analytics/anomalies` - Anomaly detection

5. **Templates** (`/api/v1/templates`)
   - `POST /templates/deploy` - Deploy template to L3
   - `GET /templates` - List templates
   - `GET /templates/:industry` - Get templates by industry
   - `GET /templates/details/:id` - Get template details
   - `POST /templates/:id/customize` - Customize template
   - `GET /templates/:id/status` - Deployment status
   - `POST /templates/:id/clone` - Clone template

6. **Dashboards** (`/api/v1/dashboards`)
   - `GET /dashboards` - List all dashboards (admin)
   - `GET /dashboards/:customerId` - Get dashboard
   - `PUT /dashboards/:customerId/config` - Update config
   - `GET /dashboards/:customerId/metrics` - Get metrics
   - `GET /dashboards/:customerId/logs` - Get logs
   - `POST /dashboards/:customerId/restart` - Restart dashboard
   - `POST /dashboards/:customerId/scale` - Scale resources
   - `DELETE /dashboards/:customerId` - Deactivate dashboard

7. **Notifications** (`/api/v1/notifications`)
   - `POST /notifications/send` - Send notification
   - `GET /notifications` - List notifications
   - `PUT /notifications/:id/read` - Mark as read

8. **Webhooks** (`/api/v1/webhooks`)
   - `POST /webhooks/register` - Register webhook
   - `GET /webhooks` - List webhooks
   - `DELETE /webhooks/:id` - Delete webhook

9. **Monitoring** (`/api/v1/monitoring`)
   - `GET /monitoring/metrics` - System metrics
   - `GET /monitoring/alerts` - Active alerts

10. **Export** (`/api/v1/export`)
    - `POST /export/pdf` - Export to PDF
    - `POST /export/csv` - Export to CSV

11. **Cache** (`/api/v1/cache`)
    - `GET /cache/:key` - Get cached value
    - `POST /cache` - Set cache value
    - `DELETE /cache/clear` - Clear cache

12. **Compute** (`/api/v1/compute`)
    - `POST /compute/deploy` - Deploy to Akash
    - `GET /compute/deployment/:id` - Get deployment status

13. **ZK Proofs** (`/api/v1/zk`)
    - `POST /zk/generate` - Generate ZK proof
    - `POST /zk/verify` - Verify ZK proof

14. **Contracts** (`/api/v1/contracts`) - **NEW: Thirdweb Integration**
    - `POST /contracts/deploy` - Deploy smart contract
    - `GET /contracts/:address` - Get contract details
    - `POST /contracts/:address/read` - Read from contract
    - `POST /contracts/:address/call` - Call contract function
    - `GET /contracts/:address/events` - Query contract events
    - `GET /contracts/:address/abi` - Get contract ABI
    - `POST /contracts/ipfs/upload` - Upload to IPFS
    - `POST /contracts/ipfs/download` - Download from IPFS

15. **Chains** (`/api/v1/chains`) - **NEW: Thirdweb Integration**
    - `GET /chains` - Get Varity L3 chain information
    - `GET /chains/supported` - List supported chains
    - `POST /chains/validate` - Validate chain ID
    - `GET /chains/:chainId` - Get chain by ID
    - `GET /chains/:chainId/block/:blockNumber` - Get block info
    - `GET /chains/:chainId/tx/:hash` - Get transaction info
    - `GET /chains/:chainId/gas` - Get gas prices

16. **Wallets** (`/api/v1/wallets`) - **NEW: Thirdweb Integration**
    - `GET /wallets/:address/balance` - Get wallet balance
    - `GET /wallets/:address/nfts` - Get wallet NFTs
    - `GET /wallets/:address/transactions` - Get transaction history
    - `GET /wallets/:address/tokens` - Get token balances
    - `POST /wallets/:address/send` - Send transaction

## Thirdweb Integration

The API server now includes comprehensive Thirdweb SDK integration for Varity L3 Testnet (Chain ID: 33529).

### Key Features

- **Native USDC Gas Token** (6 decimals, not 18!)
- **Smart Contract Deployment** with custom ABI/bytecode
- **Contract Interaction** (read/write operations)
- **Event Querying** with block range filtering
- **IPFS Integration** for decentralized storage
- **Chain Information** with full Varity L3 details
- **Wallet Operations** (balance, NFTs, transactions, tokens)
- **Transaction Sending** with USDC and ERC20 support

### Quick Example

```typescript
// Deploy a contract
const response = await fetch('http://localhost:3001/api/v1/contracts/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractType: 'custom',
    name: 'MyContract',
    abi: [...],
    bytecode: '0x...',
    privateKey: '0x...'
  })
});

// Get wallet balance
const balance = await fetch('http://localhost:3001/api/v1/wallets/0x.../balance');

// Query chain info
const chain = await fetch('http://localhost:3001/api/v1/chains');
```

### Documentation

See [docs/API_THIRDWEB.md](./docs/API_THIRDWEB.md) for complete Thirdweb API documentation.

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/auth/me
```

### SIWE Authentication Flow

1. **Get Nonce**
```bash
POST /api/v1/auth/nonce
{
  "address": "0x...",
  "chainId": 1
}
```

2. **Sign Message** (using wallet)
```javascript
const signature = await wallet.signMessage(message);
```

3. **Login**
```bash
POST /api/v1/auth/login
{
  "message": { ... },
  "signature": "0x..."
}
```

4. **Use Access Token**
```bash
Authorization: Bearer <accessToken>
```

## Rate Limiting

- **Standard**: 100 requests per 15 minutes
- **Strict**: 10 requests per 15 minutes (expensive operations)
- **Auth**: 5 attempts per 15 minutes (authentication)
- **Upload**: 20 uploads per hour

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `JWT_SECRET` - Secret for JWT signing (production only)

### Optional Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin
- `PINATA_API_KEY` - Filecoin Pinata API key
- `PINATA_SECRET_KEY` - Filecoin Pinata secret
- `AKASH_NODE_URL` - Akash network RPC
- `ARBITRUM_L3_RPC_URL` - Arbitrum L3 RPC (default: http://localhost:8545)
- `ARBITRUM_L3_CHAIN_ID` - Varity L3 Chain ID (default: 33529)
- `THIRDWEB_CLIENT_ID` - Thirdweb Client ID (default: a35636133eb5ec6f30eb9f4c15fce2f3)
- `THIRDWEB_SECRET_KEY` - Thirdweb Secret Key (optional)
- `CELESTIA_NODE_URL` - Celestia DA node

## Security

- **Helmet** - Security headers enabled by default
- **CORS** - Configurable origin restrictions
- **Rate Limiting** - Multiple tiers of rate limiting
- **JWT Authentication** - Secure token-based auth
- **SIWE** - Ethereum wallet authentication
- **Input Validation** - All inputs validated
- **Error Handling** - Sanitized error responses

## Backend SDK Integration

The API server is the **ONLY** component that should import and interact with `@varity/core-backend`. This provides security isolation:

```typescript
// ✅ CORRECT - Only in backend.service.ts
import { TemplateDeployer } from '@varity/core-backend';

// ❌ WRONG - Never import backend SDK in controllers/routes
```

All backend operations are routed through `src/services/backend.service.ts`.

## Development

### Project Structure

```
varity-api-server/
├── src/
│   ├── config/           # Configuration management
│   ├── controllers/      # Request handlers
│   ├── routes/           # Route definitions
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   └── server.ts         # Main server file
├── Dockerfile            # Docker build
├── docker-compose.yml    # Docker Compose config
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies
```

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Add route to `src/server.ts`
4. Add validation schema
5. Add tests

### Code Style

- Use TypeScript strict mode
- Follow async/await patterns
- Use `asyncHandler` for route handlers
- Validate all inputs
- Log operations appropriately

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- thirdweb.test.ts

# Run tests in watch mode
npm run test:watch
```

### Thirdweb Tests

The test suite includes comprehensive tests for:
- Contract deployment and interaction
- Chain information and validation
- Wallet operations
- IPFS upload/download
- Rate limiting
- Error handling
- USDC 6-decimal handling

See `tests/api/thirdweb.test.ts` for complete test coverage.

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t varity-api-server .

# Run container
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  varity-api-server
```

### Kubernetes Deployment

Health check endpoints are Kubernetes-ready:
- Readiness: `/health/ready`
- Liveness: `/health/live`

### Akash Network Deployment

See Agent 4 (Akash Deployer) for deployment scripts.

## Monitoring

- Request logging via Morgan
- Error tracking and logging
- Health checks for dependencies
- Performance metrics endpoint

## License

PROPRIETARY - Varity Internal Use Only

## Support

For issues or questions, contact the Varity development team.

---

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Agent**: Backend API Server Agent (Agent 2)
