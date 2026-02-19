import { Storage, Bucket, File } from '@google-cloud/storage';
import { createHash } from 'crypto';
import { GCSOptions, ObjectMetadata } from '../types';

export class GCSSourceService {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(options: GCSOptions) {
    this.bucketName = options.bucket;
    this.storage = new Storage({
      projectId: options.project,
      keyFilename: options.keyFilename
    });
    this.bucket = this.storage.bucket(options.bucket);
  }

  async listObjects(prefix?: string): Promise<ObjectMetadata[]> {
    const [files] = await this.bucket.getFiles({
      prefix
    });

    const objects: ObjectMetadata[] = [];

    for (const file of files) {
      const [metadata] = await file.getMetadata();

      objects.push({
        key: file.name,
        size: parseInt(String(metadata.size || '0'), 10),
        etag: metadata.etag || '',
        lastModified: new Date(String(metadata.updated || metadata.timeCreated || Date.now())),
        contentType: metadata.contentType,
        metadata: (metadata.metadata || {}) as Record<string, string>
      });
    }

    return objects;
  }

  async getObject(key: string): Promise<Buffer> {
    const file = this.bucket.file(key);
    const [data] = await file.download();
    return data;
  }

  async getObjectMetadata(key: string): Promise<ObjectMetadata> {
    const file = this.bucket.file(key);
    const [metadata] = await file.getMetadata();

    return {
      key,
      size: parseInt(String(metadata.size || '0'), 10),
      etag: metadata.etag || '',
      lastModified: new Date(String(metadata.updated || metadata.timeCreated || Date.now())),
      contentType: metadata.contentType,
      metadata: (metadata.metadata || {}) as Record<string, string>
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
    return this.bucketName;
  }
}
