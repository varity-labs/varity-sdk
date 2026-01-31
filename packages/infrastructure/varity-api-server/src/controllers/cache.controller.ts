import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Cache Controller
 */
export class CacheController {
  get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key } = req.params;

    res.status(200).json({
      success: true,
      data: { key, value: null },
    });
  });

  set = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key, value, ttl } = req.body;

    res.status(200).json({
      success: true,
      data: { key, cached: true },
    });
  });

  clear = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Cache cleared',
    });
  });
}

export const cacheController = new CacheController();
export default cacheController;
