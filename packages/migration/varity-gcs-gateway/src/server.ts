/**
 * Varity GCS Gateway Server
 * Google Cloud Storage-compatible JSON API with Filecoin/IPFS backend
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';

import { StorageService, ResumableUploadService } from './services';
import { BucketController, ObjectController, AuthController } from './controllers';
import { createGCSRoutes, createAuthRoutes } from './routes';
import {
  apiRateLimiter,
  uploadRateLimiter,
  createHybridAuthMiddleware,
  getAuthMode,
  isWalletAuthEnabled
} from './middleware';
import { Logger } from './utils';
import { ServiceAccountAuth, PermissionManager } from './auth';
import { StorageBackendConfig } from './types';

// Load environment variables
dotenv.config();

export class GCSGatewayServer {
  private app: Application;
  private logger: Logger;
  private storageService: StorageService;
  private resumableUploadService: ResumableUploadService;
  private bucketController: BucketController;
  private objectController: ObjectController;
  private authController: AuthController;
  private serviceAccount?: ServiceAccountAuth;
  private permissionManager: PermissionManager;

  constructor() {
    this.app = express();
    this.logger = new Logger('GCSGateway');

    // Initialize services
    this.storageService = this.createStorageService();
    this.resumableUploadService = new ResumableUploadService();
    this.permissionManager = new PermissionManager();

    // Initialize controllers
    this.bucketController = new BucketController(this.storageService);
    this.objectController = new ObjectController(
      this.storageService,
      this.resumableUploadService
    );
    this.authController = new AuthController(this.permissionManager);

    // Initialize service account if credentials provided
    if (process.env.GOOGLE_SERVICE_ACCOUNT) {
      this.serviceAccount = new ServiceAccountAuth(
        process.env.GOOGLE_SERVICE_ACCOUNT
      );
    }

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Create storage service with configuration
   */
  private createStorageService(): StorageService {
    const config: StorageBackendConfig = {
      pinataApiKey: process.env.PINATA_API_KEY || '',
      pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
      ipfsGateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
      litProtocolEnabled: process.env.LIT_PROTOCOL_ENABLED === 'true',
      celestiaDAEnabled: process.env.CELESTIA_DA_ENABLED === 'true'
    };

    return new StorageService(config);
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    this.app.use('/storage/v1', apiRateLimiter);
    this.app.use('/upload/storage/v1', uploadRateLimiter);
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        version: '1.0.0',
        service: 'varity-gcs-gateway',
        timestamp: new Date().toISOString(),
        activeSessions: this.resumableUploadService.getActiveSessionCount()
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Varity GCS Gateway',
        version: '1.0.0',
        description: 'Google Cloud Storage-compatible API with Filecoin/IPFS backend',
        endpoints: {
          health: '/health',
          buckets: '/storage/v1/b',
          objects: '/storage/v1/b/{bucket}/o',
          upload: '/upload/storage/v1/b/{bucket}/o'
        },
        documentation: 'https://cloud.google.com/storage/docs/json_api'
      });
    });

    // Authentication routes (public endpoints)
    const authRoutes = createAuthRoutes(this.permissionManager);
    this.app.use('/', authRoutes);

    // GCS API routes with hybrid authentication
    const authMode = getAuthMode();
    const walletAuthEnabled = isWalletAuthEnabled();

    this.logger.info(`Authentication mode: ${authMode}`);
    this.logger.info(`Wallet auth enabled: ${walletAuthEnabled}`);

    const hybridAuthMiddleware = createHybridAuthMiddleware({
      mode: authMode,
      walletAuthEnabled,
      serviceAccount: this.serviceAccount,
      permissionManager: this.permissionManager
    });

    const gcsRoutes = createGCSRoutes(
      this.bucketController,
      this.objectController,
      hybridAuthMiddleware
    );

    this.app.use('/', gcsRoutes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 404,
          message: 'Not found',
          errors: [{
            domain: 'global',
            reason: 'notFound',
            message: `Endpoint not found: ${req.method} ${req.path}`
          }]
        }
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error:', err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Internal server error',
          errors: [{
            domain: 'global',
            reason: 'internalError',
            message: process.env.NODE_ENV === 'development'
              ? err.message
              : 'An unexpected error occurred'
          }]
        }
      });
    });
  }

  /**
   * Start the server
   */
  async start(port: number = 8080): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        this.logger.info(`GCS Gateway server started on port ${port}`);
        this.logger.info(`Health check: http://localhost:${port}/health`);
        this.logger.info(`API documentation: https://cloud.google.com/storage/docs/json_api`);
        resolve();
      });
    });
  }

  /**
   * Get Express application
   */
  getApp(): Application {
    return this.app;
  }
}

// Start server if run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '8080');
  const server = new GCSGatewayServer();

  server.start(port).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}

export default GCSGatewayServer;
