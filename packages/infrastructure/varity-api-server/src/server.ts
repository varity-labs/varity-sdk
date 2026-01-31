import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { envConfig, validateEnvConfig } from './config/env.config';
import { logger } from './config/logger.config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { standardRateLimiter } from './middleware/rateLimit.middleware';
import { backendService } from './services/backend.service';

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import privyRoutes from './routes/privy.routes';
import storageRoutes from './routes/storage.routes';
import analyticsRoutes from './routes/analytics.routes';
import templatesRoutes from './routes/templates.routes';
import dashboardsRoutes from './routes/dashboards.routes';
import notificationsRoutes from './routes/notifications.routes';
import webhooksRoutes from './routes/webhooks.routes';
import monitoringRoutes from './routes/monitoring.routes';
import exportRoutes from './routes/export.routes';
import cacheRoutes from './routes/cache.routes';
import computeRoutes from './routes/compute.routes';
import zkRoutes from './routes/zk.routes';
import contractsRoutes from './routes/contracts.routes';
import chainsRoutes from './routes/chains.routes';
import walletsRoutes from './routes/wallets.routes';

/**
 * Varity API Server
 * Private REST API gateway between Frontend SDK and Backend SDK
 */
export class VarityAPIServer {
  private app: Application;
  private port: number;
  private host: string;

  constructor() {
    this.app = express();
    this.port = envConfig.server.port;
    this.host = envConfig.server.host;
  }

  /**
   * Configure Express middleware
   */
  private configureMiddleware(): void {
    // Security middleware
    if (envConfig.security.helmetEnabled) {
      this.app.use(helmet());
    }

    // Trust proxy if configured
    if (envConfig.security.trustProxy) {
      this.app.set('trust proxy', 1);
    }

    // CORS configuration
    this.app.use(
      cors({
        origin: envConfig.cors.origin,
        credentials: envConfig.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    if (envConfig.monitoring.enableRequestLogging) {
      this.app.use(
        morgan('combined', {
          stream: {
            write: (message: string) => logger.info(message.trim()),
          },
        })
      );
    }

    // Rate limiting
    this.app.use(standardRateLimiter);
  }

  /**
   * Configure API routes
   */
  private configureRoutes(): void {
    const apiBasePath = envConfig.server.apiBasePath;

    // Health check routes (no API prefix)
    this.app.use('/health', healthRoutes);

    // API v1 routes
    this.app.use(`${apiBasePath}/auth`, authRoutes);
    this.app.use(`${apiBasePath}/privy`, privyRoutes);
    this.app.use(`${apiBasePath}/storage`, storageRoutes);
    this.app.use(`${apiBasePath}/analytics`, analyticsRoutes);
    this.app.use(`${apiBasePath}/templates`, templatesRoutes);
    this.app.use(`${apiBasePath}/dashboards`, dashboardsRoutes);
    this.app.use(`${apiBasePath}/notifications`, notificationsRoutes);
    this.app.use(`${apiBasePath}/webhooks`, webhooksRoutes);
    this.app.use(`${apiBasePath}/monitoring`, monitoringRoutes);
    this.app.use(`${apiBasePath}/export`, exportRoutes);
    this.app.use(`${apiBasePath}/cache`, cacheRoutes);
    this.app.use(`${apiBasePath}/compute`, computeRoutes);
    this.app.use(`${apiBasePath}/zk`, zkRoutes);

    // Thirdweb routes
    this.app.use(`${apiBasePath}/contracts`, contractsRoutes);
    this.app.use(`${apiBasePath}/chains`, chainsRoutes);
    this.app.use(`${apiBasePath}/wallets`, walletsRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Varity API Server',
        version: '1.0.0',
        environment: envConfig.server.nodeEnv,
        documentation: '/docs',
      });
    });

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Initialize backend services
   */
  private async initializeServices(): Promise<void> {
    try {
      logger.info('Initializing backend services...');
      await backendService.initialize();
      logger.info('Backend services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize backend services', error);
      // Continue startup even if backend services fail
      // This allows the API server to respond with appropriate errors
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Validate environment configuration
      validateEnvConfig();

      // Configure middleware
      this.configureMiddleware();

      // Configure routes
      this.configureRoutes();

      // Initialize backend services
      await this.initializeServices();

      // Start listening
      this.app.listen(this.port, this.host, () => {
        logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🚀 VARITY API SERVER STARTED 🚀                ║
║                                                           ║
║  Environment: ${envConfig.server.nodeEnv.padEnd(44)}║
║  Host:        ${this.host.padEnd(44)}║
║  Port:        ${this.port.toString().padEnd(44)}║
║  API:         ${`http://${this.host}:${this.port}${envConfig.server.apiBasePath}`.padEnd(44)}║
║  Health:      ${`http://${this.host}:${this.port}/health`.padEnd(44)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // TODO: Close backend service connections
      // TODO: Close database connections
      // TODO: Finish pending requests

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get Express application instance
   */
  getApp(): Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new VarityAPIServer();
  server.start().catch((error) => {
    logger.error('Fatal error during startup', error);
    process.exit(1);
  });
}

export default VarityAPIServer;
