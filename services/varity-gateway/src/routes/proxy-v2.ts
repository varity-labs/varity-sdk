/**
 * Multi-Deployment Proxy Router (v2)
 *
 * Supports IPFS, Akash, and Custom domain deployments
 * Backward compatible with existing IPFS-only deployments
 */

import { Router, Response, Request } from 'express';
import { config, RESERVED_SUBDOMAINS } from '../config';
import { resolveDomainRecord, DbUnavailableError } from '../services/resolver';
import { buildIpfsUrl, buildIpfsIndexUrl, sanitizePath } from '../services/ipfs';
import { rewriteHtmlPathsForApp } from '../services/html-path-rewrite';
import { proxyAkash, proxyCustom } from '../services/akash-proxy';
import { getDeploymentStatus } from '../services/akash-deploy';
import { notFoundHtml } from '../templates/not-found';
import { extractSubdomain } from './health';

export const proxyRouterV2 = Router();

// Re-export for import compatibility
const SAFE_CONTENT_TYPES = /^(text\/(html|css|plain|javascript)|application\/(javascript|json|pdf)|image\/|audio\/|video\/|font\/)/;

const ROOT_ASSET_PREFIXES = new Set([
  '_next',
  'assets',
  'build',
  'static',
  'favicon.ico',
  'manifest.json',
  'robots.txt',
  'vite.svg',
]);

function isRootAssetSegment(segment: string): boolean {
  return ROOT_ASSET_PREFIXES.has(segment.toLowerCase());
}

export function isAssetPath(assetPath: string): boolean {
  return /\.(js|mjs|css|map|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf|json|txt|xml)$/i
    .test(assetPath.split('?')[0] ?? assetPath);
}

export function appNameFromReferer(referer: string | undefined, baseDomain = config.gateway.baseDomain): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const host = url.hostname.toLowerCase();
    const base = baseDomain.toLowerCase();
    if (host !== base && !host.endsWith(`.${base}`)) return null;

    const firstPathSegment = url.pathname.split('/').filter(Boolean)[0];
    if (firstPathSegment && !RESERVED_SUBDOMAINS.has(firstPathSegment.toLowerCase())) {
      return firstPathSegment.toLowerCase();
    }

    const subdomain = extractSubdomain(host);
    return subdomain && !RESERVED_SUBDOMAINS.has(subdomain) ? subdomain : null;
  } catch {
    return null;
  }
}

async function proxyRootAssetFromReferer(
  rootSegment: string,
  restPath: string,
  req: Request,
  res: Response,
): Promise<boolean> {
  if (!isRootAssetSegment(rootSegment)) return false;

  const appName = appNameFromReferer(req.get('referer'));
  if (!appName) return false;

  const assetPath = restPath ? `${rootSegment}/${restPath}` : rootSegment;
  await proxyDeployment(appName, assetPath, req, res);
  return true;
}

function isUnresolvedAkashUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return true;
  return url.trim().toLowerCase().includes('deployment-unknown.akash.network');
}

/**
 * Proxy IPFS content (original logic, unchanged)
 */
async function proxyIpfs(
  appName: string,
  cid: string,
  assetPath: string,
  res: Response
): Promise<void> {
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
          const html = rewriteHtmlPathsForApp(Buffer.from(body).toString('utf-8'), appName);
          res.send(html);
          return;
        }
      }

      res.status(ipfsRes.status).send('Not found');
      return;
    }

    // Content type — only serve safe types inline
    const contentType = ipfsRes.headers.get('content-type') || 'application/octet-stream';
    if (isAssetPath(safePath) && contentType.includes('text/html')) {
      console.error(`[proxy-v2] Refusing HTML response for asset ${appName}/${safePath}`);
      res.status(502).type('text/plain').send('Asset response had invalid content type');
      return;
    }

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
      const html = rewriteHtmlPathsForApp(Buffer.from(body).toString('utf-8'), appName);
      res.send(html);
    } else {
      res.send(Buffer.from(body));
    }
  } catch (err) {
    console.error(`[proxy-v2] Failed to fetch ${ipfsUrl}:`, err);
    res.status(502).send('Failed to fetch content');
  }
}

/**
 * Universal proxy handler - routes to correct proxy based on deployment type
 */
async function proxyDeployment(
  appName: string,
  assetPath: string,
  req: Request,
  res: Response
): Promise<void> {
  // Resolve full domain record
  let record: Awaited<ReturnType<typeof resolveDomainRecord>>;
  try {
    record = await resolveDomainRecord(appName);
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      res.status(503).set('Retry-After', '30').type('html')
        .send('<html><body><h1>Service Temporarily Unavailable</h1><p>The routing service is temporarily unavailable. Please try again in a moment.</p></body></html>');
    } else {
      res.status(502).send('Gateway error');
    }
    return;
  }

  if (!record) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  // Route based on deployment type (default to 'ipfs' for backward compatibility)
  const deploymentType = record.deploymentType || 'ipfs';

  if (deploymentType === 'ipfs') {
    // IPFS is static — only GET and HEAD are meaningful
    if (!['GET', 'HEAD'].includes(req.method.toUpperCase())) {
      res.status(405).set('Allow', 'GET, HEAD').send('Method Not Allowed');
      return;
    }
    if (!record.cid) {
      console.error(`[proxy-v2] IPFS deployment missing CID: ${appName}`);
      res.status(500).send('Invalid deployment configuration');
      return;
    }
    await proxyIpfs(appName, record.cid, assetPath, res);

  } else if (deploymentType === 'akash') {
    let deploymentUrl = record.deploymentUrl;

    if (isUnresolvedAkashUrl(deploymentUrl)) {
      if (!record.deploymentId) {
        console.error(`[proxy-v2] Akash deployment has no URL or ID: ${appName}`);
        res.status(500).send('Invalid deployment configuration');
        return;
      }
      // The portal deploy route returns immediately after Akash accepts the
      // deployment. At that point Console may not have exposed the service URI
      // yet, so records can contain an empty or placeholder URL. Resolve the
      // current provider URI from Akash status before proxying.
      const status = await getDeploymentStatus(record.deploymentId);
      if (!status.url) {
        res.status(503).set('Retry-After', '30').send('Deployment is starting up, please try again shortly');
        return;
      }
      deploymentUrl = status.url;
    }

    if (!deploymentUrl) {
      res.status(503).set('Retry-After', '30').send('Deployment is starting up, please try again shortly');
      return;
    }

    // Akash deployments serve from root — forward all methods and body
    const fullPath = assetPath ? `/${assetPath}` : '/';
    await proxyAkash(deploymentUrl, fullPath, req, res, appName);

  } else if (deploymentType === 'custom') {
    if (!record.deploymentUrl) {
      console.error(`[proxy-v2] Custom deployment missing URL: ${appName}`);
      res.status(500).send('Invalid deployment configuration');
      return;
    }
    const fullPath = assetPath ? `/${assetPath}` : '/';
    await proxyCustom(record.deploymentUrl, fullPath, req, res, appName);

  } else {
    console.error(`[proxy-v2] Unknown deployment type: ${deploymentType}`);
    res.status(500).send('Unsupported deployment type');
  }
}

// ---------------------------------------------------------------------------
// Path-based routing: varity.app/{app-name}[/path/to/asset]
// ---------------------------------------------------------------------------

proxyRouterV2.all('/:appName', async (req: Request, res: Response, next) => {
  const appName = req.params.appName.toLowerCase();
  if (await proxyRootAssetFromReferer(appName, '', req, res)) {
    return;
  }
  if (RESERVED_SUBDOMAINS.has(appName)) {
    next();
    return;
  }
  await proxyDeployment(appName, '', req, res);
});

proxyRouterV2.all('/:appName/*', async (req: Request, res: Response) => {
  const appName = req.params.appName.toLowerCase();
  const assetPath = req.url.split('/').slice(2).join('/');
  if (await proxyRootAssetFromReferer(appName, assetPath, req, res)) {
    return;
  }
  if (RESERVED_SUBDOMAINS.has(appName)) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }
  await proxyDeployment(appName, assetPath, req, res);
});

// ---------------------------------------------------------------------------
// Catch-all: subdomain-based routing
// ---------------------------------------------------------------------------

proxyRouterV2.use(async (req: Request, res: Response) => {
  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    res.status(404).type('html').send(notFoundHtml);
    return;
  }

  await proxyDeployment(subdomain, req.path.replace(/^\//, ''), req, res);
});
