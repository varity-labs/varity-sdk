import { Router, Request, Response } from 'express';
import { config, RESERVED_SUBDOMAINS, DB_COLLECTION } from './config';
import { invalidateCache, fetchAllDomains } from './domain-resolver';
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

// Check subdomain availability (with optional ownership context)
registrationRouter.get('/api/domains/check/:name', verifyApiKey, async (req: Request, res: Response) => {
  const name = (req.params.name as string).toLowerCase();
  const ownerId = req.query.ownerId as string | undefined;

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
    const existing = domains.find((d) => d.subdomain === name);

    if (!existing) {
      res.json({ available: true, reason: null });
      return;
    }

    // If caller provided ownerId, check if they own it (redeploy is OK)
    const ownedByCaller = ownerId && existing.ownerId === ownerId;
    res.json({
      available: false,
      reason: ownedByCaller ? 'owned_by_you' : 'taken',
      ownedByYou: ownedByCaller || false,
    });
  } catch (err) {
    console.error('[registration] check error:', err);
    res.status(500).json({ error: 'Internal error checking domain' });
  }
});

// List domains owned by a specific developer
registrationRouter.get('/api/domains/mine', verifyApiKey, async (req: Request, res: Response) => {
  const ownerId = req.query.ownerId as string | undefined;

  if (!ownerId) {
    res.status(400).json({ error: 'ownerId query parameter is required' });
    return;
  }

  try {
    const domains = await fetchAllDomains();
    const owned = domains
      .filter((d) => d.ownerId === ownerId)
      .map((d) => ({
        subdomain: d.subdomain,
        url: `https://${config.gateway.baseDomain}/${d.subdomain}`,
        cid: d.cid,
        appName: d.appName,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));

    res.json({ domains: owned, count: owned.length });
  } catch (err) {
    console.error('[registration] list error:', err);
    res.status(500).json({ error: 'Internal error listing domains' });
  }
});

// Register a new subdomain
registrationRouter.post('/api/domains/register', verifyApiKey, async (req: Request, res: Response) => {
  const { subdomain, cid, appName, ownerId } = req.body;

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
      ownerId: ownerId || null,
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

    console.log(`[registration] Registered: ${config.gateway.baseDomain}/${name} (owner: ${ownerId || 'none'})`);
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
  const { subdomain, cid, ownerId } = req.body;

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

    // Ownership check: if the domain has an owner, only that owner can update it
    if (existing.ownerId && ownerId !== existing.ownerId) {
      res.status(403).json({ error: 'You do not own this domain.' });
      return;
    }

    // Update — DB Proxy route: PUT /db/:collection/update/:id
    const updatedRecord = {
      subdomain: name,
      cid,
      appName: existing.appName || name,
      ownerId: ownerId || existing.ownerId || null,
      registeredBy: 'cli',
      createdAt: existing.createdAt || new Date().toISOString(),
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

    console.log(`[registration] Updated: ${config.gateway.baseDomain}/${name} (owner: ${ownerId || existing.ownerId || 'none'})`);
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
