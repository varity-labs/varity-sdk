import express from 'express';
import cors from 'cors';
import { config, RESERVED_SUBDOMAINS } from './config';
import { resolveDomain, getCacheStats } from './domain-resolver';
import { registrationRouter, verifyApiKey } from './registration-api';
import { notFoundHtml } from './not-found';
import { buildIpfsUrl, buildIpfsIndexUrl, buildIpfsBaseUrl, sanitizePath } from './ipfs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

const app = express();

const ALLOWED_ORIGINS = [
  /^https?:\/\/(.+\.)?varity\.so$/,
  /^https?:\/\/(.+\.)?varity\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some((re) => re.test(origin))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  try {
    const response: Record<string, unknown> = {
      status: 'healthy',
      service: 'varity-gateway',
      version,
    };

    // Only expose diagnostics outside production
    if (config.server.env !== 'production') {
      const cacheStats = getCacheStats();
      response.environment = config.server.env;
      response.cache = { hits: cacheStats.hits, misses: cacheStats.misses, keys: cacheStats.keys };
    }

    res.json(response);
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// TLS check — reverse proxy calls GET /tls-check?domain=foo.varity.app before issuing a cert
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

// Domain resolution endpoint (authenticated — internal/debug use)
app.get('/resolve/:subdomain', verifyApiKey, async (req, res) => {
  const subdomain = req.params.subdomain.toLowerCase();
  const cid = await resolveDomain(subdomain);

  if (cid) {
    const backend = buildIpfsBaseUrl(cid, config.gateway.ipfsBackend);
    res.json({ cid, backend });
  } else {
    res.status(404).json({ error: 'not_found' });
  }
});

// Registration API routes
app.use(registrationRouter);

// Safe content types that can be served inline; everything else forces download
const SAFE_CONTENT_TYPES = /^(text\/(html|css|plain|javascript)|application\/(javascript|json|pdf)|image\/|audio\/|video\/|font\/)/;

/**
 * Rewrite absolute asset paths in HTML so they resolve under the app prefix.
 * e.g. href="/logo.svg" → href="/saas-template/logo.svg"
 *      src="/_next/..."  → src="/saas-template/_next/..."
 * Skips protocol-relative URLs (//), full URLs (https://), and anchors (#).
 */
function rewriteHtmlPaths(html: string, appName: string): string {
  const prefix = `/${appName}`;
  return html
    .replace(/(href|src|action)="\/(?!\/)/g, `$1="${prefix}/`)
    .replace(/(href|src|action)='\/(?!\/)/g, `$1='${prefix}/`);
}

// Shared IPFS proxy logic
async function proxyIpfs(appName: string, assetPath: string, res: express.Response): Promise<void> {
  const cid = await resolveDomain(appName);
  if (!cid) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  const safePath = sanitizePath(assetPath);
  const ipfsUrl = buildIpfsUrl(cid, safePath, config.gateway.ipfsBackend);

  try {
    const ipfsRes = await fetch(ipfsUrl, { signal: AbortSignal.timeout(15000) });

    if (!ipfsRes.ok) {
      // SPA fallback: if a non-file path returns 404, serve /index.html
      if (ipfsRes.status === 404 && safePath && !safePath.includes('.')) {
        const fallbackUrl = buildIpfsIndexUrl(cid, config.gateway.ipfsBackend);
        const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(10000) });

        if (fallbackRes.ok) {
          res.type('html');
          res.set('Cache-Control', 'public, max-age=60');
          const body = await fallbackRes.arrayBuffer();
          const html = rewriteHtmlPaths(Buffer.from(body).toString('utf-8'), appName);
          res.send(html);
          return;
        }
      }

      res.status(ipfsRes.status).send('Not found');
      return;
    }

    // Forward content type — only allow safe types inline, force download for others
    const contentType = ipfsRes.headers.get('content-type') || 'application/octet-stream';
    if (SAFE_CONTENT_TYPES.test(contentType)) {
      res.type(contentType);
    } else {
      res.type('application/octet-stream');
    }

    // Cache static assets longer, HTML shorter
    const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i.test(safePath);
    res.set('Cache-Control', isAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=60');

    const body = await ipfsRes.arrayBuffer();

    // Rewrite asset paths in HTML responses so they resolve under /{appName}/
    const isHtml = contentType.includes('text/html');
    if (isHtml) {
      const html = rewriteHtmlPaths(Buffer.from(body).toString('utf-8'), appName);
      res.send(html);
    } else {
      res.send(Buffer.from(body));
    }
  } catch (err) {
    console.error(`[proxy] Failed to fetch ${ipfsUrl}:`, err);
    res.status(502).send('Failed to fetch content');
  }
}

// Path-based routing: varity.app/{app-name} and varity.app/{app-name}/path/to/file
app.get('/:appName', async (req, res, next) => {
  // Skip API/system routes — use the canonical RESERVED_SUBDOMAINS set
  if (RESERVED_SUBDOMAINS.has(req.params.appName.toLowerCase())) {
    next();
    return;
  }
  await proxyIpfs(req.params.appName.toLowerCase(), '', res);
});

app.get('/:appName/*', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const assetPath = req.url.split('/').slice(2).join('/');
  await proxyIpfs(appName, assetPath, res);
});

// Catch-all: extract subdomain from Host header, proxy IPFS content (for future IP-leased deployments)
app.use(async (req, res) => {
  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  await proxyIpfs(subdomain, req.path.replace(/^\//, ''), res);
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
  console.log(`  Varity Gateway v${version}`);
  console.log(`  Environment:  ${config.server.env}`);
  console.log(`  Listening:    http://0.0.0.0:${config.server.port}`);
  console.log(`  Base domain:  ${config.gateway.baseDomain}`);
  console.log(`  IPFS backend: ${config.gateway.ipfsBackend}`);
  console.log(`  Cache TTL:    ${config.cache.ttlSeconds}s`);
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
