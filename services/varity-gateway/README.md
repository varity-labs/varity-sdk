# Varity Gateway

Custom domain gateway for Varity apps. Maps `varity.app/{app-name}` to hosted content with automatic TLS, SPA fallback, and domain ownership enforcement.

**Live:** https://varity.app

---

## Architecture

```
Client Request
    |
    v
  Caddy (TLS termination, security headers)
    |
    v
  Express (port 8080)
    |
    ├── /health, /tls-check, /resolve  →  Health & diagnostics
    ├── /api/domains/*                 →  Domain CRUD (auth required)
    └── /:appName/*                    →  Content proxy (public)
                                            |
                                            ├── Resolve subdomain → content ID (via DB Proxy + cache)
                                            ├── Fetch content from storage gateway
                                            ├── Rewrite HTML paths for /{appName}/ prefix
                                            └── SPA fallback (serve index.html for non-file 404s)
```

**Infrastructure:**
- **Hosting:** Distributed compute (dedicated IP lease)
- **TLS:** Let's Encrypt via Caddy (automatic)
- **Storage:** DB Proxy (PostgreSQL) for domain records
- **Content:** Distributed storage gateways
- **Cache:** In-memory (node-cache, 5-minute TTL)

---

## Project Structure

```
src/
  index.ts              Entry point — starts server, graceful shutdown
  app.ts                Express app — middleware, route mounting
  config.ts             Environment config, constants, reserved subdomains
  types.ts              TypeScript interfaces (DomainRecord)
  middleware/
    auth.ts             API key verification (timing-safe comparison)
  routes/
    health.ts           GET /health, /tls-check, /resolve/:subdomain
    domains.ts          Domain CRUD — check, list, register, update
    proxy.ts            Content proxy — path rewriting, SPA fallback, caching
  services/
    resolver.ts         Domain → content ID resolution with in-memory cache
    ipfs.ts             Storage URL building, path sanitization
  templates/
    not-found.ts        404 HTML page
```

---

## API Reference

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/tls-check?domain=app.varity.app` | Caddy on-demand TLS validation |
| GET | `/{app-name}` | Serve app's index.html |
| GET | `/{app-name}/{path}` | Serve app asset |

### Authenticated (requires `Authorization: Bearer <API_KEY>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/resolve/:subdomain` | Debug: resolve subdomain to content ID |
| GET | `/api/domains/check/:name?ownerId=` | Check subdomain availability |
| GET | `/api/domains/mine?ownerId=` | List domains owned by developer |
| POST | `/api/domains/register` | Register new subdomain |
| PUT | `/api/domains/update` | Update subdomain content (redeploy) |

### Request/Response Examples

**Register a domain:**
```bash
curl -X POST https://varity.app/api/domains/register \
  -H "Authorization: Bearer $GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"my-app","contentId":"content-hash-here","appName":"My App","ownerId":"owner-id"}'
```

**Update on redeploy:**
```bash
curl -X PUT https://varity.app/api/domains/update \
  -H "Authorization: Bearer $GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"my-app","contentId":"new-content-hash","ownerId":"owner-id"}'
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your DB Proxy URL and tokens

# Start dev server (auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | HTTP server port |
| `NODE_ENV` | No | `development` | Environment (`production` hides diagnostics) |
| `DB_PROXY_URL` | Yes | — | DB Proxy base URL |
| `DB_PROXY_TOKEN` | Yes | — | JWT token for DB Proxy authentication |
| `GATEWAY_API_KEY` | Yes | — | API key for domain management endpoints |
| `BASE_DOMAIN` | No | `varity.app` | Base domain for URL generation |
| `CACHE_TTL` | No | `300` | Domain cache TTL in seconds |

---

## Docker

```bash
# Build
docker build -t varity-gateway .

# Run
docker run -p 8080:8080 -p 8443:443 --env-file .env varity-gateway
```

The Docker image includes Caddy for TLS termination. In production, Caddy listens on ports 8081 (HTTP) and 8443 (HTTPS), reverse-proxying to the Express server on 8080.

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full deployment runbook.

**Quick summary:** Tag a release (`gateway-vX.Y.Z`), GitHub Actions builds and pushes to GHCR, deploy the image with an IP lease, point DNS A record to the leased IP.

---

## Security

- **Auth:** Timing-safe API key comparison (`crypto.timingSafeEqual`)
- **CORS:** Whitelist — only `*.varity.so`, `*.varity.app`, and `localhost`
- **Path traversal:** `decodeURIComponent` + `path.posix.normalize` + `..` rejection
- **Content ID validation:** Regex enforcement for valid content identifiers
- **Content types:** Unsafe MIME types forced to `application/octet-stream`
- **Reserved subdomains:** 26 reserved names (www, api, admin, etc.) blocked from registration
- **TLS:** Caddy auto-issues Let's Encrypt certificates with HSTS preload
- **Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`

---

## License

MIT
