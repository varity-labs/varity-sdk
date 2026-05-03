/**
 * Akash Deployment Proxy Service
 *
 * Proxies requests to Akash provider URLs, similar to IPFS proxy but simpler.
 * No path rewriting needed since Akash deployments serve from root.
 */

import { Request, Response } from 'express';
import { rewriteHtmlPathsForApp } from './html-path-rewrite';

const SAFE_CONTENT_TYPES = /^(text\/(html|css|plain|javascript)|application\/(javascript|json|pdf)|image\/|audio\/|video\/|font\/)/;

function isAssetPath(path: string): boolean {
  return /\.(js|mjs|css|map|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf|json|txt|xml)$/i
    .test(path.split('?')[0] ?? path);
}

/**
 * Proxy content from Akash provider to client
 *
 * Handles:
 * - Content-type detection and safe-type enforcement
 * - Cache headers (short TTL for dynamic content)
 * - Timeout (15s max)
 * - Error handling
 */
export async function proxyAkash(
  providerUrl: string,
  path: string,
  req: Request,
  res: Response,
  appName?: string
): Promise<void> {
  // Ensure protocol prefix — Console API returns bare hostnames
  const base = providerUrl.startsWith('http') ? providerUrl : `http://${providerUrl}`;
  const fullUrl = `${base}${path}`;

  const forwardHeaders: Record<string, string> = {
    'User-Agent': 'Varity-Gateway/2.0'
  };

  const incomingContentType = req.headers['content-type'];
  if (incomingContentType) {
    forwardHeaders['Content-Type'] = incomingContentType;
  }

  const methodHasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
  const body = methodHasBody && req.body !== undefined
    ? JSON.stringify(req.body)
    : undefined;

  if (body && !forwardHeaders['Content-Type']) {
    forwardHeaders['Content-Type'] = 'application/json';
  }

  try {
    const akashRes = await fetch(fullUrl, {
      method: req.method,
      body,
      signal: AbortSignal.timeout(15000),
      headers: forwardHeaders
    });

    if (!akashRes.ok) {
      console.error(`[akash-proxy] Provider returned ${akashRes.status} for ${fullUrl}`);
      res.status(akashRes.status).send('Content not available');
      return;
    }

    // Content type — only serve safe types inline
    const contentType = akashRes.headers.get('content-type') || 'application/octet-stream';
    if (isAssetPath(path) && contentType.includes('text/html')) {
      console.error(`[akash-proxy] Refusing HTML response for asset ${fullUrl}`);
      res.status(502).type('text/plain').send('Asset response had invalid content type');
      return;
    }

    if (SAFE_CONTENT_TYPES.test(contentType)) {
      res.type(contentType);
    } else {
      res.type('application/octet-stream');
    }

    res.set('Cache-Control', 'public, max-age=60');

    // Forward all X-* headers (custom app headers + security headers) and HSTS
    akashRes.headers.forEach((value, header) => {
      if (header.startsWith('x-') || header === 'strict-transport-security') {
        res.set(header, value);
      }
    });

    // Stream response body
    const responseBody = await akashRes.arrayBuffer();
    if (appName && contentType.includes('text/html')) {
      const rewrittenHtml = rewriteHtmlPathsForApp(Buffer.from(responseBody).toString('utf-8'), appName);
      res.send(rewrittenHtml);
      return;
    }
    res.send(Buffer.from(responseBody));

  } catch (err) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      console.error(`[akash-proxy] Timeout fetching ${fullUrl}`);
      res.status(504).send('Request timeout');
    } else {
      console.error(`[akash-proxy] Failed to fetch ${fullUrl}:`, error);
      res.status(502).send('Failed to fetch content from provider');
    }
  }
}

/**
 * Proxy custom domain deployments
 * Similar to Akash proxy but for user's own domains
 */
export async function proxyCustom(
  customUrl: string,
  path: string,
  req: Request,
  res: Response,
  appName?: string
): Promise<void> {
  return proxyAkash(customUrl, path, req, res, appName);
}
