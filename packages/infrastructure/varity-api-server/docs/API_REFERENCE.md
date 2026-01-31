# Varity API Server - Complete API Reference

**Version**: 1.0.0
**Base URL**: `http://localhost:3001/api/v1`
**Authentication**: Bearer Token (SIWE)

## Table of Contents

1. [Authentication](#authentication)
2. [Health Checks](#health-checks)
3. [Storage](#storage)
4. [Analytics](#analytics)
5. [Templates](#templates)
6. [Dashboards](#dashboards)
7. [Notifications](#notifications)
8. [Webhooks](#webhooks)
9. [Monitoring](#monitoring)
10. [Export](#export)
11. [Cache](#cache)
12. [Compute](#compute)
13. [ZK Proofs](#zk-proofs)
14. [Error Codes](#error-codes)
15. [Rate Limits](#rate-limits)

---

## Authentication

All protected endpoints require authentication using SIWE (Sign-In With Ethereum).

### Get Nonce

Generate a nonce for SIWE message signing.

**Endpoint**: `POST /api/v1/auth/nonce`
**Auth Required**: No
**Rate Limit**: 5 requests / 15 minutes

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "chainId": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": {
      "domain": "localhost",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "statement": "Sign in to Varity Dashboard",
      "uri": "http://localhost:3001",
      "version": "1",
      "chainId": 1,
      "nonce": "abc123...",
      "issuedAt": "2025-10-31T12:00:00.000Z"
    },
    "nonce": "abc123..."
  }
}
```

### Login

Authenticate with SIWE signature.

**Endpoint**: `POST /api/v1/auth/login`
**Auth Required**: No
**Rate Limit**: 5 requests / 15 minutes

**Request Body**:
```json
{
  "message": {
    "domain": "localhost",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "statement": "Sign in to Varity Dashboard",
    "uri": "http://localhost:3001",
    "version": "1",
    "chainId": 1,
    "nonce": "abc123...",
    "issuedAt": "2025-10-31T12:00:00.000Z"
  },
  "signature": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "chainId": 1
    }
  }
}
```

### Other Auth Endpoints

- `POST /api/v1/auth/logout` - Logout (Auth Required)
- `GET /api/v1/auth/me` - Get current user (Auth Required)
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/verify` - Verify token

---

## Health Checks

### Basic Health Check

**Endpoint**: `GET /health`
**Auth Required**: No

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 123.456
}
```

### Detailed Health Check

**Endpoint**: `GET /health/detailed`
**Auth Required**: No

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "filecoin": true,
    "celestia": true,
    "arbitrum": true,
    "litProtocol": true,
    "akash": true
  },
  "memory": {
    "used": 123456789,
    "total": 987654321
  }
}
```

---

## Storage

### Upload Data to Filecoin

Upload data to one of three storage layers.

**Endpoint**: `POST /api/v1/storage/upload`
**Auth Required**: Optional (required for customer-data layer)
**Rate Limit**: 20 uploads / hour

**Request Body**:
```json
{
  "data": {
    "document": "content",
    "metadata": {}
  },
  "layer": "customer-data",
  "namespace": "customer-0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "encryption": true
}
```

**Parameters**:
- `layer`: "varity-internal" | "industry-rag" | "customer-data"
- `namespace`: Namespace identifier (min 3 chars)
- `encryption`: Boolean (default: true)

**Response**:
```json
{
  "success": true,
  "data": {
    "cid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    "namespace": "customer-0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "encrypted": true
  }
}
```

### Download Data

**Endpoint**: `GET /api/v1/storage/download/:cid`
**Auth Required**: Optional
**Rate Limit**: 100 requests / 15 minutes

**Response**:
```json
{
  "success": true,
  "data": {
    "cid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    "data": {},
    "retrieved_at": "2025-10-31T12:00:00.000Z"
  }
}
```

### Other Storage Endpoints

- `POST /api/v1/storage/pin/:cid` - Pin data (Auth Required, Strict Rate Limit)
- `GET /api/v1/storage/list` - List files (Auth Required)
- `GET /api/v1/storage/stats` - Storage statistics (Auth Required)
- `DELETE /api/v1/storage/:cid` - Delete data (Auth Required, Strict Rate Limit)

---

## Templates

### List Templates

**Endpoint**: `GET /api/v1/templates`
**Auth Required**: No
**Rate Limit**: 100 requests / 15 minutes

**Query Parameters**:
- `industry`: Filter by industry (iso-merchant, finance, healthcare, retail)
- `featured`: Filter featured templates (true/false)

**Response**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "iso-merchant-v1",
        "name": "ISO Merchant Dashboard",
        "industry": "iso-merchant",
        "description": "Complete dashboard for ISO merchant processing",
        "version": "1.0.0",
        "features": [
          "Merchant application processing",
          "Residual tracking",
          "Real-time analytics"
        ],
        "pricing": {
          "tier": "professional",
          "monthlyPrice": 299
        },
        "featured": true
      }
    ],
    "total": 4
  }
}
```

### Deploy Template

**Endpoint**: `POST /api/v1/templates/deploy`
**Auth Required**: Yes
**Rate Limit**: 10 requests / 15 minutes (Strict)

**Request Body**:
```json
{
  "industry": "iso-merchant",
  "customization": {
    "branding": {
      "companyName": "Acme Corp",
      "logoUrl": "https://example.com/logo.png",
      "primaryColor": "#0066cc"
    },
    "features": {
      "enableRAG": true,
      "enableForecasting": true
    }
  },
  "l3Network": "arbitrum-l3"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deploymentId": "deploy-1698765432-abc123",
    "status": "pending",
    "l3ContractAddress": "0x..."
  },
  "message": "Template deployment initiated successfully"
}
```

### Get Deployment Status

**Endpoint**: `GET /api/v1/templates/:id/status`
**Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "deploymentId": "deploy-1698765432-abc123",
    "status": "deployed",
    "progress": 100
  }
}
```

### Other Template Endpoints

- `GET /api/v1/templates/:industry` - Get templates by industry
- `GET /api/v1/templates/details/:id` - Get template details
- `POST /api/v1/templates/:id/customize` - Customize template (Auth Required)
- `POST /api/v1/templates/:id/clone` - Clone template (Auth Required)

---

## Dashboards

### Get Dashboard

**Endpoint**: `GET /api/v1/dashboards/:customerId`
**Auth Required**: Yes
**Rate Limit**: 100 requests / 15 minutes

**Response**:
```json
{
  "success": true,
  "data": {
    "customerId": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "deploymentId": "deploy-1698765432",
    "status": "active",
    "template": {
      "id": "iso-merchant-v1",
      "name": "ISO Merchant Dashboard",
      "industry": "iso-merchant",
      "version": "1.0.0"
    },
    "l3Network": {
      "chainId": 412346,
      "rpcUrl": "http://localhost:8545",
      "contractAddress": "0x..."
    },
    "storage": {
      "layer1": { "files": 0, "size": 0 },
      "layer2": { "files": 100, "size": 1024000 },
      "layer3": { "files": 50, "size": 512000 }
    },
    "features": {
      "rag": true,
      "analytics": true,
      "ai_assistant": true,
      "forecasting": true
    },
    "deployedAt": "2025-10-01T12:00:00.000Z",
    "lastUpdated": "2025-10-31T12:00:00.000Z"
  }
}
```

### Update Dashboard Config

**Endpoint**: `PUT /api/v1/dashboards/:customerId/config`
**Auth Required**: Yes

**Request Body**:
```json
{
  "config": {
    "branding": {
      "companyName": "Updated Name"
    },
    "features": {
      "enableRAG": true
    }
  }
}
```

### Other Dashboard Endpoints

- `GET /api/v1/dashboards` - List all dashboards (Admin only)
- `GET /api/v1/dashboards/:customerId/metrics` - Get metrics (Auth Required)
- `GET /api/v1/dashboards/:customerId/logs` - Get logs (Auth Required)
- `POST /api/v1/dashboards/:customerId/restart` - Restart services (Auth Required, Strict)
- `POST /api/v1/dashboards/:customerId/scale` - Scale resources (Auth Required, Strict)
- `DELETE /api/v1/dashboards/:customerId` - Deactivate (Auth Required, Strict)

---

## Analytics

### Get KPIs

**Endpoint**: `GET /api/v1/analytics/kpis`
**Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "revenue": 123456.78,
    "transactions": 1000,
    "users": 250,
    "growth": 15.5
  }
}
```

### Get Trends

**Endpoint**: `GET /api/v1/analytics/trends`
**Auth Required**: Yes

**Query Parameters**:
- `metric`: Metric name (required)
- `timeframe`: 7d | 30d | 90d | 1y (default: 30d)

**Response**:
```json
{
  "success": true,
  "data": {
    "metric": "revenue",
    "timeframe": "30d",
    "data": [
      { "date": "2025-10-01", "value": 1000 },
      { "date": "2025-10-02", "value": 1100 }
    ]
  }
}
```

### Other Analytics Endpoints

- `GET /api/v1/analytics/leaderboards` - Get leaderboards
- `GET /api/v1/analytics/revenue` - Revenue analytics (Auth Required)
- `GET /api/v1/analytics/customers` - Customer analytics (Auth Required)
- `GET /api/v1/analytics/transactions` - Transaction analytics (Auth Required)
- `GET /api/v1/analytics/forecast` - Forecasting (Auth Required)
- `GET /api/v1/analytics/anomalies` - Anomaly detection (Auth Required)

---

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | ValidationError | Invalid request parameters |
| 401 | UnauthorizedError | Missing or invalid authentication |
| 403 | ForbiddenError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 409 | ConflictError | Resource conflict |
| 429 | RateLimitError | Too many requests |
| 500 | InternalServerError | Server error |
| 503 | ServiceUnavailableError | Service temporarily unavailable |

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": {
      "body": {
        "address": ["address is required"]
      }
    }
  }
}
```

---

## Rate Limits

| Tier | Requests | Window | Endpoints |
|------|----------|--------|-----------|
| Standard | 100 | 15 min | Most endpoints |
| Strict | 10 | 15 min | Deploy, scale, restart |
| Auth | 5 | 15 min | Login, nonce |
| Upload | 20 | 1 hour | File uploads |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432
```

---

## Additional Endpoints

For complete endpoint documentation including:
- Notifications
- Webhooks
- Monitoring
- Export (PDF/CSV)
- Cache
- Compute (Akash)
- ZK Proofs (Celestia)

See the main README.md or OpenAPI documentation at `/docs`.

---

**Last Updated**: 2025-10-31
**API Version**: 1.0.0
**Server**: Varity API Server (Agent 2)
