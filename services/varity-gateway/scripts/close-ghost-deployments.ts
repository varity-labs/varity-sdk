#!/usr/bin/env npx tsx
/**
 * Maintenance script: close ghost Akash deployments to stop AKT bleed.
 *
 * Context: VAR-356 — ghost containers from the PROD-1 timeout cascade (VAR-348)
 * each hold a live Akash lease consuming AKT. Ghosts are identified by
 * health-checking https://varity.app/{subdomain}/ — any deployment that fails
 * to return HTTP 2xx is a ghost.
 *
 * Prerequisites (env vars — copy from .env or set in shell):
 *   VARITY_AKASH_CONSOLE_KEY  Akash Console Managed Wallet API key
 *   DB_PROXY_URL              DB Proxy base URL
 *   DB_PROXY_TOKEN            DB Proxy JWT
 *
 * Usage:
 *   npx tsx scripts/close-ghost-deployments.ts --dry-run   # preview only, no changes
 *   npx tsx scripts/close-ghost-deployments.ts             # close ghosts + remove DB records
 *
 * NOTE (VAR-356): Do NOT run this script until VAR-348 is resolved.
 * Running before the root cause is fixed will only recreate the ghosts.
 */

import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const CONSOLE_API_URL = process.env.AKASH_CONSOLE_API_URL ?? 'https://console-api.akash.network';
const GATEWAY_BASE_DOMAIN = process.env.BASE_DOMAIN ?? 'varity.app';
const HEALTH_TIMEOUT_MS = 10_000;
const CLOSE_CONCURRENCY = 3;    // Akash Console API close ops in parallel
const HEALTH_CONCURRENCY = 10;  // Health-check requests in parallel

interface DomainRecord {
  id: string;
  subdomain: string;
  appName: string;
  deploymentType?: string;
  deploymentId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`[close-ghosts] Missing required env var: ${key}`);
    process.exit(1);
  }
  return v;
}

async function fetchAllDomains(): Promise<DomainRecord[]> {
  const dbProxyUrl = requireEnv('DB_PROXY_URL');
  const dbProxyToken = requireEnv('DB_PROXY_TOKEN');

  const res = await fetch(`${dbProxyUrl}/db/domains/get`, {
    headers: { Authorization: `Bearer ${dbProxyToken}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`DB Proxy returned ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { success?: boolean; data?: DomainRecord[] };
  if (!data.success || !data.data) return [];
  return data.data;
}

async function isHealthy(subdomain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${GATEWAY_BASE_DOMAIN}/${subdomain}/`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      redirect: 'follow',
    });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

async function closeOnAkash(dseq: string): Promise<boolean> {
  const apiKey = requireEnv('VARITY_AKASH_CONSOLE_KEY');
  try {
    const res = await fetch(`${CONSOLE_API_URL}/v1/deployments/${dseq}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { data?: { success?: boolean } };
    return body.data?.success === true;
  } catch {
    return false;
  }
}

async function deleteFromDb(id: string): Promise<boolean> {
  const dbProxyUrl = requireEnv('DB_PROXY_URL');
  const dbProxyToken = requireEnv('DB_PROXY_TOKEN');
  try {
    const res = await fetch(`${dbProxyUrl}/db/domains/delete/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${dbProxyToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function inBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...await Promise.all(batch.map(fn)));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`[close-ghosts] Starting — DRY_RUN=${DRY_RUN}`);
  console.log(`[close-ghosts] Gateway: https://${GATEWAY_BASE_DOMAIN}/`);

  // 1. Fetch all domain records
  console.log('[close-ghosts] Fetching domain records from DB Proxy...');
  const all = await fetchAllDomains();
  const akashDeploys = all.filter(d => d.deploymentType === 'akash' && d.deploymentId);
  console.log(`[close-ghosts] Total records: ${all.length} | Akash deployments: ${akashDeploys.length}`);

  if (akashDeploys.length === 0) {
    console.log('[close-ghosts] No Akash deployments found. Nothing to do.');
    return;
  }

  // 2. Health-check all Akash deployments in parallel
  console.log(`[close-ghosts] Health-checking ${akashDeploys.length} deployments (concurrency=${HEALTH_CONCURRENCY})...`);

  let checked = 0;
  const withHealth = await inBatches(akashDeploys, HEALTH_CONCURRENCY, async (d) => {
    const healthy = await isHealthy(d.subdomain);
    checked++;
    if (checked % 20 === 0 || checked === akashDeploys.length) {
      process.stdout.write(`\r[close-ghosts] Health progress: ${checked}/${akashDeploys.length}`);
    }
    return { ...d, healthy };
  });
  console.log(); // newline after progress

  const healthy = withHealth.filter(d => d.healthy);
  const ghosts = withHealth.filter(d => !d.healthy);

  console.log(`[close-ghosts] Healthy: ${healthy.length} | Ghost (unhealthy): ${ghosts.length}`);

  if (ghosts.length === 0) {
    console.log('[close-ghosts] No ghost deployments found. AKT bleed already stopped or all apps healthy.');
    return;
  }

  // 3. Report ghosts
  console.log('\n[close-ghosts] Ghost deployments:');
  for (const g of ghosts) {
    console.log(`  - ${g.subdomain.padEnd(40)} dseq=${g.deploymentId}  id=${g.id}  app="${g.appName}"`);
  }

  if (DRY_RUN) {
    console.log(`\n[close-ghosts] DRY RUN — would close ${ghosts.length} deployments. Pass no --dry-run to execute.`);
    console.log('[close-ghosts] Exiting without making changes.');
    return;
  }

  // 4. Close ghost deployments
  console.log(`\n[close-ghosts] Closing ${ghosts.length} ghost deployments (concurrency=${CLOSE_CONCURRENCY})...`);

  let closedCount = 0;
  let failedCount = 0;
  const failedList: string[] = [];

  await inBatches(ghosts, CLOSE_CONCURRENCY, async (ghost) => {
    process.stdout.write(`  Closing ${ghost.subdomain} (dseq=${ghost.deploymentId})... `);

    const akashOk = await closeOnAkash(ghost.deploymentId!);
    const dbOk = await deleteFromDb(ghost.id);

    if (akashOk || dbOk) {
      closedCount++;
      console.log(`done  [akash=${akashOk ? 'closed' : 'skipped'}  db=${dbOk ? 'deleted' : 'skipped'}]`);
    } else {
      failedCount++;
      failedList.push(ghost.subdomain);
      console.log('FAILED');
    }
  });

  // 5. Summary
  console.log('\n[close-ghosts] ──────────────────────────────────────────────');
  console.log(`[close-ghosts] Closed:  ${closedCount}`);
  console.log(`[close-ghosts] Failed:  ${failedCount}`);
  console.log(`[close-ghosts] Healthy (untouched): ${healthy.length}`);
  if (failedList.length > 0) {
    console.log(`[close-ghosts] Failed subdomains: ${failedList.join(', ')}`);
  }
  console.log('[close-ghosts] Done. Verify AKT spend dropped in Akash Console billing dashboard.');
}

main().catch((err: unknown) => {
  console.error('[close-ghosts] Fatal error:', err);
  process.exit(1);
});
