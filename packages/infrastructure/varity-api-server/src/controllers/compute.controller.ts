import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * Compute Controller - Akash Network Integration
 */
export class ComputeController {
  deployToAkash = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { deploymentConfig } = req.body;
    const customerWallet = req.user?.address;

    if (!deploymentConfig) {
      throw new ValidationError('Deployment config is required');
    }

    logger.info(`Deploying to Akash for wallet: ${customerWallet}`);

    res.status(201).json({
      success: true,
      data: {
        deploymentId: `akash-${Date.now()}`,
        status: 'deploying',
        akashNetwork: 'akashnet-2',
      },
    });
  });

  getDeploymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        deploymentId: id,
        status: 'running',
        url: `https://${id}.akash.network`,
      },
    });
  });
}

export const computeController = new ComputeController();
export default computeController;
