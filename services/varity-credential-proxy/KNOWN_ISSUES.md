# Known Issues — Varity Credential Proxy v1.1.1

> **Last Updated:** March 8, 2026
> **Status:** LIVE — 13/13 tests pass
> **Endpoint:** `j8t2mv79s9arr5pb6b4nkjmoh4.ingress.akash.tagus.host`

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Health check (`GET /health`) | Working | No auth required |
| Privy credentials | Working | Returns auth app_id |
| DB credentials | Working | Returns DB proxy connection info |
| API key authentication | Working | Multi-tier: production, beta, dev |
| Rate limiting | Working | 10/min, 100/hour, 500/day per IP |
| Abuse detection | Working | Flags >50 req/hour from single IP |
| Credential obfuscation | Working | Sensitive data never logged |
| Constant-time comparison | Working | Prevents timing attacks on API keys |
| Tier-based filtering | Working | Dev tier receives only public credentials |

## Known Limitations

### 1. In-Memory Usage Tracking
Request history is stored in-memory. A restart clears all tracking data. Does not affect functionality.

### 2. No External Monitoring
No automated alerting if the service goes down. Check `GET /health` manually or integrate your own monitoring.

### 3. Swagger Docs Disabled in Production
API documentation (`/docs`, `/redoc`) is only available in development mode.

## No Critical Issues

All 13 test cases pass. The service handles Privy and DB credential distribution reliably. No known critical bugs.

## Reporting Issues

- GitHub: https://github.com/varity-labs/varity-sdk/issues
- Discord: https://discord.gg/7vWsdwa2Bg
