import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * Monitoring Controller
 */
export class MonitoringController {
  getMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerWallet = req.user?.address;

    res.status(200).json({
      success: true,
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    });
  });

  getAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: { alerts: [] },
    });
  });
}

export const monitoringController = new MonitoringController();
export default monitoringController;
