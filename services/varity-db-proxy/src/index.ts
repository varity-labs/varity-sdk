import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import dbRoutes from './routes/db';
import { generateAppToken } from './auth';
import { closePool } from './schema';
import pool, { waitForDatabase } from './pool';

const app: Express = express();

app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting on DB routes
const dbLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  message: { success: false, error: 'Too many requests' },
});
app.use('/db', dbLimiter);

// Request logging (development only)
if (config.server.env === 'development') {
  app.use((req: Request, res: Response, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/db', dbRoutes);

// Health check endpoint — verifies DB connectivity
app.get('/health', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({
      status: 'healthy',
      service: 'varity-db-proxy',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'varity-db-proxy',
      error: 'database unreachable',
      timestamp: new Date().toISOString(),
    });
  }
});

// Token generation endpoint — development only
if (config.server.env === 'development') {
  app.post('/generate-token', (req: Request, res: Response) => {
    const { appId } = req.body;

    if (!appId) {
      res.status(400).json({
        success: false,
        error: 'appId is required',
      });
      return;
    }

    const token = generateAppToken(appId);

    res.json({
      success: true,
      data: {
        appId,
        token,
        expiresIn: '30d',
      },
    });
  });
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server — wait for database first
const startServer = async () => {
  try {
    await waitForDatabase();
  } catch (err) {
    console.error('FATAL:', err);
    process.exit(1);
  }

  const server = app.listen(config.server.port, () => {
    console.log('');
    console.log('=== VARITY DATABASE PROXY ===');
    console.log(`  Port:        ${config.server.port}`);
    console.log(`  Environment: ${config.server.env}`);
    console.log(`  Database:    ${config.database.host}:${config.database.port}`);
    console.log(`  Endpoints:   /db/:collection/{add,get,update/:id,delete/:id}`);
    console.log(`  Health:      /health`);
    if (config.server.env === 'development') {
      console.log(`  Dev token:   POST /generate-token`);
    }
    console.log('');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await closePool();
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

export default app;
