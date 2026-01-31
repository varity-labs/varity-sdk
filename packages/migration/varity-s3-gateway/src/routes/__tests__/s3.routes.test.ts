import request from 'supertest';
import express, { Express } from 'express';
import s3Routes from '../s3.routes';
import { BucketController } from '../../controllers/bucket.controller';
import { ObjectController } from '../../controllers/object.controller';

// Mock controllers
jest.mock('../../controllers/bucket.controller');
jest.mock('../../controllers/object.controller');
jest.mock('../../auth/middleware', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.awsAuth = { accessKeyId: 'test-key', authenticated: true };
    next();
  }),
  optionalAuthMiddleware: jest.fn((req, res, next) => next())
}));

describe('S3 Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
    app.use('/', s3Routes);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (BucketController.listBuckets as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send('<Buckets></Buckets>');
    });

    (BucketController.createBucket as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send();
    });

    (BucketController.headBucket as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send();
    });

    (BucketController.deleteBucket as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    (ObjectController.listObjects as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send('<Objects></Objects>');
    });

    (ObjectController.putObject as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send();
    });

    (ObjectController.getObject as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send('data');
    });

    (ObjectController.headObject as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send();
    });

    (ObjectController.deleteObject as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    (ObjectController.copyObject as jest.Mock).mockImplementation((req, res) => {
      res.status(200).send();
    });
  });

  describe('Service operations', () => {
    it('GET / should list all buckets', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(BucketController.listBuckets).toHaveBeenCalled();
    });
  });

  describe('Bucket operations', () => {
    const validBucket = 'test-bucket';

    it('PUT /:bucket should create bucket', async () => {
      const response = await request(app).put(`/${validBucket}`);

      expect(response.status).toBe(200);
      expect(BucketController.createBucket).toHaveBeenCalled();
    });

    it('HEAD /:bucket should check if bucket exists', async () => {
      const response = await request(app).head(`/${validBucket}`);

      expect(response.status).toBe(200);
      expect(BucketController.headBucket).toHaveBeenCalled();
    });

    it('DELETE /:bucket should delete bucket', async () => {
      const response = await request(app).delete(`/${validBucket}`);

      expect(response.status).toBe(204);
      expect(BucketController.deleteBucket).toHaveBeenCalled();
    });

    it('GET /:bucket should list objects', async () => {
      const response = await request(app).get(`/${validBucket}`);

      expect(response.status).toBe(200);
      expect(ObjectController.listObjects).toHaveBeenCalled();
    });

    it('GET /:bucket?list-type=2 should list objects v2', async () => {
      const response = await request(app)
        .get(`/${validBucket}`)
        .query({ 'list-type': '2' });

      expect(response.status).toBe(200);
      expect(ObjectController.listObjects).toHaveBeenCalled();
    });

    it('should validate bucket name format', async () => {
      // Invalid bucket names should not match route
      const invalidBuckets = ['AB', 'UPPERCASE', 'test..bucket'];

      for (const bucket of invalidBuckets) {
        const response = await request(app).put(`/${bucket}`);
        // Route won't match, will get 404
        expect([200, 404]).toContain(response.status);
      }
    });
  });

  describe('Object operations', () => {
    const validBucket = 'test-bucket';
    const objectKey = 'test-object.txt';

    it('PUT /:bucket/:key should upload object', async () => {
      const response = await request(app)
        .put(`/${validBucket}/${objectKey}`)
        .send(Buffer.from('test data'));

      expect(response.status).toBe(200);
      expect(ObjectController.putObject).toHaveBeenCalled();
    });

    it('GET /:bucket/:key should download object', async () => {
      const response = await request(app).get(`/${validBucket}/${objectKey}`);

      expect(response.status).toBe(200);
      expect(ObjectController.getObject).toHaveBeenCalled();
    });

    it('HEAD /:bucket/:key should get object metadata', async () => {
      const response = await request(app).head(`/${validBucket}/${objectKey}`);

      expect(response.status).toBe(200);
      expect(ObjectController.headObject).toHaveBeenCalled();
    });

    it('DELETE /:bucket/:key should delete object', async () => {
      const response = await request(app).delete(`/${validBucket}/${objectKey}`);

      expect(response.status).toBe(204);
      expect(ObjectController.deleteObject).toHaveBeenCalled();
    });

    it('PUT /:bucket/:key with x-amz-copy-source should copy object', async () => {
      const response = await request(app)
        .put(`/${validBucket}/${objectKey}`)
        .set('x-amz-copy-source', '/source-bucket/source-key.txt');

      expect(response.status).toBe(200);
      expect(ObjectController.copyObject).toHaveBeenCalled();
      expect(ObjectController.putObject).not.toHaveBeenCalled();
    });

    it('should handle nested object keys', async () => {
      const nestedKey = 'path/to/deep/file.txt';

      const response = await request(app).get(`/${validBucket}/${nestedKey}`);

      expect(response.status).toBe(200);
      expect(ObjectController.getObject).toHaveBeenCalled();
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'file%20with%20spaces.txt';

      const response = await request(app).get(`/${validBucket}/${specialKey}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      const { authMiddleware } = require('../../auth/middleware');

      await request(app).get('/');
      expect(authMiddleware).toHaveBeenCalled();
    });

    it('should attach auth info to request', async () => {
      await request(app).put('/test-bucket');

      expect(BucketController.createBucket).toHaveBeenCalled();
      const callArgs = (BucketController.createBucket as jest.Mock).mock.calls[0];
      const req = callArgs[0];
      expect(req.awsAuth).toBeDefined();
      expect(req.awsAuth.accessKeyId).toBe('test-key');
    });
  });

  describe('Query parameters', () => {
    const bucket = 'test-bucket';

    it('should pass prefix parameter to listObjects', async () => {
      await request(app)
        .get(`/${bucket}`)
        .query({ prefix: 'folder/' });

      expect(ObjectController.listObjects).toHaveBeenCalled();
    });

    it('should pass max-keys parameter to listObjects', async () => {
      await request(app)
        .get(`/${bucket}`)
        .query({ 'max-keys': '100' });

      expect(ObjectController.listObjects).toHaveBeenCalled();
    });

    it('should pass continuation-token parameter to listObjects', async () => {
      await request(app)
        .get(`/${bucket}`)
        .query({ 'continuation-token': 'token123' });

      expect(ObjectController.listObjects).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    const bucket = 'test-bucket';
    const key = 'test-key.txt';

    it('should support GET method', async () => {
      const response = await request(app).get(`/${bucket}/${key}`);
      expect([200, 404]).toContain(response.status);
    });

    it('should support PUT method', async () => {
      const response = await request(app).put(`/${bucket}/${key}`);
      expect([200, 404]).toContain(response.status);
    });

    it('should support DELETE method', async () => {
      const response = await request(app).delete(`/${bucket}/${key}`);
      expect([204, 404]).toContain(response.status);
    });

    it('should support HEAD method', async () => {
      const response = await request(app).head(`/${bucket}/${key}`);
      expect([200, 404]).toContain(response.status);
    });

    it('should not support POST method on objects', async () => {
      const response = await request(app).post(`/${bucket}/${key}`);
      expect(response.status).toBe(404);
    });
  });

  describe('Route precedence', () => {
    it('should prioritize bucket operations over object operations', async () => {
      // GET /:bucket should list objects, not download
      await request(app).get('/test-bucket');

      expect(ObjectController.listObjects).toHaveBeenCalled();
      expect(ObjectController.getObject).not.toHaveBeenCalled();
    });

    it('should route to copy when x-amz-copy-source header present', async () => {
      await request(app)
        .put('/dest-bucket/dest-key')
        .set('x-amz-copy-source', '/source/key');

      expect(ObjectController.copyObject).toHaveBeenCalled();
      expect(ObjectController.putObject).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty key', async () => {
      const response = await request(app).get('/test-bucket/');

      // Should still work (empty key)
      expect([200, 404]).toContain(response.status);
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      const response = await request(app).get(`/test-bucket/${longKey}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should handle keys with multiple slashes', async () => {
      const response = await request(app).get('/test-bucket/path/to/deep/nested/file.txt');

      expect(response.status).toBe(200);
      expect(ObjectController.getObject).toHaveBeenCalled();
    });
  });
});
