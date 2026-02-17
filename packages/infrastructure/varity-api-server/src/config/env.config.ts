import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */
export const envConfig = {
  // Server Configuration
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    apiBasePath: process.env.API_BASE_PATH || '/api/v1',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // SIWE (Sign-In With Ethereum)
  siwe: {
    domain: process.env.SIWE_DOMAIN || 'localhost',
    uri: process.env.SIWE_URI || 'http://localhost:3001',
    statement: process.env.SIWE_STATEMENT || 'Sign in to Varity Dashboard',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    strictMaxRequests: parseInt(process.env.RATE_LIMIT_STRICT_MAX_REQUESTS || '10', 10),
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://varity:varity123@localhost:5432/varity_api',
  },

  // Backend SDK
  backend: {
    timeout: parseInt(process.env.BACKEND_SDK_TIMEOUT || '30000', 10),
  },

  // Filecoin Storage
  filecoin: {
    pinataApiKey: process.env.PINATA_API_KEY || '',
    pinataSecretKey: process.env.PINATA_SECRET_KEY || '',
  },

  // Akash Network
  akash: {
    nodeUrl: process.env.AKASH_NODE_URL || 'https://rpc.akash.network',
    chainId: process.env.AKASH_CHAIN_ID || 'akashnet-2',
  },

  // Arbitrum L3 (Varity L3 Testnet)
  arbitrum: {
    rpcUrl: process.env.ARBITRUM_L3_RPC_URL || 'http://localhost:8545',
    chainId: parseInt(process.env.ARBITRUM_L3_CHAIN_ID || '33529', 10),
  },

  // Thirdweb Configuration
  thirdweb: {
    clientId: process.env.THIRDWEB_CLIENT_ID || 'a35636133eb5ec6f30eb9f4c15fce2f3',
    secretKey: process.env.THIRDWEB_SECRET_KEY || '',
  },

  // Celestia
  celestia: {
    nodeUrl: process.env.CELESTIA_NODE_URL || 'http://localhost:26658',
    namespace: process.env.CELESTIA_NAMESPACE || 'varity',
  },

  // Lit Protocol
  lit: {
    network: process.env.LIT_NETWORK || 'jalapeno',
    chain: process.env.LIT_CHAIN || 'ethereum',
  },

  // Monitoring
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING === 'true',
  },

  // Security
  security: {
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },
};

/**
 * Validate required environment variables
 */
export function validateEnvConfig(): void {
  const requiredVars = [
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0 && envConfig.server.isProduction) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Warn about missing variables in development
  if (missingVars.length > 0 && envConfig.server.isDevelopment) {
    console.warn(
      `⚠️  Warning: Missing environment variables (using defaults): ${missingVars.join(', ')}`
    );
  }
}

export default envConfig;
