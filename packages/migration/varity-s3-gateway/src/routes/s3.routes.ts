import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { ObjectController } from '../controllers/object.controller';
import { BucketController } from '../controllers/bucket.controller';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware';
import { hybridAuthMiddleware, checkBucketPermission } from '../auth/walletAuth';
import { S3Permission } from '../auth/acl';

const router: ExpressRouter = Router();

/**
 * S3-Compatible API Routes
 * Implements AWS S3 REST API endpoints with hybrid authentication (IAM + Wallet)
 * https://docs.aws.amazon.com/AmazonS3/latest/API/API_Operations.html
 */

// Create hybrid auth middleware combining IAM and wallet auth
const hybridAuth = hybridAuthMiddleware(authMiddleware);

// ===== SERVICE OPERATIONS =====

/**
 * GET / - List all buckets
 */
router.get('/', hybridAuth, BucketController.listBuckets);

// ===== BUCKET OPERATIONS =====

/**
 * PUT /{bucket} - Create bucket
 */
router.put('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])', hybridAuth, BucketController.createBucket);

/**
 * HEAD /{bucket} - Check if bucket exists
 */
router.head('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])', hybridAuth, checkBucketPermission(S3Permission.READ), BucketController.headBucket);

/**
 * DELETE /{bucket} - Delete bucket
 */
router.delete('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])', hybridAuth, checkBucketPermission(S3Permission.DELETE), BucketController.deleteBucket);

/**
 * GET /{bucket} - List objects in bucket
 * Query params: list-type=2, prefix, max-keys, continuation-token
 */
router.get('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])', hybridAuth, checkBucketPermission(S3Permission.READ), (req, res, next) => {
  // Check if this is a list objects request
  if (req.query['list-type'] === '2' || req.query.prefix !== undefined) {
    return ObjectController.listObjects(req, res);
  }
  // Otherwise, treat as list objects v1 (also handled by listObjects)
  return ObjectController.listObjects(req, res);
});

// ===== OBJECT OPERATIONS =====

/**
 * PUT /{bucket}/{key} - Upload object or copy object
 */
router.put('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])/:key(*)', hybridAuth, checkBucketPermission(S3Permission.WRITE), (req, res) => {
  // Check if this is a copy operation
  if (req.headers['x-amz-copy-source']) {
    return ObjectController.copyObject(req, res);
  }
  // Otherwise, it's a regular upload
  return ObjectController.putObject(req, res);
});

/**
 * GET /{bucket}/{key} - Download object
 */
router.get('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])/:key(*)', hybridAuth, checkBucketPermission(S3Permission.READ), ObjectController.getObject);

/**
 * HEAD /{bucket}/{key} - Get object metadata
 */
router.head('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])/:key(*)', hybridAuth, checkBucketPermission(S3Permission.READ), ObjectController.headObject);

/**
 * DELETE /{bucket}/{key} - Delete object
 */
router.delete('/:bucket([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])/:key(*)', hybridAuth, checkBucketPermission(S3Permission.DELETE), ObjectController.deleteObject);

export default router;
