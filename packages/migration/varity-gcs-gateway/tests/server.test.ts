/**
 * GCS Gateway Server Tests
 */

import request from 'supertest';
import { GCSGatewayServer } from '../src/server';

describe('GCS Gateway Server', () => {
  let server: GCSGatewayServer;
  let app: any;

  beforeAll(() => {
    server = new GCSGatewayServer();
    app = server.getApp();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'varity-gcs-gateway');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Varity GCS Gateway');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for bucket operations', async () => {
      const response = await request(app)
        .get('/storage/v1/b')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 401);
    });

    it('should require authentication for object operations', async () => {
      const response = await request(app)
        .get('/storage/v1/b/test-bucket/o')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 401);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown/endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 404);
    });
  });
});
