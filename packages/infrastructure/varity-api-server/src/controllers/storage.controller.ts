import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { storageAdapterService } from '../services/storage-adapter.service';
import { logger } from '../config/logger.config';
import { StorageLayer, StorageTier } from '@varity-labs/types';

/**
 * Storage Controller
 * Handles storage operations with 3-layer architecture using new adapter system
 */
export class StorageController {
  /**
   * Upload data to storage
   * POST /api/v1/storage/upload
   */
  upload = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data, layer, namespace, encryption, tier, metadata } = req.body;
    const customerWallet = req.user?.address;

    if (!data || !layer) {
      throw new ValidationError('Data and layer are required');
    }

    // Validate storage layer
    const validLayers = Object.values(StorageLayer);
    if (!validLayers.includes(layer)) {
      throw new ValidationError(`Invalid storage layer. Must be one of: ${validLayers.join(', ')}`);
    }

    // For customer-data layer, require authentication
    if (layer === StorageLayer.CUSTOMER_DATA && !customerWallet) {
      throw new ValidationError('Authentication required for customer data storage');
    }

    logger.info(`Uploading data to ${layer} layer (tier: ${tier || 'hot'})`);

    const result = await storageAdapterService.upload(data, {
      layer,
      tier: tier || StorageTier.HOT,
      namespace: namespace || `${layer}-${customerWallet || 'anonymous'}`,
      encrypt: encryption !== false, // Default to true
      metadata: {
        customerWallet,
        uploadedBy: customerWallet || 'anonymous',
        ...metadata
      }
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Download data from storage
   * GET /api/v1/storage/download/:cid
   */
  download = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cid } = req.params;
    const customerWallet = req.user?.address;

    if (!cid) {
      throw new ValidationError('CID is required');
    }

    logger.info(`Downloading data with CID: ${cid}`);

    const data = await storageAdapterService.download(cid);

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * Check if object exists in storage
   * GET /api/v1/storage/exists/:cid
   */
  exists = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cid } = req.params;

    if (!cid) {
      throw new ValidationError('CID is required');
    }

    logger.info(`Checking existence of CID: ${cid}`);

    const exists = await storageAdapterService.exists(cid);

    res.status(200).json({
      success: true,
      data: {
        cid,
        exists,
      },
    });
  });

  /**
   * Get object metadata
   * GET /api/v1/storage/metadata/:cid
   */
  metadata = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cid } = req.params;

    if (!cid) {
      throw new ValidationError('CID is required');
    }

    logger.info(`Getting metadata for CID: ${cid}`);

    const metadata = await storageAdapterService.getMetadata(cid);

    res.status(200).json({
      success: true,
      data: metadata,
    });
  });

  /**
   * List stored files
   * GET /api/v1/storage/list
   */
  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { layer, prefix, limit = 100, continuationToken } = req.query;
    const customerWallet = req.user?.address;

    logger.info(`Listing storage files for layer: ${layer}, prefix: ${prefix}`);

    const items = await storageAdapterService.list({
      layer: layer as StorageLayer,
      prefix: prefix as string,
      limit: Number(limit),
      continuationToken: continuationToken as string,
    });

    res.status(200).json({
      success: true,
      data: {
        items,
        count: items.length,
      },
    });
  });

  /**
   * Get storage statistics
   * GET /api/v1/storage/stats
   */
  stats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { layer } = req.query;
    const customerWallet = req.user?.address;

    logger.info(`Getting storage statistics for wallet: ${customerWallet}, layer: ${layer}`);

    const stats = await storageAdapterService.getStats(layer as StorageLayer);

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  /**
   * Delete data from storage
   * DELETE /api/v1/storage/:cid
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cid } = req.params;
    const customerWallet = req.user?.address;

    if (!cid) {
      throw new ValidationError('CID is required');
    }

    logger.info(`Deleting data with CID: ${cid}`);

    await storageAdapterService.delete(cid);

    res.status(200).json({
      success: true,
      message: 'Data deleted successfully',
      data: {
        cid,
        deleted: true,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * Health check for storage backend
   * GET /api/v1/storage/health
   */
  health = asyncHandler(async (req: AuthRequest, res: Response) => {
    logger.info('Checking storage backend health');

    const health = await storageAdapterService.healthCheck();

    res.status(200).json({
      success: true,
      data: health,
    });
  });
}

export const storageController = new StorageController();
export default storageController;
