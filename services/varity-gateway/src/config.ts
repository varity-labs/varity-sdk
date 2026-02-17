import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

export const config = {
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    env: process.env.NODE_ENV || 'development',
  },
  dbProxy: {
    url: requireEnv('DB_PROXY_URL'),
    token: requireEnv('DB_PROXY_TOKEN'),
  },
  gateway: {
    baseDomain: process.env.BASE_DOMAIN || 'varity.app',
    apiKey: requireEnv('GATEWAY_API_KEY'),
    ipfsBackend: process.env.IPFS_BACKEND || 'ipfscdn.io',
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
  },
};

export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'store', 'docs', 'developer',
  'status', 'blog', 'help', 'support', 'mail', 'app',
  'dashboard', 'console', 'gateway', 'cdn', 'static',
  'health', 'resolve', 'tls-check', 'mx', 'ftp', 'ssh',
]);

export const DB_COLLECTION = 'domains';
