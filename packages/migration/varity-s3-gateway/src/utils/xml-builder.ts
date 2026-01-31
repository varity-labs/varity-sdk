import { Builder } from 'xml2js';

const xmlBuilder = new Builder({
  rootName: 'Error',
  headless: true,
  renderOpts: { pretty: true, indent: '  ' }
});

/**
 * Build S3 XML error response
 */
export function buildXMLErrorResponse(
  code: string,
  message: string,
  resource?: string,
  requestId?: string
): string {
  const error = {
    Code: code,
    Message: message,
    Resource: resource || '',
    RequestId: requestId || generateRequestId()
  };

  return xmlBuilder.buildObject(error);
}

/**
 * Build ListBuckets XML response
 */
export function buildListBucketsResponse(
  buckets: Array<{ name: string; creationDate: Date }>,
  ownerId: string,
  ownerDisplayName: string
): string {
  const response = {
    ListAllMyBucketsResult: {
      $: { xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/' },
      Owner: {
        ID: ownerId,
        DisplayName: ownerDisplayName
      },
      Buckets: {
        Bucket: buckets.map(bucket => ({
          Name: bucket.name,
          CreationDate: bucket.creationDate.toISOString()
        }))
      }
    }
  };

  const builder = new Builder({ headless: false });
  return builder.buildObject(response);
}

/**
 * Build ListObjectsV2 XML response
 */
export function buildListObjectsV2Response(
  bucketName: string,
  objects: Array<{
    key: string;
    size: number;
    etag: string;
    lastModified: Date;
    storageClass?: string;
  }>,
  prefix?: string,
  maxKeys?: number,
  continuationToken?: string,
  nextContinuationToken?: string
): string {
  const isTruncated = !!nextContinuationToken;

  const response = {
    ListBucketResult: {
      $: { xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/' },
      Name: bucketName,
      Prefix: prefix || '',
      MaxKeys: maxKeys || 1000,
      KeyCount: objects.length,
      IsTruncated: isTruncated,
      ...(continuationToken && { ContinuationToken: continuationToken }),
      ...(nextContinuationToken && { NextContinuationToken: nextContinuationToken }),
      Contents: objects.map(obj => ({
        Key: obj.key,
        LastModified: obj.lastModified.toISOString(),
        ETag: obj.etag,
        Size: obj.size,
        StorageClass: obj.storageClass || 'STANDARD'
      }))
    }
  };

  const builder = new Builder({ headless: false });
  return builder.buildObject(response);
}

/**
 * Build CompleteMultipartUpload XML response
 */
export function buildCompleteMultipartUploadResponse(
  bucket: string,
  key: string,
  etag: string,
  location: string
): string {
  const response = {
    CompleteMultipartUploadResult: {
      $: { xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/' },
      Location: location,
      Bucket: bucket,
      Key: key,
      ETag: etag
    }
  };

  const builder = new Builder({ headless: false });
  return builder.buildObject(response);
}

/**
 * Build InitiateMultipartUpload XML response
 */
export function buildInitiateMultipartUploadResponse(
  bucket: string,
  key: string,
  uploadId: string
): string {
  const response = {
    InitiateMultipartUploadResult: {
      $: { xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/' },
      Bucket: bucket,
      Key: key,
      UploadId: uploadId
    }
  };

  const builder = new Builder({ headless: false });
  return builder.buildObject(response);
}

/**
 * Build CopyObject XML response
 */
export function buildCopyObjectResponse(etag: string, lastModified: Date): string {
  const response = {
    CopyObjectResult: {
      ETag: etag,
      LastModified: lastModified.toISOString()
    }
  };

  const builder = new Builder({ headless: false });
  return builder.buildObject(response);
}

/**
 * Build DeleteObjects XML response
 */
export function buildDeleteObjectsResponse(
  deleted: Array<{ key: string; versionId?: string }>,
  errors: Array<{ key: string; code: string; message: string }>
): string {
  const response = {
    DeleteResult: {
      $: { xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/' },
      ...(deleted.length > 0 && {
        Deleted: deleted.map(obj => ({
          Key: obj.key,
          ...(obj.versionId && { VersionId: obj.versionId })
        }))
      }),
      ...(errors.length > 0 && {
        Error: errors.map(err => ({
          Key: err.key,
          Code: err.code,
          Message: err.message
        }))
      })
    }
  };

  const builder = new Builder({ headless: false });
  return builder.buildObject(response);
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse S3 XML request body
 */
export async function parseXMLBody(xml: string): Promise<any> {
  const { parseStringPromise } = await import('xml2js');
  return parseStringPromise(xml);
}
