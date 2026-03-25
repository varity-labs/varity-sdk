import { Router, Response } from 'express';
import { config, RESERVED_SUBDOMAINS } from '../config';
import { resolveDomain } from '../services/resolver';
import { buildIpfsUrl, buildIpfsIndexUrl, sanitizePath } from '../services/ipfs';
import { notFoundHtml } from '../templates/not-found';
import { extractSubdomain } from './health';

export const proxyRouter = Router();

// Content types that are safe to serve inline; everything else forces download
const SAFE_CONTENT_TYPES = /^(text\/(html|css|plain|javascript)|application\/(javascript|json|pdf)|image\/|audio\/|video\/|font\/)/;

/**
 * Rewrite absolute asset paths in HTML so they resolve under the app prefix.
 *
 *   href="/logo.svg"  ->  href="/my-app/logo.svg"
 *   src="/_next/..."  ->  src="/my-app/_next/..."
 *
 * Skips protocol-relative URLs (//), full URLs (https://), and anchors (#).
 */
function rewriteHtmlPaths(html: string, appName: string): string {
  const prefix = `/${appName}`;
  const escaped = appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Skip paths already prefixed with /{appName}/ to avoid double-prefixing
  // when apps are built with basePath (e.g. Next.js NEXT_PUBLIC_BASE_PATH)
  const dq = new RegExp(`(href|src|action)="\\/(?!\\/|${escaped}\\/)`, 'g');
  const sq = new RegExp(`(href|src|action)='\\/(?!\\/|${escaped}\\/)`, 'g');
  return html
    .replace(dq, `$1="${prefix}/`)
    .replace(sq, `$1='${prefix}/`);
}

/**
 * Fetch content from IPFS and stream it to the client.
 *
 * Handles:
 * - Content-type detection and safe-type enforcement
 * - Cache headers (immutable for hashed assets, short TTL for HTML)
 * - SPA fallback (serves /index.html for non-file 404s)
 * - HTML path rewriting for path-based routing
 */
async function proxyIpfs(appName: string, assetPath: string, res: Response): Promise<void> {
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

    // Content type — only serve safe types inline
    const contentType = ipfsRes.headers.get('content-type') || 'application/octet-stream';
    if (SAFE_CONTENT_TYPES.test(contentType)) {
      res.type(contentType);
    } else {
      res.type('application/octet-stream');
    }

    // Cache policy — immutable for hashed assets, short TTL for HTML
    const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i.test(safePath);
    res.set('Cache-Control', isAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=60');

    const body = await ipfsRes.arrayBuffer();

    // Rewrite paths in HTML so assets resolve under /{appName}/
    if (contentType.includes('text/html')) {
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

// ---------------------------------------------------------------------------
// Path-based routing: varity.app/{app-name}[/path/to/asset]
// ---------------------------------------------------------------------------

proxyRouter.get('/:appName', async (req, res, next) => {
  if (RESERVED_SUBDOMAINS.has(req.params.appName.toLowerCase())) {
    next();
    return;
  }
  // Redirect to trailing slash so relative paths in static apps resolve correctly
  if (!req.originalUrl.endsWith('/')) {
    res.redirect(301, `/${req.params.appName}/`);
    return;
  }
  await proxyIpfs(req.params.appName.toLowerCase(), '', res);
});

proxyRouter.get('/:appName/*', async (req, res) => {
  const appName = req.params.appName.toLowerCase();
  const assetPath = req.url.split('/').slice(2).join('/');
  await proxyIpfs(appName, assetPath, res);
});

// ---------------------------------------------------------------------------
// Catch-all: subdomain-based routing (for future IP-leased deployments)
// ---------------------------------------------------------------------------

proxyRouter.use(async (req, res) => {
  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  await proxyIpfs(subdomain, req.path.replace(/^\//, ''), res);
});
