import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { AppContext, JWTPayload } from './types';

// Extend Express Request to include appContext
declare global {
  namespace Express {
    interface Request {
      appContext?: AppContext;
    }
  }
}

/**
 * Middleware to validate JWT and extract app context
 */
export const validateAppToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode JWT
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    if (!decoded.appId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token: missing appId',
      });
      return;
    }

    // Attach app context to request
    req.appContext = {
      appId: decoded.appId,
      schema: `app_${decoded.appId}`, // Schema naming convention
    };

    next();
  } catch (error) {
    // Check TokenExpiredError FIRST — it extends JsonWebTokenError
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Generate JWT token for an app
 * (Used for testing and CLI integration)
 */
export const generateAppToken = (appId: string, expiresIn: string = '30d'): string => {
  return jwt.sign({ appId }, config.jwt.secret, { expiresIn } as jwt.SignOptions);
};
