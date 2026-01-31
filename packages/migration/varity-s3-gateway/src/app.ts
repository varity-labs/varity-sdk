import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import s3Routes from './routes/s3.routes';
import authRoutes from './routes/auth.routes';
import { buildXMLErrorResponse, generateRequestId } from './utils/xml-builder';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // ===== SECURITY MIDDLEWARE =====

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: false, // S3 doesn't use CSP
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-amz-date',
      'x-amz-content-sha256',
      'x-amz-meta-*',
      'x-amz-copy-source',
      'If-Match',
      'If-None-Match',
      'If-Modified-Since',
      'If-Unmodified-Since',
      'Range'
    ],
    exposedHeaders: [
      'ETag',
      'x-amz-request-id',
      'x-amz-version-id',
      'x-amz-copy-source-version-id',
      'Last-Modified'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(503).send(
        buildXMLErrorResponse(
          'SlowDown',
          'Please reduce your request rate',
          req.path,
          generateRequestId()
        )
      );
    }
  });
  app.use(limiter);

  // ===== LOGGING MIDDLEWARE =====

  // HTTP request logging
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ===== BODY PARSING MIDDLEWARE =====

  // Parse JSON for auth routes
  app.use('/auth', express.json());

  // Parse raw body for object uploads (S3 uses raw binary data)
  app.use(express.raw({
    type: '*/*',
    limit: process.env.MAX_UPLOAD_SIZE || '100mb'
  }));

  // ===== HEALTH CHECK ENDPOINT =====

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'varity-s3-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: {
        walletAuth: process.env.WALLET_AUTH_ENABLED !== 'false',
        authMode: process.env.AUTH_MODE || 'hybrid',
        chainId: 33529 // Varity L3
      }
    });
  });

  // ===== AUTHENTICATION ROUTES =====

  app.use('/auth', authRoutes);

  // ===== S3 API ROUTES =====

  app.use('/', s3Routes);

  // ===== ERROR HANDLING MIDDLEWARE =====

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).send(
      buildXMLErrorResponse(
        'NoSuchKey',
        'The specified key does not exist',
        req.path,
        generateRequestId()
      )
    );
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);

    res.status(500).send(
      buildXMLErrorResponse(
        'InternalError',
        'We encountered an internal error. Please try again.',
        req.path,
        generateRequestId()
      )
    );
  });

  return app;
}
