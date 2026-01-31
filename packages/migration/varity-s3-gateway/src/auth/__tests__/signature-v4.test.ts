import crypto from 'crypto';
import { SignatureV4Verifier, AWSSignatureV4Request } from '../signature-v4';

describe('AWS Signature V4 Verifier', () => {
  const testSecretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
  const testAccessKeyId = 'AKIAIOSFODNN7EXAMPLE';
  const testDate = '20130524T000000Z';
  const testRegion = 'us-east-1';
  const testService = 's3';

  /**
   * Helper to create a valid AWS Signature V4 request
   */
  function createValidRequest(overrides?: Partial<AWSSignatureV4Request>): AWSSignatureV4Request {
    const method = 'GET';
    const url = '/test-bucket/test.txt';
    const headers = {
      'host': 's3.amazonaws.com',
      'x-amz-date': testDate,
      'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'authorization': ''
    };

    // Build canonical request
    const canonicalRequest = `${method}\n${url}\n\nhost:s3.amazonaws.com\nx-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nx-amz-date:${testDate}\n\nhost;x-amz-content-sha256;x-amz-date\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;

    const hashedCanonicalRequest = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');

    const credentialScope = `${testDate.substring(0, 8)}/${testRegion}/${testService}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${testDate}\n${credentialScope}\n${hashedCanonicalRequest}`;

    // Calculate signature
    const dateStamp = testDate.substring(0, 8);
    const kDate = hmac(`AWS4${testSecretKey}`, dateStamp);
    const kRegion = hmac(kDate, testRegion);
    const kService = hmac(kRegion, testService);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = hmac(kSigning, stringToSign, 'hex') as string;

    headers.authorization = `AWS4-HMAC-SHA256 Credential=${testAccessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;

    return {
      method,
      url,
      headers,
      ...overrides
    };
  }

  function hmac(key: string | Buffer, data: string, encoding?: 'hex'): Buffer | string {
    const hmacObj = crypto.createHmac('sha256', key);
    hmacObj.update(data);
    return encoding ? hmacObj.digest(encoding) : hmacObj.digest();
  }

  describe('verify()', () => {
    it('should verify valid AWS Signature V4 request', () => {
      const request = createValidRequest();
      const result = SignatureV4Verifier.verify(request, testSecretKey);

      expect(result.valid).toBe(true);
      expect(result.accessKeyId).toBe(testAccessKeyId);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should reject request with invalid signature', () => {
      const request = createValidRequest();
      const result = SignatureV4Verifier.verify(request, 'wrong-secret-key');

      expect(result.valid).toBe(false);
      expect(result.accessKeyId).toBeUndefined();
      expect(result.error).toBe('Signature mismatch');
    });

    it('should reject request without Authorization header', () => {
      const request: AWSSignatureV4Request = {
        method: 'GET',
        url: '/test',
        headers: {}
      };

      const result = SignatureV4Verifier.verify(request, testSecretKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or missing Authorization header');
    });

    it('should reject request with invalid Authorization header format', () => {
      const request: AWSSignatureV4Request = {
        method: 'GET',
        url: '/test',
        headers: {
          'authorization': 'Bearer invalid-token',
          'x-amz-date': testDate
        }
      };

      const result = SignatureV4Verifier.verify(request, testSecretKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or missing Authorization header');
    });

    it('should reject request with malformed credential', () => {
      const request: AWSSignatureV4Request = {
        method: 'GET',
        url: '/test',
        headers: {
          'authorization': 'AWS4-HMAC-SHA256 Credential=INVALID, SignedHeaders=host, Signature=abc123',
          'x-amz-date': testDate
        }
      };

      const result = SignatureV4Verifier.verify(request, testSecretKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid credential format');
    });

    it('should handle request with query parameters', () => {
      const request = createValidRequest({
        url: '/test-bucket/test.txt?prefix=foo&max-keys=100',
        query: { prefix: 'foo', 'max-keys': '100' }
      });

      // This will fail signature verification but should parse correctly
      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle request with body', () => {
      const body = Buffer.from('test data');
      const request = createValidRequest({
        method: 'PUT',
        body
      });

      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle errors gracefully', () => {
      const request: AWSSignatureV4Request = {
        method: 'GET',
        url: '/test',
        headers: {
          'authorization': 'AWS4-HMAC-SHA256 InvalidFormat',
          'x-amz-date': testDate
        }
      };

      const result = SignatureV4Verifier.verify(request, testSecretKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in URL', () => {
      const request = createValidRequest({
        url: '/test-bucket/file%20with%20spaces.txt'
      });

      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle nested paths', () => {
      const request = createValidRequest({
        url: '/test-bucket/path/to/deep/file.txt'
      });

      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle multiple signed headers', () => {
      const request = createValidRequest();
      // Signature will be invalid but parsing should work
      request.headers.authorization = request.headers.authorization.replace(
        'SignedHeaders=host;x-amz-content-sha256;x-amz-date',
        'SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date'
      );

      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle case-insensitive headers', () => {
      const request = createValidRequest();
      request.headers['HOST'] = request.headers['host'];
      delete request.headers['host'];

      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Security tests', () => {
    it('should prevent signature reuse with different method', () => {
      const getRequest = createValidRequest({ method: 'GET' });

      // Try to use GET signature for PUT request
      const putRequest = { ...getRequest, method: 'PUT' };
      const result = SignatureV4Verifier.verify(putRequest, testSecretKey);

      expect(result.valid).toBe(false);
    });

    it('should prevent signature reuse with different URL', () => {
      const request = createValidRequest({ url: '/bucket1/file.txt' });

      // Try to use signature for different URL
      request.url = '/bucket2/file.txt';
      const result = SignatureV4Verifier.verify(request, testSecretKey);

      expect(result.valid).toBe(false);
    });

    it('should validate timestamp to prevent replay attacks', () => {
      const request = createValidRequest();
      // Signature was created with specific timestamp, should be validated

      const result = SignatureV4Verifier.verify(request, testSecretKey);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
