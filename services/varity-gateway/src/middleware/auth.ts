import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

/**
 * Verify the API key in the Authorization header using timing-safe comparison.
 *
 * Expected header format: `Authorization: Bearer <GATEWAY_API_KEY>`
 *
 * Used to protect domain registration/management endpoints and the
 * internal /resolve endpoint. Public proxy routes do NOT require auth.
 */
export function verifyApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  const expected = config.gateway.apiKey;

  // crypto.timingSafeEqual throws if buffers differ in length
  if (token.length !== expected.length) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected),
  );

  if (!valid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
