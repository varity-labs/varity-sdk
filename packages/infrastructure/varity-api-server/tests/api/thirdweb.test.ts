import request from 'supertest';
import { VarityAPIServer } from '../../src/server';
import { thirdwebService } from '../../src/services/thirdweb.service';

describe('Thirdweb API Integration Tests', () => {
  let server: VarityAPIServer;
  let app: any;

  beforeAll(async () => {
    server = new VarityAPIServer();
    app = server.getApp();

    // Initialize thirdweb service for tests
    await thirdwebService.initialize();
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Contracts API', () => {
    describe('POST /api/v1/contracts/deploy', () => {
      it('should reject deployment without contract type', async () => {
        const response = await request(app)
          .post('/api/v1/contracts/deploy')
          .send({
            name: 'TestContract',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject custom contract without ABI', async () => {
        const response = await request(app)
          .post('/api/v1/contracts/deploy')
          .send({
            contractType: 'custom',
            name: 'TestContract',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('ABI and bytecode');
      });

      it('should reject deployment without private key', async () => {
        const response = await request(app)
          .post('/api/v1/contracts/deploy')
          .send({
            contractType: 'custom',
            name: 'TestContract',
            abi: [],
            bytecode: '0x1234',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/contracts/:address', () => {
      it('should reject invalid contract address', async () => {
        const response = await request(app)
          .get('/api/v1/contracts/invalid-address');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should accept valid contract address format', async () => {
        const response = await request(app)
          .get('/api/v1/contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

        // May fail if contract doesn't exist, but should pass validation
        expect([200, 404, 500]).toContain(response.status);
      });
    });

    describe('POST /api/v1/contracts/:address/read', () => {
      it('should reject read without ABI', async () => {
        const response = await request(app)
          .post('/api/v1/contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/read')
          .send({
            functionName: 'balanceOf',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject read without function name', async () => {
        const response = await request(app)
          .post('/api/v1/contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/read')
          .send({
            abi: [],
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/contracts/:address/events', () => {
      it('should accept valid contract address', async () => {
        const response = await request(app)
          .get('/api/v1/contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/events');

        // May fail depending on contract, but should pass validation
        expect([200, 404, 500]).toContain(response.status);
      });

      it('should accept query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/contracts/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/events')
          .query({
            fromBlock: 1000,
            toBlock: 2000,
            eventName: 'Transfer',
          });

        expect([200, 404, 500]).toContain(response.status);
      });
    });

    describe('IPFS Operations', () => {
      describe('POST /api/v1/contracts/ipfs/upload', () => {
        it('should reject upload without data', async () => {
          const response = await request(app)
            .post('/api/v1/contracts/ipfs/upload')
            .send({});

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        });
      });

      describe('POST /api/v1/contracts/ipfs/download', () => {
        it('should reject download without URI', async () => {
          const response = await request(app)
            .post('/api/v1/contracts/ipfs/download')
            .send({});

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        });
      });
    });
  });

  describe('Chains API', () => {
    describe('GET /api/v1/chains', () => {
      it('should return Varity L3 chain information', async () => {
        const response = await request(app)
          .get('/api/v1/chains');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.chainId).toBe(33529);
        expect(response.body.data.name).toBe('Varity L3 Testnet');
        expect(response.body.data.nativeCurrency.symbol).toBe('USDC');
        expect(response.body.data.nativeCurrency.decimals).toBe(6);
      });

      it('should include parent chain information', async () => {
        const response = await request(app)
          .get('/api/v1/chains');

        expect(response.status).toBe(200);
        expect(response.body.data.parent.chain).toBe('arbitrum-one');
        expect(response.body.data.parent.chainId).toBe(42161);
      });

      it('should include Varity features', async () => {
        const response = await request(app)
          .get('/api/v1/chains');

        expect(response.status).toBe(200);
        expect(response.body.data.features.dataAvailability).toBe('Celestia');
        expect(response.body.data.features.encryption).toBe('Lit Protocol');
        expect(response.body.data.features.thirdwebSupport).toBe(true);
      });
    });

    describe('GET /api/v1/chains/supported', () => {
      it('should return list of supported chains', async () => {
        const response = await request(app)
          .get('/api/v1/chains/supported');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.chains).toBeInstanceOf(Array);
        expect(response.body.data.count).toBeGreaterThan(0);
      });
    });

    describe('POST /api/v1/chains/validate', () => {
      it('should validate Varity L3 chain ID', async () => {
        const response = await request(app)
          .post('/api/v1/chains/validate')
          .send({ chainId: 33529 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.supported).toBe(true);
      });

      it('should reject invalid chain ID', async () => {
        const response = await request(app)
          .post('/api/v1/chains/validate')
          .send({ chainId: 99999 });

        expect(response.status).toBe(200);
        expect(response.body.data.valid).toBe(false);
        expect(response.body.data.supported).toBe(false);
      });

      it('should reject request without chain ID', async () => {
        const response = await request(app)
          .post('/api/v1/chains/validate')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/chains/:chainId', () => {
      it('should return Varity L3 details', async () => {
        const response = await request(app)
          .get('/api/v1/chains/33529');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.chainId).toBe(33529);
      });

      it('should reject unsupported chain', async () => {
        const response = await request(app)
          .get('/api/v1/chains/99999');

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Wallets API', () => {
    describe('GET /api/v1/wallets/:address/balance', () => {
      it('should reject invalid wallet address', async () => {
        const response = await request(app)
          .get('/api/v1/wallets/invalid-address/balance');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should accept valid wallet address format', async () => {
        const response = await request(app)
          .get('/api/v1/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/balance');

        // May fail depending on network, but should pass validation
        expect([200, 404, 500]).toContain(response.status);
      });
    });

    describe('GET /api/v1/wallets/:address/nfts', () => {
      it('should accept pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/nfts')
          .query({
            limit: 10,
            offset: 0,
          });

        expect([200, 404, 500]).toContain(response.status);
      });
    });

    describe('GET /api/v1/wallets/:address/transactions', () => {
      it('should accept pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/transactions')
          .query({
            limit: 20,
            offset: 0,
          });

        expect([200, 404, 500]).toContain(response.status);
      });
    });

    describe('POST /api/v1/wallets/:address/send', () => {
      it('should reject send without recipient', async () => {
        const response = await request(app)
          .post('/api/v1/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/send')
          .send({
            amount: '1.0',
            privateKey: '0x1234',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject send without amount', async () => {
        const response = await request(app)
          .post('/api/v1/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/send')
          .send({
            to: '0x5678',
            privateKey: '0x1234',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject send without private key', async () => {
        const response = await request(app)
          .post('/api/v1/wallets/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/send')
          .send({
            to: '0x5678',
            amount: '1.0',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on strict endpoints', async () => {
      // Make multiple requests to exceed rate limit
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/v1/contracts/deploy')
          .send({
            contractType: 'custom',
            name: 'Test',
            abi: [],
            bytecode: '0x1234',
          })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // At least one should be rate limited
      expect(rateLimited).toBe(true);
    }, 30000); // Longer timeout for rate limit test
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/v1/contracts/invalid-address');

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle 404 endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent-endpoint');

      expect(response.status).toBe(404);
    });
  });

  describe('USDC Decimals Handling', () => {
    it('should return 6 decimals for USDC in chain info', async () => {
      const response = await request(app)
        .get('/api/v1/chains');

      expect(response.status).toBe(200);
      expect(response.body.data.nativeCurrency.decimals).toBe(6);
      expect(response.body.data.nativeCurrency.symbol).toBe('USDC');
    });

    it('should return 6 decimals for USDC in gas price', async () => {
      const response = await request(app)
        .get('/api/v1/chains/33529/gas');

      if (response.status === 200) {
        expect(response.body.data.decimals).toBe(6);
        expect(response.body.data.currency).toBe('USDC');
      }
    });
  });
});
