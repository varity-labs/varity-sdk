import { Router, Request, Response } from 'express';
import { config, RESERVED_SUBDOMAINS, DB_COLLECTION } from './config';
import { invalidateCache } from './domain-resolver';
import crypto from 'crypto';

export const registrationRouter = Router();

export function verifyApiKey(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  const expected = config.gateway.apiKey;

  // timingSafeEqual requires equal-length buffers
  if (token.length !== expected.length) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected)
  );

  if (!valid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

function isValidSubdomain(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(name) && !name.includes('--');
}

/** Validate IPFS CID format (CIDv0 or CIDv1) */
function isValidCid(cid: string): boolean {
  return /^Qm[A-Za-z0-9]{44}$/.test(cid) || /^bafy[a-z2-7]{55,}$/.test(cid);
}

/** Fetch all domain records from DB Proxy */
async function fetchAllDomains(): Promise<Array<{ id: string; subdomain: string; cid: string }>> {
  const url = `${config.dbProxy.url}/db/${DB_COLLECTION}/get`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.dbProxy.token}` },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`DB Proxy returned ${res.status}`);

  const data = await res.json() as { success?: boolean; data?: Array<{ id: string; subdomain: string; cid: string }> };
  if (!data.success || !data.data) return [];
  return data.data;
}

// Check subdomain availability
registrationRouter.get('/api/domains/check/:name', verifyApiKey, async (req: Request, res: Response) => {
  const name = (req.params.name as string).toLowerCase();

  if (RESERVED_SUBDOMAINS.has(name)) {
    res.json({ available: false, reason: 'reserved' });
    return;
  }

  if (!isValidSubdomain(name)) {
    res.json({ available: false, reason: 'invalid' });
    return;
  }

  try {
    const domains = await fetchAllDomains();
    const exists = domains.some((d) => d.subdomain === name);
    res.json({ available: !exists, reason: exists ? 'taken' : null });
  } catch (err) {
    console.error('[registration] check error:', err);
    res.status(500).json({ error: 'Internal error checking domain' });
  }
});

// Register a new subdomain
registrationRouter.post('/api/domains/register', verifyApiKey, async (req: Request, res: Response) => {
  const { subdomain, cid, appName } = req.body;

  if (!subdomain || !cid) {
    res.status(400).json({ error: 'subdomain and cid are required' });
    return;
  }

  if (!isValidCid(cid)) {
    res.status(400).json({ error: 'Invalid CID format. Must be a valid IPFS CIDv0 (Qm...) or CIDv1 (bafy...).' });
    return;
  }

  const name = subdomain.toLowerCase();

  if (RESERVED_SUBDOMAINS.has(name)) {
    res.status(409).json({ error: `"${name}" is a reserved subdomain` });
    return;
  }

  if (!isValidSubdomain(name)) {
    res.status(400).json({ error: 'Invalid subdomain. Must be 3-63 chars, lowercase alphanumeric and hyphens, no leading/trailing/double hyphens.' });
    return;
  }

  try {
    // Check if already exists
    const domains = await fetchAllDomains();
    const existing = domains.find((d) => d.subdomain === name);

    if (existing) {
      res.status(409).json({ error: `"${name}" is already registered. Use PUT to update.` });
      return;
    }

    // Register — DB Proxy stores the body directly as JSONB
    const record = {
      subdomain: name,
      cid,
      appName: appName || name,
      registeredBy: 'cli',
      createdAt: new Date().toISOString(),
    };

    const addUrl = `${config.dbProxy.url}/db/${DB_COLLECTION}/add`;
    const addRes = await fetch(addUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.dbProxy.token}`,
      },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(5000),
    });

    if (!addRes.ok) {
      console.error(`[registration] DB Proxy add failed: ${addRes.status}`);
      res.status(502).json({ error: 'Failed to register domain' });
      return;
    }

    const result = await addRes.json() as { success?: boolean; data?: { id: string } };
    invalidateCache(name);

    console.log(`[registration] Registered: ${config.gateway.baseDomain}/${name}`);
    res.status(201).json({
      subdomain: name,
      url: `https://${config.gateway.baseDomain}/${name}`,
      cid,
      id: result.data?.id,
    });
  } catch (err) {
    console.error('[registration] register error:', err);
    res.status(500).json({ error: 'Internal error registering domain' });
  }
});

// Update an existing subdomain's CID (redeployment)
registrationRouter.put('/api/domains/update', verifyApiKey, async (req: Request, res: Response) => {
  const { subdomain, cid } = req.body;

  if (!subdomain || !cid) {
    res.status(400).json({ error: 'subdomain and cid are required' });
    return;
  }

  if (!isValidCid(cid)) {
    res.status(400).json({ error: 'Invalid CID format. Must be a valid IPFS CIDv0 (Qm...) or CIDv1 (bafy...).' });
    return;
  }

  const name = subdomain.toLowerCase();

  try {
    // Find the existing record
    const domains = await fetchAllDomains();
    const existing = domains.find((d) => d.subdomain === name);

    if (!existing) {
      res.status(404).json({ error: `"${name}" is not registered. Use POST to register.` });
      return;
    }

    // Update — DB Proxy route: PUT /db/:collection/update/:id
    // Body is stored as full JSONB replacement
    const updatedRecord = {
      subdomain: name,
      cid,
      appName: (existing as any).appName || name,
      registeredBy: 'cli',
      createdAt: (existing as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updateUrl = `${config.dbProxy.url}/db/${DB_COLLECTION}/update/${existing.id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.dbProxy.token}`,
      },
      body: JSON.stringify(updatedRecord),
      signal: AbortSignal.timeout(5000),
    });

    if (!updateRes.ok) {
      res.status(502).json({ error: 'Failed to update domain' });
      return;
    }

    invalidateCache(name);

    console.log(`[registration] Updated: ${config.gateway.baseDomain}/${name}`);
    res.json({
      subdomain: name,
      url: `https://${config.gateway.baseDomain}/${name}`,
      cid,
    });
  } catch (err) {
    console.error('[registration] update error:', err);
    res.status(500).json({ error: 'Internal error updating domain' });
  }
});
