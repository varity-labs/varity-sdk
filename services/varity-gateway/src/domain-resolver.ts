import NodeCache from 'node-cache';
import { config, DB_COLLECTION } from './config';

interface DomainRecord {
  id: string;
  subdomain: string;
  cid: string;
  appName: string;
  registeredBy: string;
  createdAt: string;
  updatedAt?: string;
}

const cache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: 60,
  useClones: false,
});

/**
 * Resolve a subdomain to a CID.
 * Checks in-memory cache first, then queries DB Proxy.
 *
 * DB Proxy has no `where` filter, so we fetch all domain records
 * and find the matching subdomain client-side. The cache makes
 * this fast — only one DB hit per 5 minutes per subdomain miss.
 */
export async function resolveDomain(subdomain: string): Promise<string | null> {
  const cached = cache.get<string>(subdomain);
  if (cached) return cached;

  try {
    const url = `${config.dbProxy.url}/db/${DB_COLLECTION}/get`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.dbProxy.token}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json() as { success?: boolean; data?: DomainRecord[] };
    if (!data.success || !data.data) return null;

    // Find matching subdomain (DB Proxy has no where clause)
    const record = data.data.find((r) => r.subdomain === subdomain);
    if (!record) return null;

    // Cache all returned records to speed up subsequent lookups
    for (const r of data.data) {
      if (r.subdomain && r.cid) {
        cache.set(r.subdomain, r.cid);
      }
    }

    return record.cid;
  } catch (err) {
    console.error(`[resolver] Failed to resolve "${subdomain}":`, err);
    return null;
  }
}

export function invalidateCache(subdomain: string): void {
  cache.del(subdomain);
}

export function getCacheStats() {
  return cache.getStats();
}
