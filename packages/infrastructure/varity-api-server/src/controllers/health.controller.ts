import { Request, Response } from 'express';
import { backendService } from '../services/backend.service';
import { envConfig } from '../config/env.config';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Health Check Controller
 */
export class HealthController {
  /**
   * Basic health check
   * GET /health
   */
  check = asyncHandler(async (req: Request, res: Response) => {
    const health = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envConfig.server.nodeEnv,
      version: '1.0.0',
      uptime: process.uptime(),
    };

    res.status(200).json(health);
  });

  /**
   * Detailed health check with backend services
   * GET /health/detailed
   */
  detailed = asyncHandler(async (req: Request, res: Response) => {
    const backendHealth = await backendService.healthCheck();

    const health = {
      success: true,
      status: backendHealth.status,
      timestamp: new Date().toISOString(),
      environment: envConfig.server.nodeEnv,
      version: '1.0.0',
      uptime: process.uptime(),
      services: backendHealth.services,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
    };

    res.status(200).json(health);
  });

  /**
   * Readiness probe (for Kubernetes)
   * GET /health/ready
   */
  ready = asyncHandler(async (req: Request, res: Response) => {
    const isReady = backendService.isReady();

    if (isReady) {
      res.status(200).json({
        success: true,
        status: 'ready',
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not_ready',
      });
    }
  });

  /**
   * Liveness probe (for Kubernetes)
   * GET /health/live
   */
  live = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'alive',
    });
  });
}

export const healthController = new HealthController();
export default healthController;
