import { Request, Response } from 'express';
import { StorageService } from '../services/storage.service';
import { generateETag, checkETagConditions } from '../utils/etag';
import {
  buildXMLErrorResponse,
  buildListObjectsV2Response,
  generateRequestId
} from '../utils/xml-builder';
import { bucketExists } from './bucket.controller';

const storageService = new StorageService();

/**
 * Object Controller - Handle S3 object operations
 */
export class ObjectController {
  /**
   * PUT /{bucket}/{key} - Upload object
   */
  static async putObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, key } = req.params;

      // Check if bucket exists
      if (!bucketExists(bucket)) {
        res.status(404).send(
          buildXMLErrorResponse(
            'NoSuchBucket',
            'The specified bucket does not exist',
            `/${bucket}/${key}`,
            generateRequestId()
          )
        );
        return;
      }

      // Get request body as Buffer
      const data = req.body as Buffer;

      // Extract metadata from headers
      const metadata = {
        contentType: req.headers['content-type'] || 'application/octet-stream',
        customMetadata: extractCustomMetadata(req.headers)
      };

      // Upload to storage
      const result = await storageService.putObject(bucket, key, data, metadata);

      // Set response headers
      res.set('ETag', `"${result.hash}"`);
      res.set('x-amz-request-id', generateRequestId());
      res.set('x-amz-version-id', result.cid);

      console.log(`PUT object: ${bucket}/${key} (${data.length} bytes)`);

      res.status(200).send();
    } catch (error) {
      console.error('putObject error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          error instanceof Error ? error.message : 'We encountered an internal error',
          req.path,
          generateRequestId()
        )
      );
    }
  }

  /**
   * GET /{bucket}/{key} - Download object
   */
  static async getObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, key } = req.params;

      // Check if bucket exists
      if (!bucketExists(bucket)) {
        res.status(404).send(
          buildXMLErrorResponse(
            'NoSuchBucket',
            'The specified bucket does not exist',
            `/${bucket}/${key}`,
            generateRequestId()
          )
        );
        return;
      }

      // Get object metadata first
      let metadata;
      try {
        metadata = await storageService.getObjectMetadata(bucket, key);
      } catch (error) {
        if (error instanceof Error && error.message === 'NoSuchKey') {
          res.status(404).send(
            buildXMLErrorResponse(
              'NoSuchKey',
              'The specified key does not exist',
              `/${bucket}/${key}`,
              generateRequestId()
            )
          );
          return;
        }
        throw error;
      }

      // Check ETag conditions (If-Match, If-None-Match)
      const etagCheck = checkETagConditions(
        metadata.etag || '""',
        req.headers['if-match'] as string,
        req.headers['if-none-match'] as string
      );

      if (!etagCheck.match) {
        res.status(etagCheck.statusCode).send();
        return;
      }

      // Retrieve object data
      const data = await storageService.getObject(bucket, key);

      // Set response headers
      res.set('Content-Type', metadata.contentType || 'application/octet-stream');
      res.set('Content-Length', data.length.toString());
      res.set('ETag', metadata.etag || '""');
      res.set('Last-Modified', (metadata.lastModified || new Date()).toUTCString());
      res.set('x-amz-request-id', generateRequestId());

      // Set custom metadata headers
      if (metadata.customMetadata) {
        for (const [key, value] of Object.entries(metadata.customMetadata)) {
          res.set(`x-amz-meta-${key}`, value);
        }
      }

      console.log(`GET object: ${bucket}/${key} (${data.length} bytes)`);

      res.status(200).send(data);
    } catch (error) {
      console.error('getObject error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          error instanceof Error ? error.message : 'We encountered an internal error',
          req.path,
          generateRequestId()
        )
      );
    }
  }

  /**
   * DELETE /{bucket}/{key} - Delete object
   */
  static async deleteObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, key } = req.params;

      // Check if bucket exists
      if (!bucketExists(bucket)) {
        res.status(404).send(
          buildXMLErrorResponse(
            'NoSuchBucket',
            'The specified bucket does not exist',
            `/${bucket}/${key}`,
            generateRequestId()
          )
        );
        return;
      }

      // Delete object
      await storageService.deleteObject(bucket, key);

      res.set('x-amz-request-id', generateRequestId());

      console.log(`DELETE object: ${bucket}/${key}`);

      res.status(204).send();
    } catch (error) {
      console.error('deleteObject error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          error instanceof Error ? error.message : 'We encountered an internal error',
          req.path,
          generateRequestId()
        )
      );
    }
  }

  /**
   * HEAD /{bucket}/{key} - Get object metadata
   */
  static async headObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket, key } = req.params;

      // Check if bucket exists
      if (!bucketExists(bucket)) {
        res.status(404).send();
        return;
      }

      // Get object metadata
      let metadata;
      try {
        metadata = await storageService.getObjectMetadata(bucket, key);
      } catch (error) {
        if (error instanceof Error && error.message === 'NoSuchKey') {
          res.status(404).send();
          return;
        }
        throw error;
      }

      // Set response headers
      res.set('Content-Type', metadata.contentType || 'application/octet-stream');
      res.set('Content-Length', (metadata.contentLength || 0).toString());
      res.set('ETag', metadata.etag || '""');
      res.set('Last-Modified', (metadata.lastModified || new Date()).toUTCString());
      res.set('x-amz-request-id', generateRequestId());

      // Set custom metadata headers
      if (metadata.customMetadata) {
        for (const [key, value] of Object.entries(metadata.customMetadata)) {
          res.set(`x-amz-meta-${key}`, value);
        }
      }

      console.log(`HEAD object: ${bucket}/${key}`);

      res.status(200).send();
    } catch (error) {
      console.error('headObject error:', error);
      res.status(500).send();
    }
  }

  /**
   * GET /{bucket}?list-type=2 - List objects (V2)
   */
  static async listObjects(req: Request, res: Response): Promise<void> {
    try {
      const { bucket } = req.params;

      // Check if bucket exists
      if (!bucketExists(bucket)) {
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

      // Parse query parameters
      const prefix = req.query.prefix as string | undefined;
      const maxKeys = parseInt(req.query['max-keys'] as string || '1000', 10);
      const continuationToken = req.query['continuation-token'] as string | undefined;

      // List objects
      const result = await storageService.listObjects(bucket, prefix, maxKeys, continuationToken);

      // Build XML response
      const xmlResponse = buildListObjectsV2Response(
        bucket,
        result.objects,
        prefix,
        maxKeys,
        continuationToken,
        result.nextContinuationToken
      );

      res.set('Content-Type', 'application/xml');
      res.set('x-amz-request-id', generateRequestId());

      console.log(`LIST objects: ${bucket} (${result.objects.length} objects)`);

      res.status(200).send(xmlResponse);
    } catch (error) {
      console.error('listObjects error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          error instanceof Error ? error.message : 'We encountered an internal error',
          req.path,
          generateRequestId()
        )
      );
    }
  }

  /**
   * PUT /{bucket}/{key}?x-amz-copy-source - Copy object
   */
  static async copyObject(req: Request, res: Response): Promise<void> {
    try {
      const { bucket: destBucket, key: destKey } = req.params;
      const copySource = req.headers['x-amz-copy-source'] as string;

      if (!copySource) {
        res.status(400).send(
          buildXMLErrorResponse(
            'InvalidArgument',
            'Copy Source not specified',
            req.path,
            generateRequestId()
          )
        );
        return;
      }

      // Parse source bucket and key
      const [sourceBucket, ...sourceKeyParts] = copySource.replace(/^\//, '').split('/');
      const sourceKey = sourceKeyParts.join('/');

      // Check if source and dest buckets exist
      if (!bucketExists(sourceBucket)) {
        res.status(404).send(
          buildXMLErrorResponse(
            'NoSuchBucket',
            'The specified source bucket does not exist',
            `/${sourceBucket}`,
            generateRequestId()
          )
        );
        return;
      }

      if (!bucketExists(destBucket)) {
        res.status(404).send(
          buildXMLErrorResponse(
            'NoSuchBucket',
            'The specified destination bucket does not exist',
            `/${destBucket}`,
            generateRequestId()
          )
        );
        return;
      }

      // Copy object
      const result = await storageService.copyObject(
        sourceBucket,
        sourceKey,
        destBucket,
        destKey
      );

      res.set('x-amz-request-id', generateRequestId());
      res.set('x-amz-copy-source-version-id', result.cid);

      console.log(`COPY object: ${sourceBucket}/${sourceKey} -> ${destBucket}/${destKey}`);

      res.status(200).send();
    } catch (error) {
      console.error('copyObject error:', error);
      res.status(500).send(
        buildXMLErrorResponse(
          'InternalError',
          error instanceof Error ? error.message : 'We encountered an internal error',
          req.path,
          generateRequestId()
        )
      );
    }
  }
}

/**
 * Extract custom metadata from request headers
 */
function extractCustomMetadata(headers: Record<string, any>): Record<string, string> {
  const metadata: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase().startsWith('x-amz-meta-')) {
      const metaKey = key.substring('x-amz-meta-'.length);
      metadata[metaKey] = String(value);
    }
  }

  return metadata;
}
