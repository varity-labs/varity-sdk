import { Request, Response, NextFunction } from 'express';
import { PrivyClient } from '@privy-io/node';
import { config } from '../config';

export const privy = new PrivyClient({
  appId: config.privy.appId,
  appSecret: config.privy.appSecret,
});

export async function verifyPrivyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const claims = await privy.utils().auth().verifyAccessToken(token);
    req.user = { userId: claims.user_id };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
