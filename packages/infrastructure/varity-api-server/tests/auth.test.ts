import request from 'supertest';
import { VarityAPIServer } from '../src/server';

describe('Auth Endpoints', () => {
  let server: VarityAPIServer;
  let app: any;

  beforeAll(() => {
    server = new VarityAPIServer();
    app = server.getApp();
  });

  describe('POST /api/v1/auth/nonce', () => {
    it('should generate a nonce for SIWE authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
          chainId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('nonce');
      expect(response.body.data).toHaveProperty('message');
    });

    it('should reject invalid address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({
          address: 'invalid-address',
          chainId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject missing address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/nonce')
        .send({
          chainId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/verify', () => {
    it('should verify a valid token', async () => {
      // Generate a simple test token (base64 encoded)
      const testToken = Buffer.from(
        JSON.stringify({
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
          chainId: 1,
        })
      ).toString('base64');

      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({
          token: testToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valid', true);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return user info with valid token', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testAddress}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
    });
  });
});
