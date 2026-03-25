# Known Issues — Varity DB Proxy v1.0.2

> **Last Updated:** March 8, 2026
> **Status:** LIVE at `http://provider.akashprovid.com:31782`
> **Architecture:** 2-service stack (PostgreSQL + db-proxy)

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| `POST /db/:collection/add` | Working | Insert documents with auto-generated UUID |
| `GET /db/:collection/get` | Working | Returns all docs; supports limit, offset, orderBy |
| `PUT /db/:collection/update/:id` | Working | Update document by UUID |
| `DELETE /db/:collection/delete/:id` | Working | Delete document by UUID |
| Health check (`GET /health`) | Working | Verifies DB connectivity |
| JWT authentication | Working | Bearer token with appId claim |
| Schema isolation | Working | Each app gets its own PostgreSQL schema |
| SQL injection protection | Working | Parameterized queries, allowlisted orderBy |
| Rate limiting | Working | 100 req/min per IP |

## Known Limitations

### 1. No Query Filters
There is no `where` filter or server-side query filtering. `GET /db/:collection/get` returns all documents in the collection. Filter results client-side after fetching.

### 2. No `.getById()` Method
There is no dedicated endpoint to fetch a single document by ID. Use `GET /db/:collection/get` and filter by ID client-side.

### 3. In-Memory Schema Cache
Schema and table creation state is cached in-memory. A restart clears the cache, but tables are recreated automatically via `CREATE IF NOT EXISTS` -- no data loss occurs.

### 4. Token Generation is Dev-Only
`POST /generate-token` is only available when `NODE_ENV !== 'production'`. In production, the CLI handles token generation automatically.

### 5. No External Monitoring
No automated alerting. Check `GET /health` manually or integrate your own monitoring.

## SDK Usage

```typescript
import { db } from '@varity-labs/sdk';

// Add a document
await db.collection('tasks').add({ title: 'My task', status: 'active' });

// Get all documents (no server-side filtering)
const docs = await db.collection('tasks').get();

// Update by ID
await db.collection('tasks').update(docId, { status: 'done' });

// Delete by ID
await db.collection('tasks').delete(docId);
```

## Reporting Issues

- GitHub: https://github.com/varity-labs/varity-sdk/issues
- Discord: https://discord.gg/7vWsdwa2Bg
