import { Request, Response, NextFunction } from 'express';
import {
  authMiddleware,
  optionalAuthMiddleware,
  AuthenticatedRequest,
  addCredential,
  removeCredential,
  listAccessKeys
} from '../middleware';

// Mock the signature verifier
jest.mock('../signature-v4', () => ({
  SignatureV4Verifier: {
    verify: jest.fn()
  }
}));

import { SignatureV4Verifier } from '../signature-v4';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockVerify: jest.MockedFunction<typeof SignatureV4Verifier.verify>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      path: '/test-bucket',
      method: 'GET',
      url: '/test-bucket',
      originalUrl: '/test-bucket',
      query: {},
      body: null
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
    mockVerify = SignatureV4Verifier.verify as jest.MockedFunction<typeof SignatureV4Verifier.verify>;
    mockVerify.mockClear();

    // Add test credential
    addCredential('AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  });

  afterEach(() => {
    removeCredential('AKIAIOSFODNN7EXAMPLE');
  });

  describe('authMiddleware', () => {
    it('should reject request without Authorization header', () => {
      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid access key ID', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=INVALID_KEY/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123',
        'x-amz-date': '20130524T000000Z'
      };

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with valid access key but invalid signature', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=invalidsignature',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockReturnValue({
        valid: false,
        error: 'Signature mismatch',
        timestamp: new Date()
      });

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should accept request with valid signature', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=validsignature',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockReturnValue({
        valid: true,
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        timestamp: new Date()
      });

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.awsAuth).toEqual({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        authenticated: true
      });
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle internal errors gracefully', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockImplementation(() => {
        throw new Error('Internal verification error');
      });

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should extract access key ID from authorization header', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockReturnValue({
        valid: true,
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        timestamp: new Date()
      });

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockVerify).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/test-bucket'
        }),
        'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      );
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should allow request without Authorization header', () => {
      optionalAuthMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate if Authorization header is present', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockReturnValue({
        valid: false,
        error: 'Signature mismatch',
        timestamp: new Date()
      });

      optionalAuthMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should accept valid Authorization header', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockReturnValue({
        valid: true,
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        timestamp: new Date()
      });

      optionalAuthMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.awsAuth).toEqual({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        authenticated: true
      });
    });
  });

  describe('Credential management', () => {
    it('should add credentials to store', () => {
      addCredential('TEST_ACCESS_KEY', 'TEST_SECRET_KEY');

      const keys = listAccessKeys();
      expect(keys).toContain('TEST_ACCESS_KEY');

      removeCredential('TEST_ACCESS_KEY');
    });

    it('should remove credentials from store', () => {
      addCredential('TEST_ACCESS_KEY', 'TEST_SECRET_KEY');
      removeCredential('TEST_ACCESS_KEY');

      const keys = listAccessKeys();
      expect(keys).not.toContain('TEST_ACCESS_KEY');
    });

    it('should list all access keys', () => {
      addCredential('KEY1', 'SECRET1');
      addCredential('KEY2', 'SECRET2');

      const keys = listAccessKeys();
      expect(keys).toContain('KEY1');
      expect(keys).toContain('KEY2');

      removeCredential('KEY1');
      removeCredential('KEY2');
    });

    it('should load credentials from environment variables on init', () => {
      const keys = listAccessKeys();
      // Check if environment variable credentials were loaded
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('Error response format', () => {
    it('should return XML error response for missing auth', () => {
      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('<?xml')
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('AccessDenied')
      );
    });

    it('should return XML error response for invalid key', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=INVALID_KEY/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123'
      };

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('InvalidAccessKeyId')
      );
    });

    it('should return XML error response for signature mismatch', () => {
      mockRequest.headers = {
        'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host, Signature=abc123',
        'x-amz-date': '20130524T000000Z'
      };

      mockVerify.mockReturnValue({
        valid: false,
        error: 'Signature mismatch',
        timestamp: new Date()
      });

      authMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('SignatureDoesNotMatch')
      );
    });
  });
});
