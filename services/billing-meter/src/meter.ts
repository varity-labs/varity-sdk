import Stripe from 'stripe';
import { config } from './config.js';
import { getDeploymentCost, DeploymentCost } from './akash-cost.js';

const stripe = new Stripe(config.stripeSecretKey);
const BILLING_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

interface DomainRecord {
  id: string;
  subdomain: string;
  deploymentType?: string;
  deploymentId?: string;
  ownerId?: string;
  status?: string;
}

interface BillingCustomerRecord {
  ownerId: string;
  email?: string;
  stripeCustomerId: string;
}

interface AuditRecord {
  ownerId: string;
  stripeCustomerId: string | null;
  eventTimestamp: string;
  deploymentIds: string[];
  totalHourlyUsd: number;
  totalMeteredUsd: number;
  centValueSent: number;
  stripeEventId: string | null;
  status: 'sent' | 'skipped_no_customer' | 'skipped_below_cent' | 'capped' | 'error';
  error: string | null;
  createdAt: string;
}

async function fetchDomains(): Promise<DomainRecord[]> {
  const response = await fetch(`${config.dbProxyUrl}/db/domains/get`, {
    headers: {
      Authorization: `Bearer ${config.dbProxyToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`DB Proxy /db/domains/get failed: ${response.status}`);
  }

  const body = (await response.json()) as { data?: DomainRecord[] };
  return body.data ?? [];
}

async function fetchBillingCustomers(): Promise<Map<string, BillingCustomerRecord>> {
  const response = await fetch(`${config.dbProxyUrl}/db/billing_customers/get`, {
    headers: {
      Authorization: `Bearer ${config.dbProxyToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`DB Proxy /db/billing_customers/get failed: ${response.status}`);
  }

  const body = (await response.json()) as { data?: BillingCustomerRecord[] };
  return new Map((body.data ?? []).map((record) => [record.ownerId, record]));
}

async function writeAuditRecord(record: AuditRecord): Promise<void> {
  const response = await fetch(`${config.dbProxyUrl}/db/billing_meter_events/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.dbProxyToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    console.error(`[meter] Audit write failed: ${response.status}`);
  }
}

async function findStripeCustomer(email: string): Promise<string | null> {
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data[0]?.id ?? null;
}

async function resolveStripeCustomerId(
  ownerId: string,
  billingCustomers: Map<string, BillingCustomerRecord>,
): Promise<string | null> {
  const mapped = billingCustomers.get(ownerId)?.stripeCustomerId;
  if (mapped) return mapped;

  // Legacy CLI records sometimes used email addresses as ownerId. Keep that
  // path as a fallback, but Privy user IDs must resolve through billing_customers.
  if (ownerId.includes('@')) {
    return findStripeCustomer(ownerId);
  }

  return null;
}

function hourTimestamp(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

export async function runMeterTick(): Promise<void> {
  const tickStart = Date.now();
  const timestamp = hourTimestamp();
  console.log(`[meter] Tick starting for hour: ${timestamp}`);

  let domains: DomainRecord[];
  try {
    domains = await fetchDomains();
  } catch (error) {
    console.error('[meter] Failed to fetch domains:', error);
    return;
  }

  const akashDeployments = domains.filter(
    (d) => d.deploymentType === 'akash' && d.deploymentId && d.ownerId,
  );

  console.log(
    `[meter] Found ${akashDeployments.length} Akash deployment records with owner/deployment IDs out of ${domains.length} total`,
  );

  if (akashDeployments.length === 0) return;

  let billingCustomers: Map<string, BillingCustomerRecord>;
  try {
    billingCustomers = await fetchBillingCustomers();
  } catch (error) {
    console.error('[meter] Failed to fetch billing customers:', error);
    return;
  }

  const costResults = new Map<string, DeploymentCost & { domainId: string }>();
  const costFetches = akashDeployments.map(async (d) => {
    const cost = await getDeploymentCost(d.deploymentId!);
    if (cost.status === 'active' && cost.hourlyUsd != null && cost.hourlyUsd > 0) {
      costResults.set(d.id, { ...cost, domainId: d.id });
    }
  });
  await Promise.all(costFetches);

  console.log(
    `[meter] Confirmed ${costResults.size} live billable Akash deployments after console status/cost checks`,
  );

  const ownerAggregates = new Map<
    string,
    { hourlyUsd: number; monthlyUsd: number; deploymentIds: string[] }
  >();

  for (const domain of akashDeployments) {
    const cost = costResults.get(domain.id);
    if (!cost || cost.hourlyUsd == null || cost.monthlyUsd == null) continue;

    const existing = ownerAggregates.get(domain.ownerId!) ?? {
      hourlyUsd: 0,
      monthlyUsd: 0,
      deploymentIds: [],
    };
    existing.hourlyUsd += cost.hourlyUsd;
    existing.monthlyUsd += cost.monthlyUsd;
    existing.deploymentIds.push(domain.deploymentId!);
    ownerAggregates.set(domain.ownerId!, existing);
  }

  console.log(`[meter] Aggregated usage for ${ownerAggregates.size} developers`);

  let sentCount = 0;
  let skippedNoCustomerCount = 0;
  let skippedBelowCentCount = 0;
  let cappedCount = 0;
  let errorCount = 0;

  for (const [ownerId, aggregate] of ownerAggregates) {
    const audit: AuditRecord = {
      ownerId,
      stripeCustomerId: null,
      eventTimestamp: timestamp,
      deploymentIds: aggregate.deploymentIds,
      totalHourlyUsd: aggregate.hourlyUsd,
      totalMeteredUsd: Math.round(aggregate.monthlyUsd * (config.meterIntervalMs / BILLING_PERIOD_MS) * 10000) / 10000,
      centValueSent: 0,
      stripeEventId: null,
      status: 'sent',
      error: null,
      createdAt: new Date().toISOString(),
    };

    try {
      const stripeCustomerId = await resolveStripeCustomerId(ownerId, billingCustomers);
      audit.stripeCustomerId = stripeCustomerId;

      if (!stripeCustomerId) {
        audit.status = 'skipped_no_customer';
        await writeAuditRecord(audit);
        skippedNoCustomerCount++;
        continue;
      }

      const expectedDailyUsd = aggregate.monthlyUsd / 30;
      if (aggregate.hourlyUsd > expectedDailyUsd * config.maxHourlyMultiplier) {
        console.warn(
          `[meter] Safety cap hit for ${ownerId}: hourly $${aggregate.hourlyUsd} exceeds ${config.maxHourlyMultiplier}x daily expected $${expectedDailyUsd}`,
        );
        audit.status = 'capped';
        audit.totalHourlyUsd = expectedDailyUsd * config.maxHourlyMultiplier;
        cappedCount++;
      }

      const centValue = Math.round(audit.totalMeteredUsd * 100);
      if (centValue < 1) {
        audit.status = 'skipped_below_cent';
        await writeAuditRecord(audit);
        skippedBelowCentCount++;
        continue;
      }

      audit.centValueSent = centValue;

      // Write audit BEFORE Stripe call — crash-safe intent record
      await writeAuditRecord(audit);

      const meterEvent = await stripe.billing.meterEvents.create({
        event_name: 'infrastructure_usage',
        payload: {
          stripe_customer_id: stripeCustomerId,
          amount_cents: String(centValue),
        },
        identifier: `${ownerId}:${timestamp}`,
        timestamp: Math.floor(new Date(timestamp).getTime() / 1000),
      });

      audit.stripeEventId = meterEvent.identifier ?? null;
      if (audit.status !== 'capped') audit.status = 'sent';
      sentCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[meter] Failed for ${ownerId}:`, message);
      audit.status = 'error';
      audit.error = message;
      await writeAuditRecord(audit);
      errorCount++;
    }
  }

  const elapsed = Date.now() - tickStart;
  console.log(
    `[meter] Tick complete in ${elapsed}ms — sent: ${sentCount}, skipped_no_customer: ${skippedNoCustomerCount}, skipped_below_cent: ${skippedBelowCentCount}, capped: ${cappedCount}, errors: ${errorCount}`,
  );
}
