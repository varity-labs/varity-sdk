import { Router } from 'express';
import { config } from '../config';

export const dbProxyRouter = Router();

/**
 * Reverse-proxy /db/* requests to the internal DB Proxy service.
 *
 * Apps on https://varity.app cannot reach the DB Proxy directly (HTTP-only,
 * mixed-content blocked by browsers). This route provides an HTTPS frontend.
 */
dbProxyRouter.all('/db/:collection/:action/:id?', async (req, res) => {
  const { collection, action, id } = req.params;
  const targetPath = id
    ? `/db/${collection}/${action}/${id}`
    : `/db/${collection}/${action}`;

  const targetUrl = `${config.dbProxy.url}${targetPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward the client's Authorization header (app JWT token)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      signal: AbortSignal.timeout(15000),
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const proxyRes = await fetch(targetUrl, fetchOptions);
    const data = await proxyRes.text();

    res.status(proxyRes.status);
    res.set('Content-Type', proxyRes.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (err) {
    console.error(`[db-proxy] Failed to proxy ${req.method} ${targetPath}:`, err);
    res.status(502).json({ success: false, error: 'Database proxy unavailable' });
  }
});
