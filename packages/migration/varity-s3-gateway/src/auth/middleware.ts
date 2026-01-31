import { Request, Response, NextFunction } from 'express';
import { SignatureV4Verifier } from './signature-v4';
import { buildXMLErrorResponse } from '../utils/xml-builder';

/**
 * Extended Request with AWS authentication info
 */
export interface AuthenticatedRequest extends Request {
  awsAuth?: {
    accessKeyId: string;
    authenticated: boolean;
  };
}

/**
 * In-memory credentials store (replace with database in production)
 */
const credentialsStore = new Map<string, string>([
  // Example: Access Key ID -> Secret Access Key
  ['AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'],
  // Add more credentials from environment or database
]);

/**
 * Load credentials from environment variables
 */
function loadCredentialsFromEnv(): void {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    credentialsStore.set(accessKeyId, secretAccessKey);
    console.log(`Loaded credentials for access key: ${accessKeyId}`);
  }
}

// Load credentials on module initialization
loadCredentialsFromEnv();

/**
 * AWS Signature V4 authentication middleware
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Check for Authorization header
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
      res.status(403).send(
        buildXMLErrorResponse('AccessDenied', 'Access Denied', req.path)
      );
      return;
    }

    // Extract access key ID from auth header
    const accessKeyId = extractAccessKeyId(authHeader);
    if (!accessKeyId) {
      res.status(403).send(
        buildXMLErrorResponse('InvalidAccessKeyId', 'The AWS access key ID you provided does not exist in our records', req.path)
      );
      return;
    }

    // Get secret access key
    const secretAccessKey = credentialsStore.get(accessKeyId);
    if (!secretAccessKey) {
      res.status(403).send(
        buildXMLErrorResponse('InvalidAccessKeyId', 'The AWS access key ID you provided does not exist in our records', req.path)
      );
      return;
    }

    // Build request object for signature verification
    const awsRequest = {
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, string>,
      body: req.body
    };

    // Verify signature
    const result = SignatureV4Verifier.verify(awsRequest, secretAccessKey);

    if (!result.valid) {
      console.error(`Authentication failed: ${result.error}`);
      res.status(403).send(
        buildXMLErrorResponse(
          'SignatureDoesNotMatch',
          result.error || 'The request signature we calculated does not match the signature you provided',
          req.path
        )
      );
      return;
    }

    // Attach auth info to request
    req.awsAuth = {
      accessKeyId,
      authenticated: true
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).send(
      buildXMLErrorResponse('InternalError', 'We encountered an internal error. Please try again.', req.path)
    );
  }
}

/**
 * Optional authentication middleware (allows unauthenticated requests)
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'] as string;

  if (!authHeader) {
    // No auth header, allow anonymous access
    next();
    return;
  }

  // Auth header present, verify it
  authMiddleware(req, res, next);
}

/**
 * Extract access key ID from Authorization header
 */
function extractAccessKeyId(authHeader: string): string | null {
  try {
    const match = authHeader.match(/Credential=([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Add a new credential to the store
 */
export function addCredential(accessKeyId: string, secretAccessKey: string): void {
  credentialsStore.set(accessKeyId, secretAccessKey);
}

/**
 * Remove a credential from the store
 */
export function removeCredential(accessKeyId: string): void {
  credentialsStore.delete(accessKeyId);
}

/**
 * Get all access key IDs
 */
export function listAccessKeys(): string[] {
  return Array.from(credentialsStore.keys());
}
