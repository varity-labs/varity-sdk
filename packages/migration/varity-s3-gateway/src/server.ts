import dotenv from 'dotenv';
import { createApp } from './app';

// Load environment variables
dotenv.config();

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create Express application
const app = createApp();

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║            Varity S3-Compatible Gateway Server                 ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Server:        http://${HOST}:${PORT}`);
  console.log(`  Health Check:  http://${HOST}:${PORT}/health`);
  console.log(`  Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('  Storage Backend:');
  console.log(`    Network:     ${process.env.VARITY_NETWORK || 'arbitrum-sepolia'}`);
  console.log(`    Backend:     ${process.env.STORAGE_BACKEND || 'filecoin-ipfs'}`);
  console.log('');
  console.log('  S3 API Endpoints:');
  console.log('    GET    /                       - List buckets');
  console.log('    PUT    /{bucket}               - Create bucket');
  console.log('    DELETE /{bucket}               - Delete bucket');
  console.log('    GET    /{bucket}?list-type=2   - List objects');
  console.log('    PUT    /{bucket}/{key}         - Upload object');
  console.log('    GET    /{bucket}/{key}         - Download object');
  console.log('    HEAD   /{bucket}/{key}         - Get object metadata');
  console.log('    DELETE /{bucket}/{key}         - Delete object');
  console.log('');
  console.log('  Authentication:');
  console.log('    Method:      AWS Signature V4');
  console.log(`    Access Key:  ${process.env.AWS_ACCESS_KEY_ID ? '✓ Configured' : '✗ Not configured'}`);
  console.log('');
  console.log('  Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('');
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('');
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
