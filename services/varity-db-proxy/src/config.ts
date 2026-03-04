import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`FATAL: ${key} environment variable is required`);
    process.exit(1);
  }
  return value;
}

export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: requireEnv('DB_PASSWORD'),
    name: process.env.DB_NAME || 'varity',
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
  },

  server: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development',
  },

  // CORS: '*' is intentional — Varity-hosted apps are served from various gateways
  // with unpredictable origins.
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};
