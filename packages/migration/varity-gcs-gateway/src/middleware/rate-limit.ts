/**
 * Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: {
      code: 429,
      message: 'Too many requests',
      errors: [{
        domain: 'global',
        reason: 'rateLimitExceeded',
        message: 'Rate limit exceeded. Please try again later.'
      }]
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Upload rate limiter (more restrictive)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 uploads per windowMs
  message: {
    error: {
      code: 429,
      message: 'Too many upload requests',
      errors: [{
        domain: 'global',
        reason: 'rateLimitExceeded',
        message: 'Upload rate limit exceeded. Please try again later.'
      }]
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
