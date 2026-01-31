/**
 * Object Controller - GCS Object API Implementation
 */

import { Request, Response } from 'express';
import { StorageService, ResumableUploadService } from '../services';
import { GCSError } from '../types';

export class ObjectController {
  constructor(
    private storageService: StorageService,
    private resumableUploadService: ResumableUploadService
  ) {}

  /**
   * List objects
   * GET /storage/v1/b/{bucket}/o
   */
  async listObjects(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;
      const { prefix, maxResults = 1000, pageToken } = req.query;

      const result = await this.storageService.listObjects(
        bucket,
        prefix as string,
        parseInt(maxResults as string),
        pageToken as string
      );

      res.json(result);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Get object metadata
   * GET /storage/v1/b/{bucket}/o/{object}
   */
  async getObjectMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, object } = req.params;
      const objectName = decodeURIComponent(object);

      const obj = await this.storageService.getObject(bucket, objectName);

      if (!obj) {
        res.status(404).json(this.createError(404, 'Object not found'));
        return;
      }

      // Return metadata only
      const gcsObject = this.storageService['toGCSObject'](obj);
      res.json(gcsObject);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Download object
   * GET /storage/v1/b/{bucket}/o/{object}?alt=media
   */
  async downloadObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, object } = req.params;
      const objectName = decodeURIComponent(object);

      const obj = await this.storageService.getObject(bucket, objectName);

      if (!obj) {
        res.status(404).json(this.createError(404, 'Object not found'));
        return;
      }

      // Set headers
      res.setHeader('Content-Type', obj.contentType || 'application/octet-stream');
      res.setHeader('Content-Length', obj.size);
      res.setHeader('Content-Disposition', `attachment; filename="${obj.name}"`);

      // Send data
      res.send(obj.data);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Upload object (simple upload)
   * POST /upload/storage/v1/b/{bucket}/o?uploadType=media
   */
  async uploadObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;
      const { name } = req.query;

      if (!name) {
        res.status(400).json(this.createError(400, 'Object name is required'));
        return;
      }

      const objectName = decodeURIComponent(name as string);
      const contentType = req.headers['content-type'] || 'application/octet-stream';

      // Read request body
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const data = Buffer.concat(chunks);

          const result = await this.storageService.uploadObject(
            bucket,
            objectName,
            data,
            contentType
          );

          res.status(201).json(result);
        } catch (error: any) {
          this.handleError(res, error);
        }
      });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Initiate resumable upload
   * POST /upload/storage/v1/b/{bucket}/o?uploadType=resumable
   */
  async initiateResumableUpload(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;
      const { name } = req.query;

      if (!name) {
        res.status(400).json(this.createError(400, 'Object name is required'));
        return;
      }

      const objectName = decodeURIComponent(name as string);
      const contentType = req.headers['content-type'];
      const contentLength = req.headers['x-upload-content-length'];

      const session = this.resumableUploadService.initiateUpload(
        bucket,
        objectName,
        contentType as string,
        req.body.metadata,
        contentLength ? parseInt(contentLength as string) : undefined
      );

      // Return upload URL in Location header
      const uploadUrl = `${req.protocol}://${req.get('host')}${session.uploadUrl}`;
      res.setHeader('Location', uploadUrl);
      res.status(200).send();
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Resume upload chunk
   * PUT /upload/storage/v1/b/resumable?upload_id={uploadId}
   */
  async resumeUpload(req: Request, res: Response): Promise<void> {
    try {
      const { upload_id } = req.query;

      if (!upload_id) {
        res.status(400).json(this.createError(400, 'upload_id is required'));
        return;
      }

      const uploadId = upload_id as string;
      const contentRange = req.headers['content-range'];

      if (!contentRange) {
        // Status check request
        const status = this.resumableUploadService.getUploadStatus(uploadId);

        if (!status) {
          res.status(404).json(this.createError(404, 'Upload session not found'));
          return;
        }

        res.setHeader('Range', `bytes=0-${status.bytesReceived - 1}`);
        res.status(308).send();
        return;
      }

      // Upload chunk
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const data = Buffer.concat(chunks);

          const result = this.resumableUploadService.uploadChunk(
            uploadId,
            data,
            contentRange as string
          );

          if (result.complete) {
            // Upload complete, finalize object
            const metadata = this.resumableUploadService.getSessionMetadata(uploadId);
            const fullData = this.resumableUploadService.getCompletedUpload(uploadId);

            if (!metadata || !fullData) {
              throw new Error('Failed to retrieve upload data');
            }

            const gcsObject = await this.storageService.uploadObject(
              metadata.bucket,
              metadata.objectName,
              fullData,
              metadata.contentType || 'application/octet-stream',
              metadata.metadata
            );

            // Clean up session
            this.resumableUploadService.cancelUpload(uploadId);

            res.status(201).json(gcsObject);
          } else {
            // More chunks expected
            res.setHeader('Range', `bytes=0-${result.bytesReceived - 1}`);
            res.status(308).send();
          }
        } catch (error: any) {
          this.handleError(res, error);
        }
      });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Delete object
   * DELETE /storage/v1/b/{bucket}/o/{object}
   */
  async deleteObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, object } = req.params;
      const objectName = decodeURIComponent(object);

      const result = await this.storageService.deleteObject(bucket, objectName);

      if (!result) {
        res.status(404).json(this.createError(404, 'Object not found'));
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      this.handleError(res, error);
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
    console.error('Object operation error:', error);

    res.status(500).json(this.createError(
      500,
      error.message || 'Internal server error'
    ));
  }
}
