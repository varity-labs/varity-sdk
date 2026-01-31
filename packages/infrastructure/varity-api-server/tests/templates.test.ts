import request from 'supertest';
import { VarityAPIServer } from '../src/server';

describe('Template Endpoints', () => {
  let server: VarityAPIServer;
  let app: any;
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

  beforeAll(() => {
    server = new VarityAPIServer();
    app = server.getApp();
  });

  describe('GET /api/v1/templates', () => {
    it('should list all templates', async () => {
      const response = await request(app).get('/api/v1/templates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('templates');
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });

    it('should filter templates by industry', async () => {
      const response = await request(app).get('/api/v1/templates?industry=iso-merchant');

      expect(response.status).toBe(200);
      expect(response.body.data.templates.length).toBeGreaterThan(0);
      expect(response.body.data.templates[0].industry).toBe('iso-merchant');
    });

    it('should filter featured templates', async () => {
      const response = await request(app).get('/api/v1/templates?featured=true');

      expect(response.status).toBe(200);
      expect(response.body.data.templates.every((t: any) => t.featured)).toBe(true);
    });
  });

  describe('POST /api/v1/templates/deploy', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/templates/deploy')
        .send({
          industry: 'iso-merchant',
          l3Network: 'arbitrum-l3',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should deploy template with authentication', async () => {
      const response = await request(app)
        .post('/api/v1/templates/deploy')
        .set('Authorization', `Bearer ${testAddress}`)
        .send({
          industry: 'iso-merchant',
          l3Network: 'arbitrum-l3',
          customization: {
            branding: {
              companyName: 'Test Company',
              logoUrl: 'https://example.com/logo.png',
            },
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deploymentId');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/templates/deploy')
        .set('Authorization', `Bearer ${testAddress}`)
        .send({
          industry: 'iso-merchant',
          // Missing l3Network
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate industry enum', async () => {
      const response = await request(app)
        .post('/api/v1/templates/deploy')
        .set('Authorization', `Bearer ${testAddress}`)
        .send({
          industry: 'invalid-industry',
          l3Network: 'arbitrum-l3',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/templates/:industry', () => {
    it('should get templates for specific industry', async () => {
      const response = await request(app).get('/api/v1/templates/iso-merchant');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('industry', 'iso-merchant');
      expect(response.body.data).toHaveProperty('templates');
    });
  });
});
