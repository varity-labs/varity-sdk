import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * Webhooks Controller
 */
export class WebhooksController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { url, events } = req.body;
    const customerWallet = req.user?.address;

    if (!url || !events) {
      throw new ValidationError('URL and events are required');
    }

    logger.info(`Registering webhook for wallet: ${customerWallet}`);

    res.status(201).json({
      success: true,
      data: {
        id: `webhook-${Date.now()}`,
        url,
        events,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    });
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerWallet = req.user?.address;

    res.status(200).json({
      success: true,
      data: { webhooks: [] },
    });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: 'Webhook deleted',
    });
  });
}

export const webhooksController = new WebhooksController();
export default webhooksController;
