# @varity-labs/types

[![npm](https://img.shields.io/npm/v/@varity-labs/types)](https://www.npmjs.com/package/@varity-labs/types)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/varity-labs/varity-sdk/blob/main/LICENSE)

Shared TypeScript type definitions for the Varity ecosystem. Used by `@varity-labs/sdk`, `@varity-labs/ui-kit`, and applications built on Varity.

## Install

```bash
npm install @varity-labs/types
```

> Most developers do not need to install this directly -- it is included as a dependency of `@varity-labs/sdk`.

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
  id: 'main',
  title: 'Overview',
  widgets: [{ id: 'w1', type: 'chart', config: { metric: 'revenue' } }],
  layout: 'grid',
  theme: 'dark',
}
```

## What's Included

### Common Utilities

Type-safe utility types for everyday TypeScript:

```typescript
import type {
  DeepPartial,       // Makes all properties optional recursively
  DeepReadonly,      // Makes all properties readonly recursively
  Nullable,          // T | null
  Optional,          // T | undefined
  MaybePromise,      // T | Promise<T>
  RequireAtLeastOne, // Require at least one key from a type
  RequireExactlyOne, // Require exactly one key from a type
  JSONValue,         // Any JSON-serializable value
  JSONObject,        // Record<string, JSONValue>
  Metadata,          // Record<string, JSONValue>
} from '@varity-labs/types'
```

### Error Handling

Runtime error utilities (value exports, not just types):

```typescript
import {
  isErrorWithMessage,  // Type guard: does error have a .message?
  toError,             // Convert unknown to Error instance
  getErrorMessage,     // Get message string from unknown error
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
- `WebhookPayload`, `EventData`
- `UploadData`, `UploadResponse`

### Analytics Types

Dashboard and KPI type definitions:

- `KPI`, `KPIResult`, `TimeSeriesDataPoint`, `TrendResponse`
- `DashboardConfig`, `DashboardWidget`
- `DashboardLayout` (`'grid' | 'flex' | 'masonry' | string`)
- `DashboardTheme` (`'light' | 'dark' | 'auto' | string`)
- `AnalyticsPeriod`

### Storage Types

Storage adapter and configuration types:

- `IStorageAdapter`, `UploadOptions`, `StorageResult`
- `S3CompatibleConfig`, `GCSCompatibleConfig`
- `MultiTierStorageConfig`, `TierConfig`
- `StorageBackend`, `StorageTier`, `StorageLayer` (enums)
- Full S3 and GCS type definitions for buckets, objects, lifecycle, CORS, encryption

### Migration Types

Data migration job definitions:

- `MigrationJob`, `MigrationProgress`, `MigrationStats`
- `MigrationConfig`, `MigrationSchedule`
- `MigrationStatus`, `MigrationPhase` (enums)

### Auth Types

Authentication and authorization:

- `AccessKey`, `Permission`, `AuthorizationPolicy`
- `Session`, `RateLimit`, `VarityAPIKey`
- `AuthProvider`, `AccessKeyStatus`, `PermissionEffect`, `Action` (enums)
- `PermissionChecker` (utility class)
- AWS Signature V4 and GCS OAuth2 type definitions

## Used By

- `@varity-labs/sdk` -- Core SDK
- `@varity-labs/ui-kit` -- UI components
- `@varity-labs/mcp` -- MCP server for AI editors (Cursor, Claude Code, VS Code)
- Applications built on Varity

---

**Part of the [Varity SDK](https://github.com/varity-labs/varity-sdk).** Deploy any app, AI agent, or LLM in 60 seconds. 60-80% cheaper than AWS.

[Documentation](https://docs.varity.so) | [GitHub](https://github.com/varity-labs/varity-sdk) | [Discord](https://discord.gg/7vWsdwa2Bg)

## License

MIT
