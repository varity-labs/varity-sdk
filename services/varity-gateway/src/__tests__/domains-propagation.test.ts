import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PROXY_URL = process.env.DB_PROXY_URL || 'http://db-proxy.test';
process.env.DB_PROXY_TOKEN = process.env.DB_PROXY_TOKEN || 'test-db-token';
process.env.GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || 'test-gateway-key';
process.env.PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'test-privy-app';
process.env.PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || 'test-privy-secret';

test('waitForPropagation fails when a stored domain never becomes routable', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  try {
    const { PropagationTimeoutError, waitForPropagation } = await import('../routes/domains');
    await assert.rejects(
      waitForPropagation('missing-static-app', 5, 1),
      PropagationTimeoutError,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('waitForPropagation resolves once the domain appears in route storage', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    const data = calls < 2 ? [] : [{ subdomain: 'live-static-app', cid: 'Qm123' }];
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const { waitForPropagation } = await import('../routes/domains');
    await waitForPropagation('live-static-app', 50, 1);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
