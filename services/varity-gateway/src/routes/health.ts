import { Router } from 'express';
import { config } from '../config';
import { resolveDomain, getCacheStats } from '../services/resolver';
import { buildIpfsBaseUrl } from '../services/ipfs';
import { verifyApiKey } from '../middleware/auth';

// Read version once at startup
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');

export const healthRouter = Router();

/**
 * GET /health — Public health check.
 * Returns service status and version. Cache diagnostics are only
 * exposed outside production.
 */
healthRouter.get('/health', (_req, res) => {
  try {
    const response: Record<string, unknown> = {
      status: 'healthy',
      service: 'varity-gateway',
      version,
    };

    if (config.server.env !== 'production') {
      const stats = getCacheStats();
      response.environment = config.server.env;
      response.cache = { hits: stats.hits, misses: stats.misses, keys: stats.keys };
    }

    res.json(response);
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

/**
 * GET /tls-check?domain=foo.varity.app — Caddy on-demand TLS hook.
 * Returns 200 if the subdomain is registered, 404 otherwise. Caddy
 * calls this before issuing a Let's Encrypt certificate.
 */
healthRouter.get('/tls-check', async (req, res) => {
  const domain = req.query.domain as string;
  if (!domain) {
    res.status(400).send('Missing domain parameter');
    return;
  }

  const subdomain = extractSubdomain(domain);
  if (!subdomain) {
    res.status(404).send('Not a valid subdomain');
    return;
  }

  const cid = await resolveDomain(subdomain);
  res.status(cid ? 200 : 404).send(cid ? 'OK' : 'Unknown subdomain');
});

/**
 * GET /resolve/:subdomain — Authenticated debug endpoint.
 * Returns the CID and IPFS backend URL for a given subdomain.
 */
healthRouter.get('/resolve/:subdomain', verifyApiKey, async (req, res) => {
  const subdomain = req.params.subdomain.toLowerCase();
  const cid = await resolveDomain(subdomain);

  if (cid) {
    res.json({ cid, backend: buildIpfsBaseUrl(cid, config.gateway.ipfsBackend) });
  } else {
    res.status(404).json({ error: 'not_found' });
  }
});

/**
 * Extract a single-level subdomain from a hostname.
 * e.g. `my-app.varity.app` -> `my-app`, `varity.app` -> null
 */
function extractSubdomain(host: string): string | null {
  const suffix = `.${config.gateway.baseDomain}`;
  if (!host.endsWith(suffix)) return null;
  const sub = host.slice(0, -suffix.length).toLowerCase();
  if (!sub || sub.includes('.')) return null;
  return sub;
}

// Re-export for use in the catch-all subdomain route
export { extractSubdomain };
