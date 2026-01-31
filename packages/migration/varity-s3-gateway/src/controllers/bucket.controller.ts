import { Request, Response } from 'express';
import { buildXMLErrorResponse, buildListBucketsResponse } from '../utils/xml-builder';
import { generateRequestId } from '../utils/xml-builder';

/**
 * In-memory bucket store (replace with database in production)
 */
const buckets = new Map<string, { creationDate: Date; ownerId: string }>();

/**
 * Bucket Controller - Handle S3 bucket operations
 */
export class BucketController {
  /**
   * PUT /{bucket} - Create bucket
   */
  static async createBucket(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;

      // Validate bucket name
      if (!isValidBucketName(bucket)) {
        res.status(400).send(
          buildXMLErrorResponse(
            'InvalidBucketName',
            'The specified bucket is not valid',
            `/${bucket}`,
            generateRequestId()
          )
        );
        return;
      }

      // Check if bucket already exists
      if (buckets.has(bucket)) {
        res.status(409).send(
          buildXMLErrorResponse(
            'BucketAlreadyExists',
            'The requested bucket name is not available',
            `/${bucket}`,
            generateRequestId()
          )
        );
        return;
      }

      // Create bucket
      buckets.set(bucket, {
        creationDate: new Date(),
        ownerId: (req as any).awsAuth?.accessKeyId || 'unknown'
      });

      console.log(`Created bucket: ${bucket}`);

      res.status(200).send();
    } catch (error) {
      console.error('createBucket error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          'We encountered an internal error. Please try again.',
          req.path,
          generateRequestId()
        )
      );
    }
  }

  /**
   * DELETE /{bucket} - Delete bucket
   */
  static async deleteBucket(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;

      // Check if bucket exists
      if (!buckets.has(bucket)) {
        res.status(404).send(
          buildXMLErrorResponse(
            'NoSuchBucket',
            'The specified bucket does not exist',
            `/${bucket}`,
            generateRequestId()
          )
        );
        return;
      }

      // In production, check if bucket is empty before deleting

      // Delete bucket
      buckets.delete(bucket);

      console.log(`Deleted bucket: ${bucket}`);

      res.status(204).send();
    } catch (error) {
      console.error('deleteBucket error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          'We encountered an internal error. Please try again.',
          req.path,
          generateRequestId()
        )
      );
    }
  }

  /**
   * HEAD /{bucket} - Check if bucket exists
   */
  static async headBucket(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;

      if (!buckets.has(bucket)) {
        res.status(404).send();
        return;
      }

      res.status(200).send();
    } catch (error) {
      console.error('headBucket error:', error);
      res.status(500).send();
    }
  }

  /**
   * GET / - List all buckets
   */
  static async listBuckets(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = (req as any).awsAuth?.accessKeyId || 'unknown';
      const bucketList = Array.from(buckets.entries())
        .map(([name, info]) => ({
          name,
          creationDate: info.creationDate
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const xmlResponse = buildListBucketsResponse(
        bucketList,
        ownerId,
        ownerId // Use same as display name
      );

      res.set('Content-Type', 'application/xml');
      res.status(200).send(xmlResponse);
    } catch (error) {
      console.error('listBuckets error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          'We encountered an internal error. Please try again.',
          '/',
          generateRequestId()
        )
      );
    }
  }
}

/**
 * Validate bucket name according to S3 rules
 */
function isValidBucketName(name: string): boolean {
  // S3 bucket naming rules:
  // - 3-63 characters
  // - Lowercase letters, numbers, hyphens, periods
  // - Must start and end with letter or number
  // - Cannot be formatted as IP address
  const bucketNameRegex = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

  if (!bucketNameRegex.test(name)) {
    return false;
  }

  // Check if formatted as IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    return false;
  }

  // Cannot have consecutive periods
  if (name.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Get bucket info
 */
export function getBucketInfo(bucket: string): { creationDate: Date; ownerId: string } | undefined {
  return buckets.get(bucket);
}

/**
 * Check if bucket exists
 */
export function bucketExists(bucket: string): boolean {
  return buckets.has(bucket);
}
