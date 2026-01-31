import request from 'supertest';
import express from 'express';
import { PrometheusCollector } from '../src/collectors/prometheus-collector';

// Create a test server
function createTestServer() {
  const app = express();
  const collector = new PrometheusCollector();

  app.use(express.json());

  app.get('/metrics', async (req, res) => {
    try {
      const metrics = await collector.getAllMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  });

  app.get('/metrics/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const validCategories = ['storage', 'performance', 'cost', 'default'];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          validCategories
        });
      }

      const metrics = await collector.getMetricsByCategory(
        category as 'storage' | 'performance' | 'cost' | 'default'
      );
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  app.post('/reset', (req, res) => {
    try {
      collector.resetAll();
      res.json({
        message: 'All metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Error resetting metrics' });
    }
  });

  return { app, collector };
}

describe('Metrics Server', () => {
  let testServer: { app: express.Application; collector: PrometheusCollector };

  beforeEach(() => {
    testServer = createTestServer();
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(testServer.app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should include default Node.js metrics', async () => {
      const response = await request(testServer.app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('varity_nodejs_');
      expect(response.text).toContain('process_');
    });
  });

  describe('GET /metrics/:category', () => {
    it('should return storage metrics', async () => {
      const response = await request(testServer.app)
        .get('/metrics/storage')
        .expect(200);

      expect(response.text).toContain('varity_storage');
    });

    it('should return performance metrics', async () => {
      const response = await request(testServer.app)
        .get('/metrics/performance')
        .expect(200);

      expect(response.text).toContain('varity_http_');
    });

    it('should return cost metrics', async () => {
      const response = await request(testServer.app)
        .get('/metrics/cost')
        .expect(200);

      expect(response.text).toContain('varity_');
      expect(response.text).toContain('cost');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(testServer.app)
        .get('/metrics/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid category');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(testServer.app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /reset', () => {
    it('should reset all metrics', async () => {
      // Record some metrics first
      const storage = testServer.collector.getStorageMetrics();
      storage.recordStorageUsage('test', 'hot', 'filecoin', 'test', 1024);

      // Reset metrics
      const response = await request(testServer.app)
        .post('/reset')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset successfully');

      // Verify metrics are reset
      const metricsResponse = await request(testServer.app)
        .get('/metrics/storage')
        .expect(200);

      // After reset, storage should not contain the test value
      expect(metricsResponse.text).not.toContain('1024');
    });
  });
});

describe('Metrics Integration', () => {
  let testServer: { app: express.Application; collector: PrometheusCollector };

  beforeEach(() => {
    testServer = createTestServer();
  });

  it('should record and retrieve storage metrics', async () => {
    const storage = testServer.collector.getStorageMetrics();
    storage.recordStorageUsage('customer-data', 'hot', 'filecoin', 'customer-123', 5_000_000_000);

    const response = await request(testServer.app)
      .get('/metrics/storage')
      .expect(200);

    expect(response.text).toContain('varity_storage_bytes');
    expect(response.text).toContain('layer="customer-data"');
    expect(response.text).toContain('5000000000');
  });

  it('should record and retrieve performance metrics', async () => {
    const performance = testServer.collector.getPerformanceMetrics();
    performance.recordHttpRequest('GET', '/api/test', 200, 0.145);

    const response = await request(testServer.app)
      .get('/metrics/performance')
      .expect(200);

    expect(response.text).toContain('varity_http_request_duration_seconds');
    expect(response.text).toContain('method="GET"');
  });

  it('should record and retrieve cost metrics', async () => {
    const cost = testServer.collector.getCostMetrics();
    cost.recordStorageMonthlyCost('customer-data', 'filecoin', 'hot', 25.00);

    const response = await request(testServer.app)
      .get('/metrics/cost')
      .expect(200);

    expect(response.text).toContain('varity_storage_monthly_cost_usd');
  });

  it('should aggregate all metrics types', async () => {
    const storage = testServer.collector.getStorageMetrics();
    const performance = testServer.collector.getPerformanceMetrics();
    const cost = testServer.collector.getCostMetrics();

    storage.recordUpload('customer-data', 'filecoin', 'success');
    performance.recordHttpRequest('POST', '/api/upload', 201, 2.5);
    cost.recordStorageMonthlyCost('customer-data', 'filecoin', 'hot', 25.00);

    const response = await request(testServer.app)
      .get('/metrics')
      .expect(200);

    expect(response.text).toContain('varity_uploads_total');
    expect(response.text).toContain('varity_http_request_duration_seconds');
    expect(response.text).toContain('varity_storage_monthly_cost_usd');
  });
});
