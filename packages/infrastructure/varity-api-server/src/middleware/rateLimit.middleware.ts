import rateLimit from 'express-rate-limit';
import { envConfig } from '../config/env.config';

/**
 * Standard Rate Limiter
 * Applies to most API endpoints
 */
export const standardRateLimiter = rateLimit({
  windowMs: envConfig.rateLimit.windowMs,
  max: envConfig.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test environment
    return envConfig.server.isTest;
  },
});

/**
 * Strict Rate Limiter
 * Applies to expensive operations (template deployment, file uploads, etc.)
 */
export const strictRateLimiter = rateLimit({
  windowMs: envConfig.rateLimit.windowMs,
  max: envConfig.rateLimit.strictMaxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests for this operation, please try again later',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return envConfig.server.isTest;
  },
});

/**
 * Auth Rate Limiter
 * Stricter limits for authentication endpoints to prevent brute force
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  skip: (req) => {
    return envConfig.server.isTest;
  },
});

/**
 * Upload Rate Limiter
 * For file upload endpoints
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: {
      message: 'Upload limit reached, please try again later',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return envConfig.server.isTest;
  },
});

export default standardRateLimiter;
