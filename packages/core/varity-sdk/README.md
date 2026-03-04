# @varity-labs/sdk

[![npm](https://img.shields.io/npm/v/@varity-labs/sdk)](https://www.npmjs.com/package/@varity-labs/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

The core SDK for building applications on Varity. Zero-config database, built-in authentication credentials, and everything you need to go from idea to deployed app.

## Install

```bash
npm install @varity-labs/sdk
```

## Quick Start

### Database

Zero-config database that works out of the box — no API keys, no setup.

```typescript
import { db } from '@varity-labs/sdk'

// Create a collection
const users = db.collection('users')

// Add a document (returns the document with id and timestamps)
const user = await users.add({ name: 'Alice', email: 'alice@example.com', role: 'admin' })

// Get all documents (with optional limit, offset, orderBy)
const allUsers = await users.get()
const admins = await users.get({ limit: 10, orderBy: 'name' })

// Update by ID
await users.update(user.id, { role: 'superadmin' })

// Delete by ID
await users.delete(user.id)
```

### Credentials

Shared development credentials so you can start building immediately — no Privy or thirdweb account needed for development.

```typescript
import { VARITY_DEV_CREDENTIALS, resolveCredentials } from '@varity-labs/sdk'

// Zero-config: works immediately in development
const creds = resolveCredentials()
// Returns dev credentials automatically, or your custom credentials if set via env vars

// Check if using dev credentials
import { isUsingDevCredentials } from '@varity-labs/sdk'
if (isUsingDevCredentials()) {
  console.log('Using shared dev credentials — upgrade for production')
}
```

## Features

| Feature | Description |
|---------|-------------|
| **Database** | Zero-config collections with add, get, update, delete |
| **Credentials** | Shared dev credentials for instant development |
| **Validation** | Credential format validation and production checks |

## Environment Variables

Override dev credentials with your own for production:

```bash
# .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
NEXT_PUBLIC_VARITY_DB_TOKEN=your-db-token
```

The SDK checks `NEXT_PUBLIC_`, `VITE_`, and `REACT_APP_` prefixed variables automatically.

## API Reference

### Database

```typescript
import { db, Database, Collection } from '@varity-labs/sdk'

// db is a pre-configured instance
const collection = db.collection('my-collection')

await collection.add(data)              // → document with id, created_at, updated_at
await collection.get(options?)           // → array of documents (options: limit, offset, orderBy)
await collection.update(id, data)        // → updated document
await collection.delete(id)              // → true
```

### Credentials

```typescript
import {
  VARITY_DEV_CREDENTIALS,     // Default dev credentials
  resolveCredentials,          // Resolve credentials (env vars > dev defaults)
  validateCredentials,         // Validate credential format
  isUsingDevCredentials,       // Check if using dev credentials
  isProductionCredentials,     // Check if using production credentials
  getCredentialWarning,        // Get warning message for dev credentials
  logCredentialUsage,          // Log credential usage (once per session)
  getUpgradeInstructions,      // Get instructions for upgrading to production
} from '@varity-labs/sdk'
```

## Used By

- **[@varity-labs/ui-kit](../ui/varity-ui-kit/)** — React UI components
- **[@varity-labs/mcp](../../cli/varity-mcp/)** — MCP server for AI editors (Cursor, Claude Code, VS Code)
- **[SaaS Template](../../templates/saas-starter/)** — Full application template
- **[varitykit CLI](../../cli/)** — Command-line tool

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk)** — Build, deploy, and monetize apps 70% cheaper than AWS.

[Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs/varity-sdk) · [Discord](https://discord.gg/varity)

## License

MIT
