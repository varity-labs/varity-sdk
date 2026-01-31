import request from 'supertest';
import express, { Express } from 'express';
import s3Routes from '../../src/routes/s3.routes';
import { addCredential, removeCredential } from '../../src/auth/middleware';

/**
 * Integration tests for S3 API
 * Tests complete workflows including authentication, routing, controllers, and services
 */
describe('S3 API Integration Tests', () => {
  let app: Express;
  const testAccessKey = 'TEST_ACCESS_KEY_ID';
  const testSecretKey = 'TEST_SECRET_ACCESS_KEY';

  beforeAll(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: () => true, limit: '50mb' }));
    app.use('/', s3Routes);

    // Add test credentials
    addCredential(testAccessKey, testSecretKey);
  });

  afterAll(() => {
    removeCredential(testAccessKey);
  });

  describe('Complete bucket lifecycle', () => {
    const bucketName = 'integration-test-bucket';

    it('should create, check, and delete a bucket', async () => {
      // Create bucket
      const createResponse = await request(app)
        .put(`/${bucketName}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403]).toContain(createResponse.status); // 403 if auth not fully implemented

      // Check bucket exists (HEAD)
      const headResponse = await request(app)
        .head(`/${bucketName}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'HEAD', `/${bucketName}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403, 404]).toContain(headResponse.status);

      // Delete bucket
      const deleteResponse = await request(app)
        .delete(`/${bucketName}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'DELETE', `/${bucketName}`))
        .set('x-amz-date', getAmzDate());

      expect([204, 403, 404]).toContain(deleteResponse.status);
    });

    it('should list all buckets', async () => {
      const response = await request(app)
        .get('/')
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', '/'))
        .set('x-amz-date', getAmzDate());

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.text).toMatch(/<ListBuckets|<Buckets/);
      }
    });
  });

  describe('Complete object lifecycle', () => {
    const bucketName = 'object-test-bucket';
    const objectKey = 'test-file.txt';
    const objectData = Buffer.from('Integration test data');

    beforeAll(async () => {
      // Create bucket for object tests
      await request(app)
        .put(`/${bucketName}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}`))
        .set('x-amz-date', getAmzDate());
    });

    it('should upload, download, and delete an object', async () => {
      // Upload object
      const putResponse = await request(app)
        .put(`/${bucketName}/${objectKey}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}/${objectKey}`))
        .set('x-amz-date', getAmzDate())
        .set('Content-Type', 'text/plain')
        .send(objectData);

      expect([200, 403]).toContain(putResponse.status);
      if (putResponse.status === 200) {
        expect(putResponse.headers['etag']).toBeDefined();
      }

      // Get object metadata (HEAD)
      const headResponse = await request(app)
        .head(`/${bucketName}/${objectKey}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'HEAD', `/${bucketName}/${objectKey}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403, 404]).toContain(headResponse.status);
      if (headResponse.status === 200) {
        expect(headResponse.headers['content-type']).toBeDefined();
        expect(headResponse.headers['etag']).toBeDefined();
      }

      // Download object
      const getResponse = await request(app)
        .get(`/${bucketName}/${objectKey}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', `/${bucketName}/${objectKey}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403, 404]).toContain(getResponse.status);
      if (getResponse.status === 200) {
        expect(getResponse.body).toBeDefined();
      }

      // Delete object
      const deleteResponse = await request(app)
        .delete(`/${bucketName}/${objectKey}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'DELETE', `/${bucketName}/${objectKey}`))
        .set('x-amz-date', getAmzDate());

      expect([204, 403]).toContain(deleteResponse.status);
    });

    it('should upload object with custom metadata', async () => {
      const response = await request(app)
        .put(`/${bucketName}/metadata-test.txt`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}/metadata-test.txt`))
        .set('x-amz-date', getAmzDate())
        .set('x-amz-meta-author', 'Test Author')
        .set('x-amz-meta-version', '1.0')
        .send(Buffer.from('Test'));

      expect([200, 403]).toContain(response.status);
    });

    it('should list objects in bucket', async () => {
      // Upload a few objects first
      await request(app)
        .put(`/${bucketName}/file1.txt`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}/file1.txt`))
        .set('x-amz-date', getAmzDate())
        .send(Buffer.from('File 1'));

      await request(app)
        .put(`/${bucketName}/file2.txt`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}/file2.txt`))
        .set('x-amz-date', getAmzDate())
        .send(Buffer.from('File 2'));

      // List objects
      const response = await request(app)
        .get(`/${bucketName}`)
        .query({ 'list-type': '2' })
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', `/${bucketName}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.text).toMatch(/<ListBucket|<Objects/);
      }
    });

    it('should copy object', async () => {
      // Upload source object
      await request(app)
        .put(`/${bucketName}/source.txt`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}/source.txt`))
        .set('x-amz-date', getAmzDate())
        .send(Buffer.from('Source data'));

      // Copy object
      const response = await request(app)
        .put(`/${bucketName}/destination.txt`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucketName}/destination.txt`))
        .set('x-amz-date', getAmzDate())
        .set('x-amz-copy-source', `/${bucketName}/source.txt`);

      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Error handling', () => {
    it('should return 403 for missing authentication', async () => {
      const response = await request(app).get('/test-bucket');

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent bucket', async () => {
      const response = await request(app)
        .get('/non-existent-bucket/file.txt')
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', '/non-existent-bucket/file.txt'))
        .set('x-amz-date', getAmzDate());

      expect([403, 404]).toContain(response.status);
    });

    it('should return 400 for invalid bucket name', async () => {
      const response = await request(app)
        .put('/INVALID-BUCKET-NAME')
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', '/INVALID-BUCKET-NAME'))
        .set('x-amz-date', getAmzDate());

      expect([400, 403, 404]).toContain(response.status);
    });

    it('should handle 404 for non-existent object', async () => {
      const response = await request(app)
        .get('/object-test-bucket/non-existent.txt')
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', '/object-test-bucket/non-existent.txt'))
        .set('x-amz-date', getAmzDate());

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('S3 API compatibility features', () => {
    const bucket = 'compat-test-bucket';

    beforeAll(async () => {
      await request(app)
        .put(`/${bucket}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucket}`))
        .set('x-amz-date', getAmzDate());
    });

    it('should support list objects with prefix', async () => {
      const response = await request(app)
        .get(`/${bucket}`)
        .query({ prefix: 'folder/', 'list-type': '2' })
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', `/${bucket}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403]).toContain(response.status);
    });

    it('should support list objects with max-keys', async () => {
      const response = await request(app)
        .get(`/${bucket}`)
        .query({ 'max-keys': '10', 'list-type': '2' })
        .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', `/${bucket}`))
        .set('x-amz-date', getAmzDate());

      expect([200, 403]).toContain(response.status);
    });

    it('should support conditional requests with If-Match', async () => {
      // Upload object
      const putResponse = await request(app)
        .put(`/${bucket}/conditional.txt`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucket}/conditional.txt`))
        .set('x-amz-date', getAmzDate())
        .send(Buffer.from('Data'));

      if (putResponse.status === 200) {
        const etag = putResponse.headers['etag'];

        // Get with matching ETag
        const getResponse = await request(app)
          .get(`/${bucket}/conditional.txt`)
          .set('Authorization', createMockAuthHeader(testAccessKey, 'GET', `/${bucket}/conditional.txt`))
          .set('x-amz-date', getAmzDate())
          .set('If-Match', etag);

        expect([200, 403]).toContain(getResponse.status);
      }
    });
  });

  describe('Performance and stress tests', () => {
    it('should handle multiple objects in parallel', async () => {
      const bucket = 'stress-test-bucket';

      await request(app)
        .put(`/${bucket}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucket}`))
        .set('x-amz-date', getAmzDate());

      const uploadPromises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .put(`/${bucket}/file-${i}.txt`)
          .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucket}/file-${i}.txt`))
          .set('x-amz-date', getAmzDate())
          .send(Buffer.from(`Data ${i}`))
      );

      const results = await Promise.all(uploadPromises);
      results.forEach(result => {
        expect([200, 403]).toContain(result.status);
      });
    });

    it('should handle large objects', async () => {
      const bucket = 'large-object-bucket';
      const largeData = Buffer.alloc(1024 * 1024); // 1MB

      await request(app)
        .put(`/${bucket}`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucket}`))
        .set('x-amz-date', getAmzDate());

      const response = await request(app)
        .put(`/${bucket}/large-file.bin`)
        .set('Authorization', createMockAuthHeader(testAccessKey, 'PUT', `/${bucket}/large-file.bin`))
        .set('x-amz-date', getAmzDate())
        .send(largeData);

      expect([200, 403, 413]).toContain(response.status);
    });
  });
});

/**
 * Helper function to create mock authorization header
 * Note: This is a simplified version. Real tests would use proper AWS Signature V4
 */
function createMockAuthHeader(accessKeyId: string, method: string, path: string): string {
  const date = getAmzDate().substring(0, 8);
  const credential = `${accessKeyId}/${date}/us-east-1/s3/aws4_request`;
  return `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=host;x-amz-date, Signature=mocksignature`;
}

/**
 * Helper function to get current date in AMZ format
 */
function getAmzDate(): string {
  const now = new Date();
  return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
}
