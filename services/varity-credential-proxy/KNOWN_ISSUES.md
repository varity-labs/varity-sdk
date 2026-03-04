# Known Issues — Varity Credential Proxy v1.0.4

> **Last Updated:** February 10, 2026
> **Docker Image:** `ghcr.io/varity-labs/credential-proxy:1.0.4` (GHCR)
> **Status:** LIVE at `j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host`
> **Akash DSEQ:** 25403800

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| `GET /health` | Working | Health check (no auth required) |
| `GET /api/credentials/thirdweb` | Working | Returns hosting credentials (requires API key) |
| `GET /api/credentials/privy` | Working | Returns auth credentials (requires API key) |
| API Key Authentication | Working | Multi-tier: production, beta, dev |
| Rate Limiting | Working | 10/min, 100/hour, 500/day per IP |
| Abuse Detection | Working | Flags >50 req/hour from single IP |
| Credential Obfuscation | Working | Sensitive data never logged |
| Constant-Time Comparison | Working | Prevents timing attacks on API keys |
| Tier-based Filtering | Working | Dev tier only receives public client_id (no secret_key) |

## Security Features

1. **Tier-based credential filtering** — Dev tier receives only public client ID (empty secret key). Production and beta tiers get full credentials.
2. **No hardcoded dev API key** — Dev key must be set via environment variable.
3. **Defense-in-depth .dockerignore** — `*.yaml` exclusion prevents deploy files (with secrets) from being included in Docker builds.
4. **Constant-time comparison** — `secrets.compare_digest` prevents timing attacks on API keys.
5. **Rate limiting** — slowapi: 10/min, 100/hour, 500/day per IP.
6. **Request fingerprinting** — Tracks unique users for abuse detection.
7. **Non-root Docker user** — Runs as UID 1000.
8. **No secrets in image** — All credentials via environment variables.

## Known Limitations

### 1. No Automated Tests
The service has no automated test suite.

### 2. In-Memory Usage Tracking
The `UsageTracker` stores request history in-memory. A restart clears all tracking data.

### 3. No Monitoring
No health check automation or alerting.

### 4. Swagger Docs Disabled in Production
API documentation (`/docs`, `/redoc`) is disabled when `ENV=production`. Available in development mode only.

## Resolved Issues

### ~~Service is DOWN~~ — RESOLVED (Feb 10, 2026)
Previous Akash provider `dal.leet.haus` was unreachable. The service was redeployed and is now LIVE at `j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host`. All endpoints verified working:
- Health check: healthy
- Thirdweb credentials: returns client_id + secret_key
- Privy credentials: returns app_id
- Auth rejection: correctly rejects invalid/missing keys

## Reporting Issues

Please report issues at: https://github.com/varity-labs/varity-sdk/issues
