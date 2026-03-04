# Known Issues — Varity DB Proxy v1.0.2

> **Last Updated:** February 11, 2026
> **Docker Image:** `ghcr.io/varity-labs/db-proxy:1.0.2` (GHCR)
> **Status:** LIVE at `http://provider.akashprovid.com:31782` (Akash DSEQ 25483708, ~$2.87/mo)
> **Architecture:** 2-service stack (PostgreSQL + db-proxy) — down from 7 services

---

## Architecture Change (Feb 11, 2026): 7 Services → 2 Services

The previous 7-service deployment (PostgreSQL, PostgREST, GoTrue, Studio, Storage, Meta, db-proxy) was persistently crashing on Akash. Root cause analysis revealed:

### Why 5 Services Were Removed

| Service | Why It Was Unnecessary |
|---------|----------------------|
| **PostgREST** | The db-proxy IS the REST API — it handles all CRUD via the `pg` driver directly |
| **GoTrue** | Varity uses Privy for auth, not Supabase auth |
| **Studio** | Web UI for database management — developer tool, not needed for apps |
| **Storage** | File storage API — db-proxy only handles JSON documents |
| **Meta** | Metadata API used only by Studio |

### Root Causes Fixed

| Bug | Problem | Fix |
|-----|---------|-----|
| **`/dev/shm` crash** | Akash has no `shm_size` parameter — Docker defaults to 64MB. PostgreSQL parallel queries exceed this and crash. All 6 dependent services then cascade crash. | `max_parallel_workers_per_gather=0` and `max_parallel_workers=0` in PostgreSQL startup args |
| **Node.js OOM** | Node.js 20 defaults to ~1.5GB V8 heap. Container limit = 512Mi. OOM killer fires (exit code 137). | `--max-old-space-size=384` in SDL command |
| **HEALTHCHECK timing** | Dockerfile `--start-period=5s` but actual startup is 90+ seconds (sleep + DB connect). Docker marks unhealthy too early. | Changed to `--start-period=120s` |
| **Image 1.0.1 missing retry** | Deployed image didn't have `waitForDatabase()`. If PostgreSQL wasn't ready after the sleep, proxy crashed immediately. | Built image 1.0.2 with current source code |
| **Cascading failures** | 6 services crash-looping simultaneously overwhelmed the Akash provider | Only 1 service (db-proxy) depends on PostgreSQL now |

### Resource Comparison

| Resource | 7-Service Stack | 2-Service Stack |
|----------|-----------------|-----------------|
| CPU | 5 units | 1.5 units |
| RAM | 7Gi | 2.5Gi |
| Persistent storage | 55Gi | 10Gi |
| Containers | 7 | 2 |
| Estimated cost | ~$10/month | ~$3-4/month |

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| `POST /db/:collection/add` | Working | Insert documents with auto-generated UUID |
| `GET /db/:collection/get` | Working | Query with limit, offset, orderBy |
| `PUT /db/:collection/update/:id` | Working | Update document by UUID |
| `DELETE /db/:collection/delete/:id` | Working | Delete document by UUID |
| `GET /health` | Working | Deep health check — verifies DB connectivity with `SELECT 1` |
| JWT Authentication | Working | Bearer token with appId claim |
| Schema Isolation | Working | Each app gets its own PostgreSQL schema |
| Rate Limiting | Working | 100 req/min per IP |
| SQL Injection Protection | Working | Parameterized queries, allowlisted orderBy, quoteIdent() |
| JSONB Handling | Working | Handles both string and object JSONB from pg driver |
| Connection Retry | Working | `waitForDatabase()` retries 30 times (90s) on startup |

## What Doesn't Work

### 1. Token Generation (Development Only)
`POST /generate-token` is only available when `NODE_ENV !== 'production'`.

### 2. No Monitoring
No health check automation or alerting.

### 3. In-Memory State Only
Schema and table creation cached in-memory. Restart clears cache (tables recreated via `CREATE IF NOT EXISTS`).

## Deployment Checklist

```bash
# 1. Build TypeScript
cd services/varity-db-proxy
npm run build

# 2. Build Docker image
docker build -t ghcr.io/varity-labs/db-proxy:1.0.2 .
docker push ghcr.io/varity-labs/db-proxy:1.0.2

# 3. Deploy to Akash Console
# Upload deploy.yaml → Accept bid → Note forwarded ports
# DB proxy gets port 81 (TCP forwarded → random port)

# 4. Test
curl http://<provider-url>:<forwarded-port>/health
# Expected: {"status":"healthy","service":"varity-db-proxy",...}
# 503 with {"status":"unhealthy"} means DB is unreachable

# 5. Update SDK + CLI with new DB proxy URL
# In cli/varietykit/services/credentials.py:
#   'db_proxy_url': 'http://<provider-url>:<forwarded-port>'
# In cli/varitykit/services/credentials.py:
#   'db_proxy_url': 'http://<provider-url>:<forwarded-port>'
# In packages/core/varity-sdk/src/database/index.ts:
#   default URL fallback

# 6. Monitor for 24+ hours
# Check Akash Console logs for exit code 137 (OOM) or "No space left on device"
```

## Credentials Reference

| Credential | Value | Used By |
|------------|-------|---------|
| `POSTGRES_PASSWORD` | (set via env var) | PostgreSQL, db-proxy |
| `JWT_SECRET` (db-proxy) | (set via env var) | db-proxy, CLI (credentials.py) |

## Security

- JWT authentication on all `/db` routes
- Schema isolation per app (PostgreSQL schemas)
- SQL injection protection (parameterized queries, allowlisted columns, quoteIdent)
- Row Level Security (RLS) enabled on all tables
- Rate limiting (100 req/min)
- Non-root Docker user
- Deep health check (returns 503 if DB is unreachable)

## Reporting Issues

Please report issues at: https://github.com/varity-labs/varity-sdk/issues
