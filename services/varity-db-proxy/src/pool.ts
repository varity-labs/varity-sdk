import { Pool } from 'pg';
import { config } from './config';

// Shared PostgreSQL connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

/**
 * Wait for PostgreSQL to be ready before accepting requests.
 * Retries with linear backoff — essential for Akash where all
 * services start simultaneously (no depends_on ordering).
 */
export async function waitForDatabase(maxRetries = 30, retryDelayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`Database connected (attempt ${attempt}/${maxRetries})`);
      return;
    } catch (err: any) {
      console.log(
        `Waiting for database... attempt ${attempt}/${maxRetries} ` +
        `(${err.code || err.message})`
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  throw new Error(
    `Could not connect to PostgreSQL at ${config.database.host}:${config.database.port} ` +
    `after ${maxRetries} attempts`
  );
}

export default pool;
