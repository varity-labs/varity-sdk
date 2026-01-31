import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * Export Controller
 */
export class ExportController {
  exportPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, data } = req.body;
    const customerWallet = req.user?.address;

    if (!type || !data) {
      throw new ValidationError('Type and data are required');
    }

    logger.info(`Exporting PDF for wallet: ${customerWallet}`);

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: `https://storage.varity.com/exports/export-${Date.now()}.pdf`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });
  });

  exportCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, data } = req.body;

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: `https://storage.varity.com/exports/export-${Date.now()}.csv`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });
  });
}

export const exportController = new ExportController();
export default exportController;
