import NodeCache from 'node-cache';
import { config, DB_COLLECTION } from './config';
import { DomainRecord } from './types';

const cache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: 60,
  useClones: false,
});

/**
 * Fetch all domain records from DB Proxy.
 * DB Proxy has no `where` filter, so we always get the full list.
 */
export async function fetchAllDomains(): Promise<DomainRecord[]> {
  const url = `${config.dbProxy.url}/db/${DB_COLLECTION}/get`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.dbProxy.token}` },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`DB Proxy returned ${res.status}`);

  const data = await res.json() as { success?: boolean; data?: DomainRecord[] };
  if (!data.success || !data.data) return [];
  return data.data;
}

/**
 * Resolve a subdomain to a CID.
 * Checks in-memory cache first, then queries DB Proxy.
 *
 * The cache makes this fast — only one DB hit per TTL period per cache miss.
 */
export async function resolveDomain(subdomain: string): Promise<string | null> {
  const cached = cache.get<string>(subdomain);
  if (cached) return cached;

  try {
    const domains = await fetchAllDomains();

    const record = domains.find((r) => r.subdomain === subdomain);
    if (!record) return null;

    // Cache all returned records to speed up subsequent lookups
    for (const r of domains) {
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
