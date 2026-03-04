# @varity-labs/types

[![npm](https://img.shields.io/npm/v/@varity-labs/types)](https://www.npmjs.com/package/@varity-labs/types)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

Shared TypeScript type definitions for the Varity ecosystem. Used by `@varity-labs/sdk`, `@varity-labs/ui-kit`, and applications built on Varity.

## Install

```bash
npm install @varity-labs/types
```

## Usage

```typescript
import type {
  APIResponse,
  UserProfile,
  DashboardConfig,
  KPI,
} from '@varity-labs/types'

// Type-safe API responses
const response: APIResponse<UserProfile> = await fetchUser()

// Dashboard configuration
const config: DashboardConfig = {
  widgets: [...],
  layout: { columns: 3 },
  theme: { mode: 'dark' }
}
```

## What's Included

### Common Utilities

Type-safe utility types for everyday TypeScript:

```typescript
import type {
  DeepPartial,
  DeepReadonly,
  Nullable,
  Optional,
  MaybePromise,
  RequireAtLeastOne,
  RequireExactlyOne,
} from '@varity-labs/types'
```

### Error Handling

```typescript
import {
  isErrorWithMessage,
  toError,
  getErrorMessage,
} from '@varity-labs/types'

try {
  await riskyOperation()
} catch (err) {
  const message = getErrorMessage(err) // Always returns a string
}
```

### API Types

Request/response patterns for building APIs:

- `APIResponse<T>`, `APIError`, `PaginatedResponse<T>`
- `HTTPMethod`, `APIRequestConfig`
- `UserProfile`, `LoginResponse`, `AuthToken`
- `KPI`, `TrendResponse`, `TimeSeriesDataPoint`
- `DashboardConfig`, `DashboardWidget`, `DashboardLayout`

### Storage Types

S3 and GCS compatible storage type definitions:

- `IStorageAdapter`, `UploadOptions`, `StorageResult`
- `S3CompatibleConfig`, `GCSCompatibleConfig`
- `MultiTierStorageConfig`, `TierConfig`
- Full S3 and GCS type definitions for buckets, objects, lifecycle, CORS, encryption

### Migration Types

Data migration job definitions:

- `MigrationJob`, `MigrationProgress`, `MigrationStats`
- `MigrationConfig`, `MigrationSchedule`

### Auth Types

Authentication and authorization:

- `AccessKey`, `Permission`, `AuthorizationPolicy`
- `Session`, `RateLimit`, `VarityAPIKey`
- AWS Signature V4 and GCS OAuth2 type definitions

## Used By

- `@varity-labs/sdk` — Core SDK
- `@varity-labs/ui-kit` — UI components
- `@varity-labs/mcp` — MCP server for AI editors (Cursor, Claude Code, VS Code)
- Applications built on Varity

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk)** — Build, deploy, and monetize apps 70% cheaper than AWS.

[Documentation](https://docs.varity.so) · [GitHub](https://github.com/varity-labs/varity-sdk) · [Discord](https://discord.gg/varity)

## License

MIT
