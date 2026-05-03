# @varity-labs/sdk

[![npm](https://img.shields.io/npm/v/@varity-labs/sdk)](https://www.npmjs.com/package/@varity-labs/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

The core SDK for building applications on Varity. Zero-config database, managed credentials, and everything you need to go from idea to deployed app.

## Install

```bash
npm install @varity-labs/sdk
```

## Quick Start

### Database

Zero-config document database that works out of the box -- no API keys, no setup.

```typescript
import { db } from '@varity-labs/sdk'

// Get a typed collection
interface Product {
  name: string
  price: number
  stock: number
}
const products = db.collection<Product>('products')

// Add a document (returns the document with id and timestamps)
const product = await products.add({ name: 'Widget', price: 29.99, stock: 100 })
console.log(product.id)         // "550e8400-e29b-41d4-..."
console.log(product.created_at) // "2026-03-08T..."

// Query documents (with optional limit, offset, orderBy)
const all = await products.get()
const page = await products.get({ limit: 10, offset: 0 })
const sorted = await products.get({ orderBy: '-price' }) // descending

// Update by ID
await products.update(product.id, { price: 24.99, stock: 95 })

// Delete by ID
await products.delete(product.id)
```

### Credentials

Managed credentials so you can start building immediately -- zero configuration required.

```typescript
import { resolveCredentials, isUsingDevCredentials } from '@varity-labs/sdk'

// Works immediately in development -- no accounts or API keys needed
const creds = resolveCredentials()

// Check environment
if (isUsingDevCredentials()) {
  console.log('Using shared dev credentials')
}
```

In production, credentials are automatically injected by the `varitykit` CLI during deployment. You never need to manage them manually.

## Features

| Feature | Description |
|---------|-------------|
| **Database** | Zero-config document collections with add, get, update, delete |
| **Credentials** | Managed dev credentials for instant development |
| **Type Safety** | Full TypeScript support with generic collections |

## API Reference

### Database

```typescript
import { db, Database, Collection } from '@varity-labs/sdk'

// db is a pre-configured singleton (recommended)
const collection = db.collection<MyType>('my-collection')

await collection.add(data)              // Returns document with id, created_at, updated_at
await collection.get(options?)           // Returns array of documents
await collection.update(id, data)        // Returns updated document
await collection.delete(id)              // Returns true
```

**QueryOptions:**

| Option | Type | Description |
|--------|------|-------------|
| `limit` | `number` | Max documents to return |
| `offset` | `number` | Documents to skip (pagination) |
| `orderBy` | `string` | Sort field (`"name"` asc, `"-name"` desc) |

### Credentials

```typescript
import {
  VARITY_DEV_CREDENTIALS,     // Default dev credentials object
  resolveCredentials,          // Resolve credentials (env vars > dev defaults)
  validateCredentials,         // Validate credential format
  isUsingDevCredentials,       // Check if using dev credentials
  isProductionCredentials,     // Check if using production credentials
  getCredentialWarning,        // Get warning message for dev credentials
  logCredentialUsage,          // Log credential usage (once per session)
  getUpgradeInstructions,      // Get instructions for production deployment
} from '@varity-labs/sdk'
```

### Database Types

```typescript
import type {
  DatabaseConfig,
  QueryOptions,
  Document,
  CollectionResponse,
} from '@varity-labs/sdk'
```

## Related Packages

- [@varity-labs/ui-kit](https://www.npmjs.com/package/@varity-labs/ui-kit) -- React UI components and auth providers
- [@varity-labs/types](https://www.npmjs.com/package/@varity-labs/types) -- Shared TypeScript type definitions
- [@varity-labs/mcp](https://www.npmjs.com/package/@varity-labs/mcp) -- MCP server for AI editors (Cursor, Claude Code, VS Code)
- [create-varity-app](https://www.npmjs.com/package/create-varity-app) -- Project scaffolding

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk).** Deploy any app, AI agent, or LLM in 60 seconds. 60-80% cheaper than AWS.

[Documentation](https://docs.varity.so) | [GitHub](https://github.com/varity-labs/varity-sdk) | [Discord](https://discord.gg/7vWsdwa2Bg)

## License

MIT
