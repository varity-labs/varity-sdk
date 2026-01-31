import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * Notifications Controller
 * Handles notification management and delivery
 */
export class NotificationsController {
  /**
   * Send notification
   * POST /api/v1/notifications/send
   */
  send = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipient, type, title, message, data } = req.body;

    if (!recipient || !type || !message) {
      throw new ValidationError('Recipient, type, and message are required');
    }

    logger.info(`Sending ${type} notification to ${recipient}`);

    // TODO: Implement via backend service
    const notification = {
      id: `notif-${Date.now()}`,
      recipient,
      type,
      title,
      message,
      data,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: notification,
    });
  });

  /**
   * Get notifications for user
   * GET /api/v1/notifications
   */
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerWallet = req.user?.address;
    const { status, type, page = 1, limit = 20 } = req.query;

    logger.info(`Getting notifications for wallet: ${customerWallet}`);

    res.status(200).json({
      success: true,
      data: {
        notifications: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
        },
      },
    });
  });

  /**
   * Mark notification as read
   * PUT /api/v1/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    logger.info(`Marking notification ${id} as read`);

    res.status(200).json({
      success: true,
      data: {
        id,
        status: 'read',
        readAt: new Date().toISOString(),
      },
    });
  });
}

export const notificationsController = new NotificationsController();
export default notificationsController;
