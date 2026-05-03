import { createServer } from 'node:http';
import { config } from './config.js';
import { runMeterTick } from './meter.js';

let running = true;
let lastTickAt: string | null = null;
let lastTickStatus: 'starting' | 'ok' | 'error' = 'starting';

function startHealthServer(): void {
  const server = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        service: 'billing-meter',
        status: lastTickStatus,
        lastTickAt,
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`[billing-meter] Health server listening on ${config.port}`);
  });
}

async function runTickSafely(): Promise<void> {
  try {
    await runMeterTick();
    lastTickStatus = 'ok';
  } catch (error) {
    lastTickStatus = 'error';
    console.error('[billing-meter] Unhandled tick error:', error);
  } finally {
    lastTickAt = new Date().toISOString();
  }
}

async function main(): Promise<void> {
  console.log('[billing-meter] Starting');
  console.log(`[billing-meter] Interval: ${config.meterIntervalMs}ms`);

  startHealthServer();
  await runTickSafely();

  const interval = setInterval(async () => {
    if (!running) return;
    await runTickSafely();
  }, config.meterIntervalMs);

  const shutdown = () => {
    console.log('[billing-meter] Shutting down');
    running = false;
    clearInterval(interval);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('[billing-meter] Fatal:', error);
  process.exit(1);
});
