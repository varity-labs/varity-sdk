#!/usr/bin/env node
/**
 * Privy Integration Test Suite
 * Tests Privy authentication integration in varity-api-server
 */

const http = require('http');

const API_BASE = 'http://localhost:3001';
const API_V1 = `${API_BASE}/api/v1`;

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({ statusCode: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoint(name, options, expectedStatus, expectedData) {
  totalTests++;
  log('cyan', `\nTest ${totalTests}: ${name}`);

  try {
    const result = await makeRequest(options);

    if (result.statusCode !== expectedStatus) {
      failedTests++;
      log('red', `  ✗ FAIL - Expected status ${expectedStatus}, got ${result.statusCode}`);
      log('yellow', `  Response: ${JSON.stringify(result.data, null, 2)}`);
      return false;
    }

    if (expectedData) {
      const dataMatches = Object.keys(expectedData).every((key) => {
        const expected = expectedData[key];
        const actual = result.data[key];
        if (typeof expected === 'object' && expected !== null) {
          return JSON.stringify(actual) === JSON.stringify(expected);
        }
        return actual === expected;
      });

      if (!dataMatches) {
        failedTests++;
        log('red', `  ✗ FAIL - Response data doesn't match expected`);
        log('yellow', `  Expected: ${JSON.stringify(expectedData, null, 2)}`);
        log('yellow', `  Got: ${JSON.stringify(result.data, null, 2)}`);
        return false;
      }
    }

    passedTests++;
    log('green', `  ✓ PASS`);
    if (result.data) {
      log('blue', `  Response: ${JSON.stringify(result.data, null, 2)}`);
    }
    return true;
  } catch (error) {
    failedTests++;
    log('red', `  ✗ FAIL - ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('cyan', '\n╔════════════════════════════════════════════════════════╗');
  log('cyan', '║     Varity API Server - Privy Integration Tests       ║');
  log('cyan', '╚════════════════════════════════════════════════════════╝\n');

  log('yellow', 'Prerequisites:');
  log('yellow', '  1. Server must be running on http://localhost:3001');
  log('yellow', '  2. PRIVY_APP_ID and PRIVY_APP_SECRET must be set (or mocked)');
  log('yellow', '  3. Server must have built successfully\n');

  // Wait a moment for server to be ready
  log('blue', 'Waiting for server to be ready...\n');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 1: Root endpoint
  await testEndpoint(
    'GET / - Root endpoint',
    {
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET',
    },
    200,
    { success: true }
  );

  // Test 2: Health endpoint
  await testEndpoint(
    'GET /health - Health check',
    {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
    },
    200,
    { success: true }
  );

  // Test 3: Privy health endpoint
  await testEndpoint(
    'GET /api/v1/privy/health - Privy health check',
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/privy/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    200,
    { success: true }
  );

  // Test 4: Protected endpoint without auth (should fail)
  await testEndpoint(
    'GET /api/v1/privy/user - Without authentication (should fail)',
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/privy/user',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    401 // Expect unauthorized
  );

  // Test 5: Protected endpoint with invalid token (should fail)
  await testEndpoint(
    'GET /api/v1/privy/user - With invalid token (should fail)',
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/privy/user',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token-12345',
      },
    },
    401 // Expect unauthorized
  );

  // Test 6: Verify token endpoint with missing token (should fail)
  await testEndpoint(
    'POST /api/v1/privy/verify-token - Without token (should fail)',
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/privy/verify-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
    },
    400 // Expect bad request
  );

  // Print summary
  log('cyan', '\n╔════════════════════════════════════════════════════════╗');
  log('cyan', '║                    TEST SUMMARY                        ║');
  log('cyan', '╚════════════════════════════════════════════════════════╝\n');

  log('blue', `Total Tests:  ${totalTests}`);
  log('green', `Passed:       ${passedTests}`);
  log('red', `Failed:       ${failedTests}`);
  log('blue', `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (failedTests === 0) {
    log('green', '✓ ALL TESTS PASSED! Privy integration is working correctly.\n');
    process.exit(0);
  } else {
    log('red', `✗ ${failedTests} TEST(S) FAILED. Please review the errors above.\n`);
    log('yellow', 'Common issues:');
    log('yellow', '  - Server not running on http://localhost:3001');
    log('yellow', '  - PRIVY_APP_ID and PRIVY_APP_SECRET not configured');
    log('yellow', '  - Server build failed (run: pnpm run build)\n');
    process.exit(1);
  }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  log('yellow', '\n\nTests interrupted by user');
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  log('red', `\nFatal error: ${error.message}`);
  log('yellow', '\nMake sure the server is running:');
  log('yellow', '  cd varity-api-server');
  log('yellow', '  pnpm run dev\n');
  process.exit(1);
});
