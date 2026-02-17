# Varity Gateway — Deployment Runbook

Total time: ~15 minutes. Cost: ~$1.50/mo on Akash.

---

## Prerequisites

- [ ] `varity.app` domain owned (you already have this)
- [ ] GitHub CLI authenticated (`gh auth status`)
- [ ] Akash Console account (console.akash.network)
- [ ] DB Proxy JWT secret (the `JWT_SECRET` value from DB Proxy Akash deployment)

---

## Step 1: Generate the DB Proxy Token (2 min)

The gateway needs a JWT to authenticate with the DB Proxy. Run this with your **production** JWT secret:

```bash
cd varity-sdk/cli
VARITY_DB_PROXY_JWT_SECRET="<YOUR_PRODUCTION_JWT_SECRET>" python3 -c "
from varitykit.services.credentials import generate_jwt_token
import os
os.environ['VARITY_DB_PROXY_JWT_SECRET'] = '<YOUR_PRODUCTION_JWT_SECRET>'
token = generate_jwt_token('system_gateway', expires_days=3650)
print('DB_PROXY_TOKEN=' + token)
"
```

Save the output `DB_PROXY_TOKEN=eyJ...` — you'll need it in Step 3.

**Don't have your production JWT secret?** Check the DB Proxy deployment in Akash Console — it's the `JWT_SECRET` env var.

---

## Step 2: Build & Push Docker Image (5 min)

**Option A: GitHub Actions (recommended)**

```bash
cd varity-sdk
git add services/varity-gateway .github/workflows/gateway-docker.yml
git commit -m "Add varity-gateway service"
git tag gateway-v1.0.0
git push origin main --tags
```

The workflow builds and pushes `ghcr.io/varity-labs/varity-gateway:1.0.0` automatically.

**Option B: Manual (if Docker Desktop is available)**

```bash
cd varity-sdk/services/varity-gateway
npm run build
docker build -t ghcr.io/varity-labs/varity-gateway:1.0.0 .
docker push ghcr.io/varity-labs/varity-gateway:1.0.0
```

---

## Step 3: Deploy to Akash (5 min)

1. Go to [console.akash.network](https://console.akash.network)
2. Create new deployment
3. Use the SDL from `deploy.yaml` with these env values filled in:

```yaml
env:
  - NODE_ENV=production
  - PORT=8080
  - DB_PROXY_URL=<your DB Proxy Akash URL>
  - DB_PROXY_TOKEN=<paste from Step 1>
  - GATEWAY_API_KEY=<generate: openssl rand -hex 32>
  - BASE_DOMAIN=varity.app
  - IPFS_BACKEND=ipfscdn.io
  - CACHE_TTL=300
```

Generate the `GATEWAY_API_KEY` with:
```bash
openssl rand -hex 32
```

**Save both `GATEWAY_API_KEY` and `DB_PROXY_TOKEN` — they're needed to update the CLI.**

4. Deploy. Note the Akash provider hostname (e.g., `{hash}.ingress.{provider}`)
5. Verify: `curl http://<akash-hostname>/health`

---

## Step 4: DNS Setup (3 min)

At your domain registrar for `varity.app`:

1. Add a CNAME record:
   ```
   app.varity.app  →  <akash-provider-hostname>
   ```

2. In Akash Console, add `accept: ["app.varity.app"]` to the SDL expose section.

3. Verify:
   ```bash
   dig app.varity.app
   curl https://app.varity.app/health
   ```

---

## Step 5: Update CLI Gateway URL (hand back to Claude)

Once deployed, provide:
1. The Akash gateway URL
2. The `GATEWAY_API_KEY` you generated

I'll update `cli/varitykit/services/gateway_client.py` with the real values.

---

## Verification

After all steps:

```bash
# Health check
curl https://app.varity.app/health

# Register a test domain
curl -X POST \
  -H "Authorization: Bearer <GATEWAY_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"hello-world","cid":"bafybeibj6lixxzqtsb45ysdjnupvqkufgdvzqbnvmhw2kf7cfkesy7r7d4"}' \
  https://app.varity.app/api/domains/register

# Visit in browser — path-based routing
open https://app.varity.app/hello-world
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| Gateway on Akash | ~$1.50/mo |
| DNS (CNAME record) | $0 (included) |
| TLS (Let's Encrypt) | $0 (free) |
| **Total** | **~$1.50/mo** |
