import express, { Request, Response, Express } from 'express';
import { PrometheusCollector } from './collectors/prometheus-collector';
import { MetricsAggregator } from './collectors/metrics-aggregator';

const app: Express = express();
const port = process.env.METRICS_PORT || 9090;

// Initialize collectors
const collector = new PrometheusCollector();
const aggregator = new MetricsAggregator(collector);

// Start default metrics collection
collector.startDefaultCollection(10000);

// Start metrics aggregation
aggregator.start(30000);

// Middleware
app.use(express.json());

/**
 * Main Prometheus metrics endpoint
 */
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await collector.getAllMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
});

/**
 * Get metrics by category
 */
app.get('/metrics/:category', async (req: Request, res: Response) => {
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
    console.error('Error collecting category metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aggregatorRunning: aggregator.isRunning(),
    uptime: process.uptime()
  });
});

/**
 * Status endpoint with detailed information
 */
app.get('/status', (req: Request, res: Response) => {
  res.json({
    service: 'varity-monitoring',
    version: '1.0.0',
    status: 'running',
    metrics: {
      storage: true,
      performance: true,
      cost: true,
      default: true
    },
    aggregation: {
      running: aggregator.isRunning(),
      interval: '30s'
    },
    endpoints: {
      metrics: '/metrics',
      storageMetrics: '/metrics/storage',
      performanceMetrics: '/metrics/performance',
      costMetrics: '/metrics/cost',
      defaultMetrics: '/metrics/default',
      health: '/health',
      status: '/status'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Reset all metrics (useful for testing)
 */
app.post('/reset', (req: Request, res: Response) => {
  try {
    collector.resetAll();
    res.json({
      message: 'All metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({ error: 'Error resetting metrics' });
  }
});

/**
 * Record custom metric (for testing/debugging)
 */
app.post('/record/:metricType', (req: Request, res: Response) => {
  try {
    const { metricType } = req.params;
    const data = req.body;

    switch (metricType) {
      case 'storage':
        const storage = collector.getStorageMetrics();
        storage.recordStorageUsage(
          data.layer,
          data.tier,
          data.backend,
          data.namespace,
          data.bytes
        );
        break;

      case 'upload':
        const storageUpload = collector.getStorageMetrics();
        storageUpload.recordUpload(data.layer, data.backend, data.status, data.contentType);
        break;

      case 'download':
        const storageDownload = collector.getStorageMetrics();
        storageDownload.recordDownload(data.layer, data.backend, data.status, data.cacheHit);
        break;

      case 'http':
        const performance = collector.getPerformanceMetrics();
        performance.recordHttpRequest(data.method, data.route, data.statusCode, data.duration);
        break;

      case 'cost':
        const cost = collector.getCostMetrics();
        cost.recordStorageMonthlyCost(data.layer, data.backend, data.tier, data.usd);
        break;

      default:
        return res.status(400).json({ error: 'Invalid metric type' });
    }

    res.json({
      message: 'Metric recorded successfully',
      metricType,
      data
    });
  } catch (error) {
    console.error('Error recording metric:', error);
    res.status(500).json({ error: 'Error recording metric' });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  aggregator.stop();
  collector.stopDefaultCollection();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  aggregator.stop();
  collector.stopDefaultCollection();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`Varity Monitoring Server running on port ${port}`);
  console.log(`Metrics endpoint: http://localhost:${port}/metrics`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Status: http://localhost:${port}/status`);
});

export { app, collector, aggregator };
