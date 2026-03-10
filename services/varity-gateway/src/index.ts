import { app } from './app';
import { config } from './config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

const server = app.listen(config.server.port, '0.0.0.0', () => {
  console.log('');
  console.log(`  Varity Gateway v${version}`);
  console.log(`  Environment:  ${config.server.env}`);
  console.log(`  Listening:    http://0.0.0.0:${config.server.port}`);
  console.log(`  Base domain:  ${config.gateway.baseDomain}`);
  console.log(`  IPFS backend: ${config.gateway.ipfsBackend}`);
  console.log(`  Cache TTL:    ${config.cache.ttlSeconds}s`);
  console.log('');
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n  Received ${signal}, shutting down...`);
  server.close(() => {
    console.log('  Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
