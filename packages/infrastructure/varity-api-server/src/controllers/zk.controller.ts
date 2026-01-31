import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';

/**
 * ZK Proofs Controller - Celestia DA Integration
 */
export class ZKController {
  generateProof = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, proofType } = req.body;
    const customerWallet = req.user?.address;

    if (!data || !proofType) {
      throw new ValidationError('Data and proof type are required');
    }

    logger.info(`Generating ZK proof for wallet: ${customerWallet}`);

    res.status(201).json({
      success: true,
      data: {
        proofId: `zk-${Date.now()}`,
        proof: 'mock-proof-data',
        celestiaBlobId: `celestia-${Date.now()}`,
        verified: true,
      },
    });
  });

  verifyProof = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { proofId, proof } = req.body;

    if (!proofId || !proof) {
      throw new ValidationError('Proof ID and proof data are required');
    }

    logger.info(`Verifying ZK proof: ${proofId}`);

    res.status(200).json({
      success: true,
      data: {
        proofId,
        valid: true,
        verifiedAt: new Date().toISOString(),
      },
    });
  });
}

export const zkController = new ZKController();
export default zkController;
