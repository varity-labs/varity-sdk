# Varity Credential Proxy

> **SECURITY CRITICAL**: This service provides Varity's infrastructure credentials to the CLI.

## Purpose

Enable zero-config deployments by providing Varity's managed credentials to the `varitykit` CLI without requiring developers to create their own accounts on third-party services.

## Security Features

1. **API Key Authentication** - Multi-tier keys (production, beta, dev)
2. **Rate Limiting** - 10/min, 100/hour, 500/day per IP
3. **HTTPS Enforcement** - Required in production
4. **Request Fingerprinting** - Track unique users
5. **Usage Monitoring** - Detect abuse patterns
6. **No Credential Logging** - Secrets never logged
7. **Abuse Detection** - Automatic blocking of suspicious activity
8. **Tier-based Filtering** - Dev tier only gets public client_id (no secret key)

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example and edit
cp .env.example .env

# Edit .env and add your service credentials
# Generate secure API keys for VARITY_CLI_PRODUCTION_KEY and VARITY_CLI_BETA_KEY
```

**CRITICAL:** Add actual service credentials to `.env` before starting!

### 3. Run Service

```bash
# Development
python -m uvicorn src.main:app --reload --port 8001

# Or
python src/main.py

# Production
ENV=production python -m uvicorn src.main:app --host 0.0.0.0 --port 8001
```

## Testing

### Health Check

```bash
curl http://localhost:8001/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "varity-credential-proxy",
  "version": "1.1.1",
  "environment": "development"
}
```

### Get Credentials

```bash
curl -H "Authorization: Bearer <YOUR_API_KEY>" \
  http://localhost:8001/api/credentials/storage
```

Expected:
```json
{
  "secret_key": "your-secret-key",
  "client_id": "your-client-id"
}
```

## API Endpoints

### `GET /health`

Health check endpoint. No authentication required.

**Response:**
```json
{
  "status": "healthy",
  "service": "varity-credential-proxy",
  "version": "1.1.1",
  "environment": "development"
}
```

### `GET /api/credentials/storage`

Get Varity's storage credentials.

**Authentication:** Bearer token required

**Rate Limits:**
- 10 requests per minute per IP
- 100 requests per hour per IP
- 500 requests per day per IP

**Headers:**
```
Authorization: Bearer <API_KEY>
```

**Response:**
```json
{
  "secret_key": "storage-secret-key",
  "client_id": "storage-client-id"
}
```

### `GET /api/credentials/auth`

Get Varity's auth provider app ID.

**Authentication:** Bearer token required

**Rate Limits:** Same as above

**Headers:**
```
Authorization: Bearer <API_KEY>
```

**Response:**
```json
{
  "app_id": "auth-app-id"
}
```

## Security

### API Key Tiers

1. **Production** (`VARITY_CLI_PRODUCTION_KEY`)
   - Used by published CLI releases
   - Rotate every 90 days
   - Highest security

2. **Beta** (`VARITY_CLI_BETA_KEY`)
   - Used by beta testers
   - Rotate when needed
   - Medium security

3. **Dev** (`VARITY_CLI_DEV_KEY`)
   - Local development only
   - Can be shared
   - Low security
   - Only receives public client_id (no secret key)

### Rate Limiting

- **Per Minute:** 10 requests max
- **Per Hour:** 100 requests max
- **Per Day:** 500 requests max

Legitimate deployment: 1-5 requests
Abuse scenario: Hundreds of requests

### Abuse Detection

System monitors for suspicious patterns:
- \>50 requests/hour from single IP → Flagged
- Unusual request patterns → Logged
- Invalid API keys → Tracked

### What Gets Logged

**YES (Safe):**
- Request IP address
- API key tier (not the key itself)
- Request timestamp
- Request fingerprint hash

**NO (Never):**
- Actual API keys
- Actual credentials (secret keys)
- Authorization headers

## Deployment

### Production Deployment

**1. Build Docker Image:**
```bash
docker build -t ghcr.io/varity-labs/credential-proxy:1.1.1 .
docker push ghcr.io/varity-labs/credential-proxy:1.1.1
```

**2. Deploy:**
- Upload deployment YAML (contains secrets - private file)
- Select provider and accept bid
- Get production URL

**3. Update CLI:**
Update `varitykit` credential fetcher to use the production URL.

### Files

- `deploy.yaml` - Public template (no secrets, uses `${PLACEHOLDER}` vars)
- `deploy-production.yaml` - **PRIVATE** - Contains actual secrets for deployment (gitignored)
- `.env.example` - Template for local development

**Note:** `deploy-production.yaml` contains actual credentials and should NEVER be committed to public repos.

## Monitoring

Key metrics to track:
- Requests per minute
- Unique IPs per hour
- Failed authentication attempts
- Suspicious activity flags
- Credential usage count

Set up alerts for:
- Failed auth > 100/hour
- Requests > 1000/minute
- Suspicious patterns > 10/hour

## Troubleshooting

### "Credentials not configured on server"

**Problem:** Missing service credentials in `.env`

**Solution:** Add the actual credentials to `.env`

### "Invalid API key"

**Problem:** Wrong or missing API key in request

**Solution:** Check Authorization header has correct Bearer token

### "Too many requests"

**Problem:** Hit rate limit

**Solution:** Wait or check if legitimate use case needs higher limits

### "HTTPS required"

**Problem:** Using HTTP in production

**Solution:** Use HTTPS or set `ENV=development` for testing

## Security Checklist

Before production:
- [ ] Service credentials added to .env
- [ ] Production API keys generated (32+ chars, random)
- [ ] ENV=production set
- [ ] HTTPS configured
- [ ] Rate limits tested
- [ ] Monitoring set up
- [ ] Logs reviewed for credential leaks
- [ ] .env added to .gitignore

## Support

Issues: Report security concerns directly to security@varity.so

**DO NOT** open public GitHub issues for security vulnerabilities.
