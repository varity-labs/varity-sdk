# Varity Database Proxy

Zero-config database for Varity apps. Provides schema-isolated PostgreSQL access with JWT authentication and rate limiting.

## How It Works

```
Developer's App → @varity-labs/sdk → DB Proxy → PostgreSQL
```

Each app gets its own PostgreSQL schema (`app_<id>`), so data is fully isolated between apps. Tables and schemas are created automatically on first use. All data is stored as JSONB for flexible, schema-free documents.

## API

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/db/:collection/add` | Insert a document |
| GET | `/db/:collection/get` | Query documents |
| PUT | `/db/:collection/update/:id` | Update a document |
| DELETE | `/db/:collection/delete/:id` | Delete a document |
| GET | `/health` | Health check (verifies DB connectivity) |

### Query Parameters (GET)

- `limit` — max results (default: all)
- `offset` — skip N results
- `orderBy` — `created_at`, `updated_at`, or `id` (prefix with `-` for DESC)

### Health Check

Returns `200` with `{"status":"healthy"}` when the DB proxy and PostgreSQL are both operational. Returns `503` with `{"status":"unhealthy"}` when PostgreSQL is unreachable.

### Rate Limiting

- 100 requests per minute per IP on `/db` routes
- Returns `429 Too Many Requests` when exceeded

## Security

- **JWT Authentication** — Every request requires a valid Bearer token with an `appId` claim
- **Schema Isolation** — Each app operates in its own PostgreSQL schema (`app_<appId>`)
- **SQL Injection Protection** — All identifiers are quoted, ORDER BY is allowlisted, collection names and IDs are validated
- **Row Level Security** — PostgreSQL RLS is enabled on all tables
- **Rate Limiting** — 100 req/min per IP
- **Non-root Docker** — Container runs as unprivileged `varity` user
- **Error Masking** — Internal error details are hidden in production

## Local Development

```bash
# 1. Start PostgreSQL (Docker)
docker run -d --name varity-pg -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=varity -p 5432:5432 postgres:15

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret

# 3. Install and run
npm install
npm run dev
```

### Generate a Test Token

In development mode, the `/generate-token` endpoint is available:

```bash
curl -X POST http://localhost:3001/generate-token \
  -H "Content-Type: application/json" \
  -d '{"appId": "app_test123"}'
```

### Run Tests

```bash
npm test                       # Unit tests (34 tests)
npm run dev &                  # Start the proxy, then:
bash tests/test-proxy.sh       # Integration tests (8 tests)
```

## Deployment (Akash Network)

The DB proxy runs alongside PostgreSQL as a 2-service deployment on [Akash Network](https://akash.network).

```
deploy.yaml (2 services):
  db          → postgres:15-alpine (internal only)
  db-proxy    → ghcr.io/varity-labs/db-proxy:1.0.2 (public TCP)
```

1. Build and push the Docker image (see Deployment Checklist in KNOWN_ISSUES.md)
2. Upload `deploy.yaml` to [Akash Console](https://console.akash.network)
3. Accept a provider bid
4. Note the TCP-forwarded port for the db-proxy service

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USER` | No | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | **Yes** | — | PostgreSQL password |
| `DB_NAME` | No | `varity` | Database name |
| `JWT_SECRET` | **Yes** | — | Secret for JWT validation |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment (`production` disables `/generate-token` and masks errors) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |

## Document Schema

Each collection table has this structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `data` | JSONB | Your document data (indexed with GIN) |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated on modification |

## License

MIT - [Varity Labs](https://varity.so)
