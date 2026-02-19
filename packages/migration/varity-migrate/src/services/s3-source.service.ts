import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { S3Options, ObjectMetadata } from '../types';

export class S3SourceService {
  private client: S3Client;
  private bucket: string;

  constructor(options: S3Options) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region,
      credentials: options.accessKeyId && options.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey
          }
        : undefined,
      endpoint: options.endpoint
    });
  }

  async listObjects(prefix?: string): Promise<ObjectMetadata[]> {
    const objects: ObjectMetadata[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });

      const response = await this.client.send(command);

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Size !== undefined) {
            objects.push({
              key: obj.Key,
              size: obj.Size,
              etag: obj.ETag || '',
              lastModified: obj.LastModified || new Date(),
              contentType: undefined,
              metadata: {}
            });
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  }

  async getObject(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`No data returned for object: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async getObjectMetadata(key: string): Promise<ObjectMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    const response = await this.client.send(command);

    return {
      key,
      size: response.ContentLength || 0,
      etag: response.ETag || '',
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
      metadata: response.Metadata || {}
    };
  }

  async getObjectHash(key: string): Promise<string> {
    const data = await this.getObject(key);
    return createHash('sha256').update(data).digest('hex');
  }

  async getTotalSize(prefix?: string): Promise<number> {
    const objects = await this.listObjects(prefix);
    return objects.reduce((total, obj) => total + obj.size, 0);
  }

  getBucketName(): string {
    return this.bucket;
  }
}
