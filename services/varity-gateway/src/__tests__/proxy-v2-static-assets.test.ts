import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.DB_PROXY_URL = process.env.DB_PROXY_URL || 'http://db-proxy.test';
process.env.DB_PROXY_TOKEN = process.env.DB_PROXY_TOKEN || 'test-db-token';
process.env.GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || 'test-gateway-key';
process.env.PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'test-privy-app';
process.env.PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || 'test-privy-secret';

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const { app } = await import('../app');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function request(
  url: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; contentType: string; body: string }> {
  return await new Promise((resolve, reject) => {
    const req = http.request(url, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => resolve({
        status: res.statusCode || 0,
        contentType: String(res.headers['content-type'] || ''),
        body: Buffer.concat(chunks).toString('utf-8'),
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('unscoped root static asset requests return plain 404, not app HTML', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('unexpected fetch');
  };

  try {
    await withServer(async (baseUrl) => {
      const res = await request(`${baseUrl}/_next/static/chunks/main.js`);
      assert.equal(res.status, 404);
      assert.match(res.contentType, /^text\/plain/);
      assert.equal(res.body, 'Asset path is missing an app prefix');
    });
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('root static asset requests with an app referer resolve through that app route', async () => {
  const originalFetch = globalThis.fetch;
  const cid = 'QmStaticAssetRoute11111111111111111111111111111';
  const calls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url === 'http://db-proxy.test/db/domains/get') {
      return new Response(JSON.stringify({
        success: true,
        data: [{ subdomain: 'my-static-app', cid, deploymentType: 'ipfs' }],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url === `https://ipfs.io/ipfs/${cid}/_next/static/chunks/main.js`) {
      return new Response('console.log("ok");', {
        status: 200,
        headers: { 'content-type': 'application/javascript' },
      });
    }
    return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  };

  try {
    await withServer(async (baseUrl) => {
      const res = await request(`${baseUrl}/_next/static/chunks/main.js`, {
        referer: 'https://varity.app/my-static-app/',
      });
      assert.equal(res.status, 200);
      assert.match(res.contentType, /^application\/javascript/);
      assert.equal(res.body, 'console.log("ok");');
    });
    assert.deepEqual(calls, [
      'http://db-proxy.test/db/domains/get',
      `https://ipfs.io/ipfs/${cid}/_next/static/chunks/main.js`,
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
