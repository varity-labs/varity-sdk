import { Router, Request, Response } from 'express';

/**
 * Subgraph proxy routes.
 *
 * The Graph Node endpoints on Akash are plain HTTP. The developer portal runs
 * on HTTPS (4everland), so browsers block direct fetch requests (mixed content).
 * These routes proxy GraphQL POST requests through the gateway (which has HTTPS
 * via Caddy), solving the mixed content issue.
 *
 * Routes:
 *   POST /api/subgraph/billing   → http://provider.dal.leet.haus:32083/subgraphs/name/varity/billing
 *   POST /api/subgraph/payments  → http://provider.europlots.com:31208/subgraphs/name/varity/payments
 */

const SUBGRAPH_ENDPOINTS: Record<string, string> = {
  billing: process.env.SUBGRAPH_BILLING_URL
    || 'http://provider.dal.leet.haus:32083/subgraphs/name/varity/billing',
  payments: process.env.SUBGRAPH_PAYMENTS_URL
    || 'http://provider.europlots.com:31208/subgraphs/name/varity/payments',
};

export const subgraphRouter = Router();

subgraphRouter.post('/api/subgraph/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  const upstream = SUBGRAPH_ENDPOINTS[name];

  if (!upstream) {
    res.status(404).json({ error: `Unknown subgraph: ${name}. Valid: ${Object.keys(SUBGRAPH_ENDPOINTS).join(', ')}` });
    return;
  }

  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(response.status).set('Content-Type', 'application/json').send(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Subgraph proxy error (${name}):`, message);
    res.status(502).json({ error: 'Subgraph unreachable', details: message });
  }
});
