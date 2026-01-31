# Varity S3 Gateway - Web3 Wallet Authentication Guide

Complete guide for using Web3 wallet authentication with the Varity S3-compatible gateway.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Modes](#authentication-modes)
3. [Setup & Configuration](#setup--configuration)
4. [Authentication Flow](#authentication-flow)
5. [API Reference](#api-reference)
6. [Access Control Lists (ACL)](#access-control-lists-acl)
7. [Migration Guide](#migration-guide)
8. [Security Considerations](#security-considerations)
9. [Examples](#examples)

## Overview

The Varity S3 Gateway now supports **Web3 wallet authentication** in addition to traditional AWS IAM authentication. This enables decentralized access control using wallet signatures and blockchain-based identity verification.

### Key Features

- **SIWE (Sign-In with Ethereum)** - EIP-4361 standard authentication
- **JWT Session Management** - Persistent sessions with token-based auth
- **Multi-signature Support** - Compatible with all EVM wallets (MetaMask, WalletConnect, etc.)
- **Hybrid Authentication** - Use both IAM and wallet auth simultaneously
- **Wallet-based ACLs** - Fine-grained permissions per wallet address
- **100% Backwards Compatible** - Existing AWS IAM auth still works

## Authentication Modes

The gateway supports three authentication modes:

### 1. Hybrid Mode (Default)

```env
AUTH_MODE=hybrid
```

- Supports **both** AWS IAM and Web3 wallet authentication
- Best for transitioning from IAM to wallet auth
- Recommended for production deployments

### 2. Wallet-Only Mode

```env
AUTH_MODE=wallet
```

- **Only** Web3 wallet authentication accepted
- AWS IAM authentication disabled
- Best for fully decentralized deployments

### 3. IAM-Only Mode

```env
AUTH_MODE=iam
```

- **Only** AWS IAM authentication accepted
- Web3 wallet authentication disabled
- Legacy mode for AWS-only environments

## Setup & Configuration

### 1. Install Dependencies

```bash
cd packages/varity-s3-gateway
pnpm install
```

Dependencies installed:
- `thirdweb@^5.112.0` - Web3 integration
- `siwe@^2.3.2` - Sign-In with Ethereum
- `jsonwebtoken@^9.0.2` - JWT token management
- `ethers@^6.13.0` - Ethereum utilities

### 2. Environment Configuration

Create or update `.env` file:

```env
# Authentication Mode
AUTH_MODE=hybrid

# Wallet Authentication
WALLET_AUTH_ENABLED=true
JWT_SECRET=your-secure-random-secret-key-minimum-32-characters
JWT_EXPIRY=24h

# Thirdweb Configuration
THIRDWEB_CLIENT_ID=acb17e07e34ab2b8317aa40cbb1b5e1d

# Varity L3 Chain
VARITY_CHAIN_ID=33529

# AWS IAM (optional in hybrid mode)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 3. Generate JWT Secret

```bash
# Generate secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start the Server

```bash
pnpm run dev
```

## Authentication Flow

### Web3 Wallet Authentication

```
┌─────────┐                ┌──────────┐                ┌─────────────┐
│ Client  │                │ Gateway  │                │  Wallet     │
└────┬────┘                └────┬─────┘                └─────┬───────┘
     │                          │                            │
     │  1. Request Nonce        │                            │
     ├─────────────────────────>│                            │
     │                          │                            │
     │  2. Return Nonce         │                            │
     │<─────────────────────────┤                            │
     │                          │                            │
     │  3. Generate SIWE Message│                            │
     ├─────────────────────────>│                            │
     │                          │                            │
     │  4. Return SIWE Message  │                            │
     │<─────────────────────────┤                            │
     │                          │                            │
     │  5. Request Signature    │                            │
     ├────────────────────────────────────────────────────────>│
     │                          │                            │
     │  6. User Signs Message   │                            │
     │<────────────────────────────────────────────────────────┤
     │                          │                            │
     │  7. Submit Signature     │                            │
     ├─────────────────────────>│                            │
     │                          │                            │
     │                          │  8. Verify Signature       │
     │                          │─────────┐                  │
     │                          │         │                  │
     │                          │<────────┘                  │
     │                          │                            │
     │  9. Return JWT Token     │                            │
     │<─────────────────────────┤                            │
     │                          │                            │
     │ 10. Use Token for API    │                            │
     ├─────────────────────────>│                            │
     │                          │                            │
```

### Step-by-Step Process

1. **Request Nonce**: Client requests a nonce from `/auth/nonce`
2. **Generate Message**: Client requests SIWE message from `/auth/message`
3. **Sign Message**: User signs SIWE message with their wallet
4. **Verify Signature**: Client submits signature to `/auth/verify`
5. **Receive Token**: Server returns JWT token
6. **Use Token**: Client uses `Authorization: Bearer <token>` for S3 API calls

## API Reference

### Authentication Endpoints

#### GET /auth/nonce

Generate a nonce for SIWE authentication.

**Response:**
```json
{
  "success": true,
  "nonce": "a1b2c3d4e5f6...",
  "expiresIn": 600
}
```

#### POST /auth/message

Generate SIWE message for signing.

**Request:**
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "domain": "localhost:3001",
  "uri": "http://localhost:3001",
  "chainId": 33529,
  "statement": "Sign in to Varity S3 Gateway"
}
```

**Response:**
```json
{
  "success": true,
  "message": "localhost:3001 wants you to sign in with your Ethereum account:\n0x1234...7890\n\nSign in to Varity S3 Gateway\n\nURI: http://localhost:3001\nVersion: 1\nChain ID: 33529\nNonce: a1b2c3d4e5f6...\nIssued At: 2025-01-14T12:00:00.000Z"
}
```

#### POST /auth/verify

Verify SIWE signature and create session.

**Request:**
```json
{
  "message": "<SIWE message>",
  "signature": "0xabcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x1234567890123456789012345678901234567890",
  "chainId": 33529,
  "session": {
    "address": "0x1234567890123456789012345678901234567890",
    "chainId": 33529,
    "nonce": "a1b2c3d4e5f6...",
    "issuedAt": "2025-01-14T12:00:00.000Z",
    "expirationTime": "2025-01-14T12:10:00.000Z"
  }
}
```

#### GET /auth/session

Verify current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "address": "0x1234567890123456789012345678901234567890",
  "chainId": 33529
}
```

#### GET /auth/status

Get authentication status and capabilities.

**Response:**
```json
{
  "success": true,
  "walletAuthEnabled": true,
  "authMode": "hybrid",
  "chainId": 33529,
  "features": {
    "siwe": true,
    "jwt": true,
    "iam": true
  }
}
```

### S3 API with Wallet Auth

All S3 API endpoints now support wallet authentication. Use the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**
```bash
# Create bucket with wallet auth
curl -X PUT http://localhost:3001/my-bucket \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Upload object with wallet auth
curl -X PUT http://localhost:3001/my-bucket/myfile.txt \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: text/plain" \
  --data "Hello, Varity!"
```

## Access Control Lists (ACL)

### Permissions

The gateway supports standard S3 permissions mapped to wallet addresses:

- `READ` - Download objects, list buckets
- `WRITE` - Upload objects
- `DELETE` - Delete objects
- `READ_ACP` - Read access control policy
- `WRITE_ACP` - Write access control policy (grant/revoke access)
- `FULL_CONTROL` - All permissions

### Roles

Pre-defined roles for easy permission management:

- `OWNER` - Full control (automatically assigned to bucket creator)
- `ADMIN` - All permissions except ownership transfer
- `WRITE` - Read and write objects
- `READ` - Read-only access
- `NONE` - No access

### Grant Access Example

```typescript
import { AccessControlService, S3Role } from './auth/acl';

// Grant write access to a wallet
AccessControlService.grantAccess(
  'my-bucket',
  '0x2222222222222222222222222222222222222222', // wallet to grant access
  S3Role.WRITE,
  '0x1111111111111111111111111111111111111111'  // bucket owner
);
```

### Check Permissions

```typescript
import { AccessControlService, S3Permission } from './auth/acl';

// Check if wallet has permission
const hasPermission = AccessControlService.hasPermission(
  'my-bucket',
  '0x2222222222222222222222222222222222222222',
  S3Permission.WRITE
);
```

## Migration Guide

### From IAM-Only to Hybrid Mode

1. **Update Environment:**
   ```env
   AUTH_MODE=hybrid
   WALLET_AUTH_ENABLED=true
   JWT_SECRET=<generate-new-secret>
   ```

2. **Restart Server:**
   ```bash
   pnpm start
   ```

3. **Test Both Methods:**
   - Verify existing IAM auth still works
   - Test wallet auth with new clients
   - Monitor logs for authentication method used

4. **Gradually Migrate:**
   - Update clients to use wallet auth
   - Keep IAM auth enabled during transition
   - Once all clients migrated, switch to wallet-only mode

### From Hybrid to Wallet-Only

1. **Verify All Clients Using Wallet Auth:**
   ```bash
   # Check server logs
   grep "wallet" /var/log/varity-s3-gateway.log
   ```

2. **Update Environment:**
   ```env
   AUTH_MODE=wallet
   ```

3. **Restart Server:**
   ```bash
   pnpm start
   ```

4. **Remove IAM Credentials (Optional):**
   - Can keep credentials in `.env` but they won't be used

## Security Considerations

### Best Practices

1. **JWT Secret Management:**
   - Use strong random secret (minimum 32 characters)
   - Never commit secret to version control
   - Rotate secret periodically
   - Use environment variables or secrets manager

2. **Token Expiry:**
   - Set appropriate `JWT_EXPIRY` (default: 24h)
   - Shorter expiry = more secure but more frequent re-auth
   - Consider user experience vs. security trade-offs

3. **Nonce Validation:**
   - Nonces expire after 10 minutes
   - Each nonce can only be used once
   - Automatic cleanup prevents memory leaks

4. **HTTPS Required:**
   - Always use HTTPS in production
   - JWT tokens are sensitive credentials
   - Deploy behind reverse proxy (nginx, Caddy) with TLS

5. **CORS Configuration:**
   - Restrict `CORS_ORIGIN` in production
   - Don't use `*` wildcard
   - Whitelist specific domains

6. **Rate Limiting:**
   - Configure appropriate rate limits
   - Protect against brute force attacks
   - Monitor for suspicious activity

### Threat Model

**Protected Against:**
- Replay attacks (nonce validation)
- Token forgery (HMAC signature)
- Unauthorized access (wallet-based ACLs)
- Man-in-the-middle (HTTPS + signature verification)

**Not Protected Against:**
- Compromised JWT secret
- Stolen/leaked tokens (use short expiry)
- Client-side wallet compromise
- Phishing attacks (user education required)

## Examples

### JavaScript/TypeScript Client

```typescript
import { ethers } from 'ethers';

async function authenticateWithWallet() {
  // 1. Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // 2. Request nonce
  const nonceRes = await fetch('http://localhost:3001/auth/nonce');
  const { nonce } = await nonceRes.json();

  // 3. Generate SIWE message
  const messageRes = await fetch('http://localhost:3001/auth/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      domain: window.location.host,
      uri: window.location.origin,
      chainId: 33529
    })
  });
  const { message } = await messageRes.json();

  // 4. Sign message
  const signature = await signer.signMessage(message);

  // 5. Verify signature and get token
  const verifyRes = await fetch('http://localhost:3001/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature })
  });
  const { token } = await verifyRes.json();

  // 6. Use token for S3 API calls
  return token;
}

async function uploadFile(token: string) {
  const response = await fetch('http://localhost:3001/my-bucket/file.txt', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain'
    },
    body: 'Hello, Varity!'
  });

  return response.ok;
}
```

### React Example

```typescript
import { useState, useEffect } from 'react';
import { useWallet } from '@thirdweb-dev/react';

function S3Gateway() {
  const { address, signer } = useWallet();
  const [token, setToken] = useState<string | null>(null);

  async function authenticate() {
    if (!address || !signer) return;

    // 1. Get nonce
    const nonceRes = await fetch('http://localhost:3001/auth/nonce');
    const { nonce } = await nonceRes.json();

    // 2. Generate message
    const messageRes = await fetch('http://localhost:3001/auth/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        domain: window.location.host,
        uri: window.location.origin
      })
    });
    const { message } = await messageRes.json();

    // 3. Sign message
    const signature = await signer.signMessage(message);

    // 4. Verify and get token
    const verifyRes = await fetch('http://localhost:3001/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature })
    });
    const { token } = await verifyRes.json();

    setToken(token);
  }

  return (
    <div>
      {!token ? (
        <button onClick={authenticate}>Connect Wallet</button>
      ) : (
        <p>Authenticated: {address}</p>
      )}
    </div>
  );
}
```

### Python Client

```python
from eth_account import Account
from eth_account.messages import encode_defunct
import requests

def authenticate_wallet(private_key: str):
    # 1. Setup account
    account = Account.from_key(private_key)
    address = account.address

    # 2. Get nonce
    nonce_res = requests.get('http://localhost:3001/auth/nonce')
    nonce = nonce_res.json()['nonce']

    # 3. Generate message
    message_res = requests.post('http://localhost:3001/auth/message', json={
        'address': address,
        'domain': 'localhost:3001',
        'uri': 'http://localhost:3001'
    })
    message = message_res.json()['message']

    # 4. Sign message
    message_hash = encode_defunct(text=message)
    signed = account.sign_message(message_hash)
    signature = signed.signature.hex()

    # 5. Verify and get token
    verify_res = requests.post('http://localhost:3001/auth/verify', json={
        'message': message,
        'signature': signature
    })
    token = verify_res.json()['token']

    return token

def upload_file(token: str):
    response = requests.put(
        'http://localhost:3001/my-bucket/file.txt',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'text/plain'
        },
        data='Hello, Varity!'
    )
    return response.ok
```

## Support

For issues and questions:

- GitHub Issues: [varity/packages/varity-s3-gateway/issues](https://github.com/varity/packages/varity-s3-gateway/issues)
- Documentation: [Varity SDK Documentation](https://docs.varity.io)
- Discord: [Varity Community](https://discord.gg/varity)

## License

MIT License - see LICENSE file for details

---

**Powered by Varity** - Decentralized Storage Infrastructure
