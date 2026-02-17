import express from 'express';
import cors from 'cors';
import { config } from './config';
import { resolveDomain, getCacheStats } from './domain-resolver';
import { registrationRouter } from './registration-api';
import { notFoundHtml } from './not-found';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  try {
    const cacheStats = getCacheStats();
    res.json({
      status: 'healthy',
      service: 'varity-gateway',
      version: '1.0.0',
      environment: config.server.env,
      cache: { hits: cacheStats.hits, misses: cacheStats.misses, keys: cacheStats.keys },
    });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// TLS check — Caddy calls GET /tls-check?domain=foo.varity.app before issuing a cert
app.get('/tls-check', async (req, res) => {
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
  if (cid) {
    res.status(200).send('OK');
  } else {
    res.status(404).send('Unknown subdomain');
  }
});

// Domain resolution endpoint (for internal/debug use)
app.get('/resolve/:subdomain', async (req, res) => {
  const subdomain = req.params.subdomain.toLowerCase();
  const cid = await resolveDomain(subdomain);

  if (cid) {
    res.json({ cid, backend: `https://${cid}.${config.gateway.ipfsBackend}` });
  } else {
    res.status(404).json({ error: 'not_found' });
  }
});

// Registration API routes
app.use(registrationRouter);

// Catch-all: extract subdomain from Host header, proxy IPFS content
app.use(async (req, res) => {
  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  const cid = await resolveDomain(subdomain);
  if (!cid) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  // Strip leading slash, default to empty (root)
  const path = req.path.replace(/^\//, '');
  const ipfsUrl = `https://${cid}.${config.gateway.ipfsBackend}/${path}`;

  try {
    const ipfsRes = await fetch(ipfsUrl, { signal: AbortSignal.timeout(15000) });

    if (!ipfsRes.ok) {
      // SPA fallback: if a non-file path returns 404, serve /index.html
      if (ipfsRes.status === 404 && path && !path.includes('.')) {
        const fallbackUrl = `https://${cid}.${config.gateway.ipfsBackend}/index.html`;
        const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(10000) });

        if (fallbackRes.ok) {
          res.type('html');
          res.set('Cache-Control', 'public, max-age=60');
          const body = await fallbackRes.arrayBuffer();
          res.send(Buffer.from(body));
          return;
        }
      }

      res.status(ipfsRes.status).send('Not found');
      return;
    }

    // Forward content type
    const contentType = ipfsRes.headers.get('content-type');
    if (contentType) res.type(contentType);

    // Cache static assets longer, HTML shorter
    const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i.test(path);
    res.set('Cache-Control', isAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=60');

    const body = await ipfsRes.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (err) {
    console.error(`[proxy] Failed to fetch ${ipfsUrl}:`, err);
    res.status(502).send('Failed to fetch content');
  }
});

function extractSubdomain(host: string): string | null {
  const suffix = `.${config.gateway.baseDomain}`;
  if (!host.endsWith(suffix)) return null;
  const sub = host.slice(0, -suffix.length).toLowerCase();
  if (!sub || sub.includes('.')) return null; // Only single-level subdomains
  return sub;
}

// Start server
const server = app.listen(config.server.port, '0.0.0.0', () => {
  console.log('');
  console.log('  Varity Gateway v1.0.0');
  console.log(`  Environment: ${config.server.env}`);
  console.log(`  Listening:   http://0.0.0.0:${config.server.port}`);
  console.log(`  Base domain: ${config.gateway.baseDomain}`);
  console.log(`  IPFS backend: ${config.gateway.ipfsBackend}`);
  console.log(`  DB Proxy:    ${config.dbProxy.url}`);
  console.log(`  Cache TTL:   ${config.cache.ttlSeconds}s`);
  console.log('');
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n  Received ${signal}, shutting down...`);
  server.close(() => {
    console.log('  Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
