# Known Issues — @varity-labs/types@2.0.0-alpha.1

> **Last Updated:** February 10, 2026
> **Build Status:** PASSES (0 errors)
> **Test Status:** 31/31 pass (1 MVP test suite)

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| **Common utility types** | Working | JSONValue, JSONObject, Metadata, Nullable, Optional, etc. |
| **Runtime error utilities** | Working | `getErrorMessage()`, `isErrorWithMessage()`, `toError()` |
| **API types** | Working | APIResponse, APIError, PaginatedResponse, etc. |
| **Storage types** | Exported | S3/GCS/multi-tier types (needed by SDK internally) |
| **Auth types** | Exported | AccessKey, Permission, PermissionChecker, type guards |
| **Migration types** | Exported | MigrationJob, MigrationStatus, etc. |

## What MVP Apps Actually Need

Most developers will never import from `@varity-labs/types` directly. Types flow through `@varity-labs/sdk` and `@varity-labs/ui-kit`.

**If you do need types directly:**
```typescript
// Error handling (most common)
import { getErrorMessage, isErrorWithMessage, toError } from '@varity-labs/types';

// Utility types
import type { JSONValue, JSONObject, Metadata, Nullable, Optional } from '@varity-labs/types';

// API patterns
import type { APIResponse, APIError, PaginatedResponse } from '@varity-labs/types';
```

## What's Hidden

### 1. Thirdweb/Blockchain Types
All thirdweb integration types (~50 types) are commented out from the default export. They are NOT accessible via `import from '@varity-labs/types'`.

### 2. OracleData / PriceData
Crypto oracle and price feed types are hidden from the default API export. These are crypto-specific concepts not relevant for MVP apps.

### 3. Storage/Migration Constants
`SUPPORTED_STORAGE_BACKENDS` and `SUPPORTED_MIGRATION_SOURCES` constants are hidden since those modules are not functional yet.

## npm Package is Outdated

The published npm package still has:
- `thirdweb` as a runtime dependency (should be optional)
- Old description with "Multi-chain types, thirdweb integration types"
- Keywords including "web3", "thirdweb", "multi-chain"

**Will be republished** after all audit fixes are complete.

## Environment Variables

None required. This is a types-only package.

## Running Tests

```bash
node node_modules/jest/bin/jest.js --config jest.config.cjs
```

## Reporting Issues

Please report issues at: https://github.com/varity-labs/varity-sdk/issues
