import { Router, Request, Response } from 'express';
import { fetchAllDomains, invalidateCache } from '../services/resolver';
import { getDeploymentStatus, closeDeployment } from '../services/akash-deploy';
import { config, DB_COLLECTION } from '../config';
import { verifyPrivyToken, privy } from '../middleware/privyAuth';

export const deploymentsRouter = Router();

// ---------------------------------------------------------------------------
// Owner identity helpers
// ---------------------------------------------------------------------------

/**
 * Build the full set of identifiers for a Privy user.
 *
 * Includes the Privy userId plus all linked wallet/email addresses, so that
 * CLI-registered records (stored with a wallet address as ownerId) still
 * surface for the authenticated user.  The Privy lookup is best-effort;
 * on failure we fall back to userId-only matching.
 */
async function getUserIdentifiers(userId: string): Promise<Set<string>> {
  const ids = new Set<string>([userId]);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (privy.users() as any)._get(userId);
    for (const acc of (user.linked_accounts ?? [])) {
      if (acc.address) {
        ids.add(acc.address);
        ids.add((acc.address as string).toLowerCase());
      }
    }
  } catch {
    // Non-fatal: some Privy accounts have no linked wallets.
  }
  return ids;
}

// ---------------------------------------------------------------------------
// GET /api/deployments
// ---------------------------------------------------------------------------

deploymentsRouter.get('/api/deployments', verifyPrivyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const allDomains = await fetchAllDomains();

    // Primary filter: exact Privy userId match (fast path, no extra API call).
    let domains = allDomains.filter((d) => d.ownerId === userId);

    // Lazy fallback: if no results, check linked wallets/emails from Privy.
    // This handles records registered via CLI with a wallet address as ownerId.
    if (domains.length === 0) {
      const ownerIds = await getUserIdentifiers(userId);
      domains = allDomains.filter(
        (d) => d.ownerId != null && (ownerIds.has(d.ownerId) || ownerIds.has(d.ownerId.toLowerCase())),
      );
    }

    // Enrich with live Akash status
    const deployments = await Promise.all(
      domains.map(async (record) => {
        let liveStatus = null;
        if (record.deploymentType === 'akash' && record.deploymentId) {
          try {
            liveStatus = await getDeploymentStatus(record.deploymentId);
          } catch {
            liveStatus = { status: 'unknown' };
          }
        }

        return {
          id: record.id,
          subdomain: record.subdomain,
          appName: record.appName,
          tagline: record.tagline,
          logoUrl: record.logoUrl,
          deploymentType: record.deploymentType || 'ipfs',
          url: `https://varity.app/${record.subdomain}/`,
          createdAt: record.createdAt,
          status: liveStatus?.status || (record.deploymentType === 'akash' ? 'unknown' : 'live'),
          billing: liveStatus?.monthlyUsd != null
            ? { monthlyUsd: liveStatus.monthlyUsd, currency: 'USD' }
            : null,
        };
      })
    );

    res.json({ deployments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Deployments list error:', message);
    res.status(502).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/deployments/claim
//
// Self-service ownership migration for CLI-registered deployments.
//
// CLI-registered records are stored with ownerId=null or ownerId=<deployKey>
// (a shared tier-level key, not a Privy userId).  This endpoint lets an
// authenticated user claim those records, setting ownerId to their Privy userId
// so that GET /api/deployments can find them.
//
// Body: { deployKey?: string }
//   deployKey — the Varity CLI deploy key from ~/.varitykit/config.json
//               (used to claim records explicitly tagged with that key)
//
// Claimed record criteria:
//   1. ownerId is null (unattributed legacy records)
//   2. ownerId === deployKey (records tagged with this user's deploy key)
//   Already-owned records (ownerId === userId) are skipped.
//
// NOTE (beta): the deploy key is a shared tier credential, meaning any valid
// beta developer can claim null-ownerId records.  This is acceptable while
// there is only one active user.  Post-beta, move to per-user deploy keys.
// ---------------------------------------------------------------------------

deploymentsRouter.post('/api/deployments/claim', verifyPrivyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { deployKey } = req.body as { deployKey?: string };

  try {
    const allDomains = await fetchAllDomains();

    const claimable = allDomains.filter((d) => {
      if (d.ownerId === userId) return false; // already owned by this user
      if (d.ownerId == null) return true;     // unattributed legacy record
      if (deployKey && d.ownerId === deployKey) return true; // matches deploy key
      return false;
    });

    const updated: string[] = [];
    const errors: string[] = [];

    for (const record of claimable) {
      const updateUrl = `${config.dbProxy.url}/db/${DB_COLLECTION}/update/${record.id}`;
      const updatedRecord = { ...record, ownerId: userId, updatedAt: new Date().toISOString() };

      const dbRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.dbProxy.token}`,
        },
        body: JSON.stringify(updatedRecord),
        signal: AbortSignal.timeout(5000),
      });

      if (dbRes.ok) {
        invalidateCache(record.subdomain);
        updated.push(record.id);
      } else {
        errors.push(record.id);
        console.error(`[deployments] claim: failed to update ${record.id} (${dbRes.status})`);
      }
    }

    console.log(`[deployments] claim: userId=${userId} claimed=${updated.length} errors=${errors.length}`);
    res.json({ claimed: updated.length, updated, errors, userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Deployments claim error:', message);
    res.status(502).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/deployments/:id
// ---------------------------------------------------------------------------

deploymentsRouter.delete('/api/deployments/:id', verifyPrivyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!id) {
    res.status(400).json({ error: 'Deployment ID is required' });
    return;
  }

  try {
    const domains = await fetchAllDomains();
    const deployment = domains.find((d) => d.id === id);

    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    // Ownership check: also accept linked wallet/email addresses as valid owners.
    const ownerIds = await getUserIdentifiers(userId);
    const isOwner = deployment.ownerId === userId ||
      (deployment.ownerId != null && (ownerIds.has(deployment.ownerId) || ownerIds.has(deployment.ownerId.toLowerCase())));

    if (!isOwner) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // If Akash deployment is active, close it first
    if (deployment.deploymentType === 'akash' && deployment.deploymentId) {
      try {
        const closed = await closeDeployment(deployment.deploymentId);
        if (!closed) {
          res.status(502).json({ error: 'Could not stop deployment. Please retry.' });
          return;
        }
      } catch (err) {
        console.error('Failed to close Akash deployment:', err);
        res.status(502).json({ error: 'Could not stop deployment. Please retry.' });
        return;
      }
    }

    // Delete from DB Proxy
    const dbUrl = `${config.dbProxy.url}/db/domains/delete/${id}`;
    const dbRes = await fetch(dbUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${config.dbProxy.token}` },
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.error('DB Proxy delete failed:', dbRes.status, errText);
      res.status(502).json({ error: 'Failed to delete deployment' });
      return;
    }

    invalidateCache(deployment.subdomain);

    res.json({
      success: true,
      deleted: id,
      subdomain: deployment.subdomain,
      appName: deployment.appName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Deployment delete error:', message);
    res.status(502).json({ error: message });
  }
});
