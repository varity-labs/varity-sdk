import NodeCache from 'node-cache';
import { config, DB_COLLECTION } from '../config';
import { DomainRecord } from '../types';

const cache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: 60,
  useClones: false,
});

const recordCache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: 60,
  useClones: false,
});

export class DbUnavailableError extends Error {
  readonly originalCause: unknown;
  constructor(cause?: unknown) {
    super('Route database is temporarily unavailable');
    this.name = 'DbUnavailableError';
    this.originalCause = cause;
  }
}

/**
 * Fetch all domain records from the DB Proxy.
 *
 * The DB Proxy has no `WHERE` filter, so every call returns the full
 * collection. Results are cached in-memory by `resolveDomain` to
 * avoid repeated round-trips.
 */
export async function fetchAllDomains(): Promise<DomainRecord[]> {
  const url = `${config.dbProxy.url}/db/${DB_COLLECTION}/get`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.dbProxy.token}` },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`DB Proxy returned ${res.status}`);

  const data = (await res.json()) as { success?: boolean; data?: DomainRecord[] };
  if (!data.success || !data.data) return [];
  return data.data;
}

/**
 * Resolve a subdomain to an IPFS CID.
 *
 * Checks the in-memory cache first, then queries the DB Proxy on
 * cache miss. When the DB is queried, all returned records are cached
 * to speed up subsequent lookups within the TTL window.
 */
export async function resolveDomain(subdomain: string): Promise<string | null> {
  const cached = cache.get<string>(subdomain);
  if (cached) return cached;

  try {
    const domains = await fetchAllDomains();
    const record = domains.find((r) => r.subdomain === subdomain);
    if (!record) return null;

    // Cache every record from the response
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

/**
 * Resolve a subdomain to its full domain record.
 *
 * Checks the in-memory record cache first. On a cache miss, fetches all
 * domains from the DB Proxy and populates the cache. Throws DbUnavailableError
 * when the DB Proxy is unreachable so callers can distinguish a database
 * outage from a genuine "app not found" condition.
 */
export async function resolveDomainRecord(subdomain: string): Promise<DomainRecord | null> {
  const cached = recordCache.get<DomainRecord>(subdomain);
  if (cached !== undefined) return cached;

  let domains: DomainRecord[];
  try {
    domains = await fetchAllDomains();
  } catch (err) {
    console.error(`[resolver] DB Proxy unreachable while resolving "${subdomain}":`, err);
    throw new DbUnavailableError(err);
  }

  for (const d of domains) {
    if (d.subdomain) recordCache.set(d.subdomain, d);
  }

  return domains.find((r) => r.subdomain === subdomain) ?? null;
}

/**
 * Invalidate a single subdomain from both caches.
 * Called after domain registration or update.
 */
export function invalidateCache(subdomain: string): void {
  cache.del(subdomain);
  recordCache.del(subdomain);
}

/**
 * Return cache hit/miss statistics (exposed on non-production health check).
 */
export function getCacheStats() {
  return cache.getStats();
}
