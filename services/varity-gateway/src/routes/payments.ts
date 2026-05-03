import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config';
import { privy } from '../middleware/privyAuth';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const VARITY_PRICE_ID = process.env.STRIPE_PRICE_ID || ''; // The metered price ID from Stripe dashboard
const BILLING_CUSTOMERS_COLLECTION = 'billing_customers';

export const paymentsRouter = Router();

// Initialize Stripe
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

interface BillingCustomerRecord {
  id: string;
  ownerId: string;
  email: string;
  stripeCustomerId: string;
  subscriptionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

async function getOptionalOwnerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const claims = await privy.utils().auth().verifyAccessToken(authHeader.slice(7));
    return claims.user_id;
  } catch {
    return null;
  }
}

async function fetchBillingCustomerRecords(): Promise<BillingCustomerRecord[]> {
  const res = await fetch(`${config.dbProxy.url}/db/${BILLING_CUSTOMERS_COLLECTION}/get`, {
    headers: {
      Authorization: `Bearer ${config.dbProxy.token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`DB Proxy billing customer lookup failed (${res.status})`);
  }

  const body = (await res.json()) as { data?: BillingCustomerRecord[] };
  return body.data ?? [];
}

async function upsertBillingCustomer(params: {
  ownerId: string | null;
  email: string;
  stripeCustomerId: string;
  subscriptionId?: string | null;
}): Promise<void> {
  if (!params.ownerId) return;

  try {
    const records = await fetchBillingCustomerRecords();
    const existing = records.find((r) => r.ownerId === params.ownerId);
    const now = new Date().toISOString();
    const record = {
      ownerId: params.ownerId,
      email: params.email,
      stripeCustomerId: params.stripeCustomerId,
      subscriptionId: params.subscriptionId ?? existing?.subscriptionId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const url = existing
      ? `${config.dbProxy.url}/db/${BILLING_CUSTOMERS_COLLECTION}/update/${existing.id}`
      : `${config.dbProxy.url}/db/${BILLING_CUSTOMERS_COLLECTION}/add`;

    const res = await fetch(url, {
      method: existing ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${config.dbProxy.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[stripe] Billing customer upsert failed: ${res.status}`);
    }
  } catch (error) {
    console.error('[stripe] Billing customer upsert error:', error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/stripe/create-checkout
// Creates a Stripe Checkout Session for a subscription to the
// "Varity Infrastructure" metered product.
// ---------------------------------------------------------------------------

paymentsRouter.post('/api/stripe/create-checkout', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment service not configured' });
    return;
  }

  const { email, successUrl, cancelUrl } = req.body;
  const ownerId = await getOptionalOwnerId(req);

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId = existingCustomers.data[0]?.id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }

    // Check if customer already has an active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      await upsertBillingCustomer({
        ownerId,
        email,
        stripeCustomerId: customerId,
        subscriptionId: subscriptions.data[0].id,
      });
      // Already subscribed — return success
      res.json({ alreadyActive: true, customerId });
      return;
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: VARITY_PRICE_ID,
        },
      ],
      success_url: successUrl || 'https://developer.store.varity.so/dashboard/settings?payment=success',
      cancel_url: cancelUrl || 'https://developer.store.varity.so/dashboard/settings?payment=cancelled',
    });

    await upsertBillingCustomer({
      ownerId,
      email,
      stripeCustomerId: customerId,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe checkout error:', message);
    res.status(502).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/stripe/customer-status
// Checks if a developer has an active payment method / subscription.
// ---------------------------------------------------------------------------

paymentsRouter.get('/api/stripe/customer-status', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment service not configured' });
    return;
  }

  const email = req.query.email as string;
  const ownerId = await getOptionalOwnerId(req);
  if (!email) {
    res.status(400).json({ error: 'Email query parameter required' });
    return;
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      res.json({ hasPaymentMethod: false, isActive: false });
      return;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
      limit: 1,
    });

    await upsertBillingCustomer({
      ownerId,
      email,
      stripeCustomerId: customer.id,
      subscriptionId: subscriptions.data[0]?.id ?? null,
    });

    res.json({
      hasPaymentMethod: paymentMethods.data.length > 0,
      isActive: subscriptions.data.length > 0,
      customerId: customer.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe customer status error:', message);
    res.status(502).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/stripe/create-portal
// Creates a Stripe Customer Portal session for managing billing.
// ---------------------------------------------------------------------------

paymentsRouter.post('/api/stripe/create-portal', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment service not configured' });
    return;
  }

  const { email, returnUrl } = req.body;
  const ownerId = await getOptionalOwnerId(req);

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }

  const ALLOWED_RETURN_HOSTS = ['varity.so', 'varity.app'];
  const DEFAULT_RETURN_URL = 'https://developer.store.varity.so/dashboard/billing';

  let safeReturnUrl = DEFAULT_RETURN_URL;
  if (returnUrl && typeof returnUrl === 'string') {
    try {
      const parsed = new URL(returnUrl);
      const allowed = ALLOWED_RETURN_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
      if (allowed) safeReturnUrl = returnUrl;
    } catch {
      // Invalid URL — fall back to default
    }
  }

  try {
    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      res.status(404).json({ error: 'Customer not found. Please add a payment method first.' });
      return;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    await upsertBillingCustomer({
      ownerId,
      email,
      stripeCustomerId: customer.id,
      subscriptionId: subscriptions.data[0]?.id ?? null,
    });

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: safeReturnUrl,
    });

    res.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe portal error:', message);
    res.status(502).json({ error: message });
  }
});
