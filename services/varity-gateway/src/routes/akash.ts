/**
 * Akash Network Deployment API
 *
 * Provides proxy for Akash deployments to abstract credential complexity.
 * Developers call this API instead of managing Akash CLI/wallets directly.
 *
 * POST /api/akash/deploy - Deploy container to Akash Network
 * GET /api/akash/status/:id - Get deployment status
 * DELETE /api/akash/deploy/:id - Close deployment
 */

import { Router, Request, Response } from 'express';
import { verifyApiKey } from '../middleware/auth';
import { deployToAkash, getDeploymentStatus, closeDeployment } from '../services/akash-deploy';

export const akashRouter = Router();

/**
 * Akash deployment request
 */
interface AkashDeployRequest {
  containerImage: string;
  resources?: {
    cpu?: string;
    memory?: string;
    storage?: string;
  };
  env?: Record<string, string>;
  port?: number;
}

/**
 * Akash deployment response
 */
interface AkashDeployResponse {
  success: boolean;
  deploymentId?: string;
  url?: string;
  estimatedCost?: string;
  error?: string;
}

/**
 * Deploy container to Akash Network
 *
 * Example:
 *   POST /api/akash/deploy
 *   Authorization: Bearer <VARITY_API_KEY>
 *   {
 *     "containerImage": "ghcr.io/varity-labs/my-app:latest",
 *     "resources": { "cpu": "1", "memory": "1Gi", "storage": "1Gi" },
 *     "env": { "NODE_ENV": "production" },
 *     "port": 3000
 *   }
 */
akashRouter.post('/api/akash/deploy', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const {
      containerImage,
      resources = {},
      env = {},
      port = 3000,
    } = req.body as AkashDeployRequest;

    // Validate required fields
    if (!containerImage) {
      return res.status(400).json({
        success: false,
        error: 'containerImage is required',
      } as AkashDeployResponse);
    }

    // Default resources
    const cpu = resources.cpu || '1';
    const memory = resources.memory || '1Gi';
    const storage = resources.storage || '1Gi';

    // Deploy to Akash
    const result = await deployToAkash({
      containerImage,
      resources: { cpu, memory, storage },
      env,
      port,
    });

    const response: AkashDeployResponse = {
      success: true,
      deploymentId: result.deploymentId,
      url: result.url,
      estimatedCost: result.estimatedCost,
    };

    res.json(response);
  } catch (error) {
    console.error('[akash] Deploy failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as AkashDeployResponse);
  }
});

/**
 * Get deployment status
 *
 * Example:
 *   GET /api/akash/status/akash-123456
 *   Authorization: Bearer <VARITY_API_KEY>
 */
akashRouter.get('/api/akash/status/:id', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getDeploymentStatus(id);

    res.json({
      success: true,
      deploymentId: id,
      status: result.status,
      url: result.url,
    });
  } catch (error) {
    console.error('[akash] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Close deployment
 *
 * Example:
 *   DELETE /api/akash/deploy/akash-123456
 *   Authorization: Bearer <VARITY_API_KEY>
 */
akashRouter.delete('/api/akash/deploy/:id', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const closed = await closeDeployment(id);

    if (!closed) {
      return res.status(500).json({
        success: false,
        error: 'Failed to close deployment',
      });
    }

    res.json({
      success: true,
      message: 'Deployment closed successfully',
    });
  } catch (error) {
    console.error('[akash] Close deployment failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
