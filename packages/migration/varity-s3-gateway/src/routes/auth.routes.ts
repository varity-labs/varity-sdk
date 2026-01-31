import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { SiweAuthService } from '../auth/siwe';
import { buildXMLErrorResponse, generateRequestId } from '../utils/xml-builder';

const router: ExpressRouter = Router();

/**
 * Generate nonce endpoint
 * GET /auth/nonce
 */
router.get('/nonce', (req: Request, res: Response) => {
  try {
    const nonce = SiweAuthService.generateNonce();

    res.status(200).json({
      success: true,
      nonce,
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce'
    });
  }
});

/**
 * Generate SIWE message endpoint
 * POST /auth/message
 * Body: { address: string, domain?: string, uri?: string, chainId?: number, statement?: string }
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { address, domain, uri, chainId, statement, resources } = req.body;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
      return;
    }

    // Use request host as default domain
    const messageDomain = domain || req.get('host') || 'localhost:3001';
    const messageUri = uri || `${req.protocol}://${messageDomain}`;

    const message = await SiweAuthService.generateSiweMessage({
      address,
      domain: messageDomain,
      uri: messageUri,
      chainId,
      statement,
      resources
    });

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('SIWE message generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate SIWE message'
    });
  }
});

/**
 * Verify SIWE signature and create session
 * POST /auth/verify
 * Body: { message: string, signature: string }
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      res.status(400).json({
        success: false,
        error: 'Message and signature are required'
      });
      return;
    }

    // Verify SIWE signature
    const result = await SiweAuthService.verifySiweSignature(message, signature);

    if (!result.valid) {
      res.status(403).json({
        success: false,
        error: result.error || 'Signature verification failed'
      });
      return;
    }

    // Create JWT token
    const token = SiweAuthService.createJwtToken(
      result.address!,
      result.chainId!,
      result.session!.nonce
    );

    res.status(200).json({
      success: true,
      token,
      address: result.address,
      chainId: result.chainId,
      session: result.session
    });
  } catch (error) {
    console.error('SIWE verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify signature'
    });
  }
});

/**
 * Verify JWT token endpoint
 * GET /auth/session
 * Header: Authorization: Bearer <token>
 */
router.get('/session', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization header with Bearer token required'
      });
      return;
    }

    const token = SiweAuthService.extractBearerToken(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
      return;
    }

    const result = SiweAuthService.verifyJwtToken(token);

    if (!result.valid) {
      res.status(403).json({
        success: false,
        error: result.error || 'Invalid or expired token'
      });
      return;
    }

    res.status(200).json({
      success: true,
      authenticated: true,
      address: result.address,
      chainId: result.chainId
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify session'
    });
  }
});

/**
 * Get authentication status
 * GET /auth/status
 */
router.get('/status', (req: Request, res: Response) => {
  const walletAuthEnabled = process.env.WALLET_AUTH_ENABLED !== 'false';
  const authMode = process.env.AUTH_MODE || 'hybrid';

  res.status(200).json({
    success: true,
    walletAuthEnabled,
    authMode,
    chainId: 33529, // Varity L3 Chain ID
    features: {
      siwe: true,
      jwt: true,
      iam: authMode !== 'wallet'
    }
  });
});

/**
 * Get nonce statistics (for monitoring)
 * GET /auth/stats
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const activeNonces = SiweAuthService.getActiveNonceCount();

    res.status(200).json({
      success: true,
      stats: {
        activeNonces,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

export default router;
