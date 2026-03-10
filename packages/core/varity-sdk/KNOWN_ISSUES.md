# Known Issues — @varity-labs/sdk v2.0.0-alpha.1

> **Last Updated:** February 10, 2026
> **Status:** Beta — Pre-release

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| `import { db } from '@varity-labs/sdk'` | ✅ | Clean import, only MVP exports |
| `db.collection<T>('name')` | ✅ | Type-safe collections |
| `.add(data)` | ✅ | Insert documents (needs DB Proxy running) |
| `.get(options?)` | ✅ | Query with limit/offset/orderBy |
| `.update(id, data)` | ✅ | Partial updates |
| `.delete(id)` | ✅ | Delete by ID |
| `resolveCredentials()` | ✅ | Auto-resolves dev credentials |
| `isUsingDevCredentials()` | ✅ | Check if using shared dev creds |
| Build with TypeScript | ✅ | 0 errors |
| Tests | ✅ | 74/74 pass |

## What Doesn't Work

### ~~P0: Database Proxy is Down~~ RESOLVED

**Status:** LIVE at `http://provider.akashprovid.com:31782`

**Resolution (Feb 10, 2026):** Redeployed to Akash with fixed SDL. All 7 CRUD operations tested and passing. Health check, create, read, update, delete, and auth rejection all verified.

### P1: npm Package Metadata is Stale

**Issue:** The published npm package still shows blockchain-related keywords and description from v1. The local source has been cleaned up but hasn't been republished.

**Impact:** Cosmetic — the package works correctly, but `npmjs.com` listing shows outdated description.

### P1: Non-MVP Modules are Non-Functional

**Issue:** The SDK source contains 13 capability modules (Analytics, Auth, Storage, Cache, etc.) that are commented out from the default exports. These modules call backend API endpoints (`api.varity.so`) that don't exist yet.

**Impact:** None for beta testers — these modules are not exported from the default import path. If you import directly from source, they will throw runtime errors.

**These modules will be enabled in future releases when the backend infrastructure is ready.**

## Environment Variables

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `NEXT_PUBLIC_VARITY_DB_PROXY_URL` | Database proxy URL | No (has default) |
| `NEXT_PUBLIC_VARITY_APP_TOKEN` | JWT token for database auth | No (empty = warning) |
| `VITE_VARITY_DB_PROXY_URL` | Same as above, for Vite apps | No |
| `VITE_VARITY_APP_TOKEN` | Same as above, for Vite apps | No |
| `REACT_APP_VARITY_DB_PROXY_URL` | Same as above, for CRA apps | No |
| `REACT_APP_VARITY_APP_TOKEN` | Same as above, for CRA apps | No |

## How to Report Issues

- GitHub: https://github.com/varity-labs/varity-sdk/issues
- Discord: https://discord.gg/7vWsdwa2Bg
- Email: support@varity.so

## Contributing

If you find a bug or want to help fix a known issue:

1. Check this file for the current status
2. Open an issue or PR on GitHub
3. Focus on the `src/database/` directory — this is the MVP-critical code

The non-MVP modules in `src/modules/` are awaiting backend infrastructure. PRs for these modules are welcome but they cannot be tested end-to-end yet.
