/**
 * Bucket Controller - GCS Bucket API Implementation
 */

import { Request, Response } from 'express';
import { StorageService } from '../services';
import { GCSError } from '../types';

export class BucketController {
  constructor(private storageService: StorageService) {}

  /**
   * List buckets
   * GET /storage/v1/b?project={project}
   */
  async listBuckets(req: Request, res: Response): Promise<void> {
    try {
      const { project, maxResults = 1000 } = req.query;

      const result = await this.storageService.listBuckets(
        project as string,
        parseInt(maxResults as string)
      );

      res.json(result);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Get bucket
   * GET /storage/v1/b/{bucket}
   */
  async getBucket(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;

      const result = await this.storageService.getBucket(bucket);

      if (!result) {
        res.status(404).json(this.createError(404, 'Bucket not found'));
        return;
      }

      res.json(result);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Create bucket
   * POST /storage/v1/b?project={project}
   */
  async createBucket(req: Request, res: Response): Promise<void> {
    try {
      const { project } = req.query;
      const { name, location, storageClass } = req.body;

      if (!name) {
        res.status(400).json(
          this.createError(400, 'Bucket name is required')
        );
        return;
      }

      const result = await this.storageService.createBucket(
        name,
        location || 'FILECOIN',
        storageClass || 'STANDARD'
      );

      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json(this.createError(409, error.message));
      } else {
        this.handleError(res, error);
      }
    }
  }

  /**
   * Delete bucket
   * DELETE /storage/v1/b/{bucket}
   */
  async deleteBucket(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;

      const result = await this.storageService.deleteBucket(bucket);

      if (!result) {
        res.status(404).json(this.createError(404, 'Bucket not found'));
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('not empty')) {
        res.status(409).json(this.createError(409, error.message));
      } else {
        this.handleError(res, error);
      }
    }
  }

  /**
   * Create GCS error response
   */
  private createError(code: number, message: string): GCSError {
    return {
      error: {
        code,
        message,
        errors: [{
          domain: 'global',
          reason: code === 404 ? 'notFound' : 'invalid',
          message
        }]
      }
    };
  }

  /**
   * Handle errors
   */
  private handleError(res: Response, error: any): void {
    console.error('Bucket operation error:', error);

    res.status(500).json(this.createError(
      500,
      error.message || 'Internal server error'
    ));
  }
}
