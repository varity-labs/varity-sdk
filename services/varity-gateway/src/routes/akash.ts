/**
 * Akash Deployment Status & Management Routes
 *
 * Deployment creation happens via the CLI (varitykit app deploy).
 * The Gateway provides status checks and close operations for the dashboard.
 *
 * GET /api/akash/status/:id - Get deployment status
 * DELETE /api/akash/deploy/:id - Close deployment
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../middleware/auth';
import { verifyPrivyToken } from '../middleware/privyAuth';
import { getDeploymentStatus, closeDeployment } from '../services/akash-deploy';

export const akashRouter = Router();

function verifyPrivyOrApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token.length === process.env.GATEWAY_API_KEY?.length) {
    verifyApiKey(req, res, next);
    return;
  }

  void verifyPrivyToken(req, res, next);
}

/**
 * Get deployment status
 */
akashRouter.get('/api/akash/status/:id', verifyPrivyOrApiKey, async (req: Request, res: Response) => {
  try {
    const result = await getDeploymentStatus(req.params.id);
    res.json({ success: true, deploymentId: req.params.id, ...result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Close deployment
 */
akashRouter.delete('/api/akash/deploy/:id', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const closed = await closeDeployment(req.params.id);
    if (!closed) {
      res.status(500).json({ success: false, error: 'Failed to close deployment' });
      return;
    }
    res.json({ success: true, message: 'Deployment closed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
