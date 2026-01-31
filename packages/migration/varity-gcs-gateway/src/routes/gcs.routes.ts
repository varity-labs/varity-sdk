/**
 * GCS API Routes
 * Implements Google Cloud Storage JSON API v1
 */

import { Router } from 'express';
import { BucketController, ObjectController } from '../controllers';
import { oauth2Middleware } from '../auth';

export function createGCSRoutes(
  bucketController: BucketController,
  objectController: ObjectController,
  authMiddleware?: any
): Router {
  const router = Router();

  // Use auth middleware if provided, otherwise use OAuth2
  const auth = authMiddleware || oauth2Middleware;

  // ==================== BUCKET ROUTES ====================

  /**
   * List buckets
   * GET /storage/v1/b?project={project}
   */
  router.get('/storage/v1/b', auth, (req, res) =>
    bucketController.listBuckets(req, res)
  );

  /**
   * Get bucket
   * GET /storage/v1/b/{bucket}
   */
  router.get('/storage/v1/b/:bucket', auth, (req, res) =>
    bucketController.getBucket(req, res)
  );

  /**
   * Create bucket
   * POST /storage/v1/b?project={project}
   */
  router.post('/storage/v1/b', auth, (req, res) =>
    bucketController.createBucket(req, res)
  );

  /**
   * Delete bucket
   * DELETE /storage/v1/b/{bucket}
   */
  router.delete('/storage/v1/b/:bucket', auth, (req, res) =>
    bucketController.deleteBucket(req, res)
  );

  // ==================== OBJECT ROUTES ====================

  /**
   * List objects
   * GET /storage/v1/b/{bucket}/o
   */
  router.get('/storage/v1/b/:bucket/o', auth, (req, res) =>
    objectController.listObjects(req, res)
  );

  /**
   * Get object (metadata or download)
   * GET /storage/v1/b/{bucket}/o/{object}?alt=media (download)
   * GET /storage/v1/b/{bucket}/o/{object} (metadata)
   */
  router.get('/storage/v1/b/:bucket/o/:object(*)', auth, (req, res) => {
    if (req.query.alt === 'media') {
      objectController.downloadObject(req, res);
    } else {
      objectController.getObjectMetadata(req, res);
    }
  });

  /**
   * Delete object
   * DELETE /storage/v1/b/{bucket}/o/{object}
   */
  router.delete('/storage/v1/b/:bucket/o/:object(*)', auth, (req, res) =>
    objectController.deleteObject(req, res)
  );

  // ==================== UPLOAD ROUTES ====================

  /**
   * Simple upload
   * POST /upload/storage/v1/b/{bucket}/o?uploadType=media&name={name}
   */
  router.post('/upload/storage/v1/b/:bucket/o', auth, (req, res) => {
    const uploadType = req.query.uploadType;

    if (uploadType === 'resumable') {
      objectController.initiateResumableUpload(req, res);
    } else {
      objectController.uploadObject(req, res);
    }
  });

  /**
   * Resumable upload - continue/status
   * PUT /upload/storage/v1/b/resumable?upload_id={uploadId}
   */
  router.put('/upload/storage/v1/b/resumable', auth, (req, res) =>
    objectController.resumeUpload(req, res)
  );

  return router;
}
