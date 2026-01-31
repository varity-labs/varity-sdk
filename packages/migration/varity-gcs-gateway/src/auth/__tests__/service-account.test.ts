/**
 * Service Account Authentication Tests
 * Comprehensive tests for service account JWT authentication
 */

import * as jwt from 'jsonwebtoken';
import { ServiceAccountAuth, createServiceAccountMiddleware } from '../service-account';

describe('ServiceAccountAuth', () => {
  const mockCredentials = {
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'key-123',
    private_key: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/yU8L/q5MKkZsWQ+9m5VIWfHDvpyF9Xhz
dummy-private-key-for-testing-only
-----END RSA PRIVATE KEY-----`,
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: '123456789',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com'
  };

  describe('constructor', () => {
    it('should create instance without credentials', () => {
      const auth = new ServiceAccountAuth();
      expect(auth).toBeInstanceOf(ServiceAccountAuth);
      expect(auth.getEmail()).toBeNull();
    });

    it('should create instance with JSON string credentials', () => {
      const auth = new ServiceAccountAuth(JSON.stringify(mockCredentials));
      expect(auth.getEmail()).toBe(mockCredentials.client_email);
    });

    it('should create instance with object credentials', () => {
      const auth = new ServiceAccountAuth(mockCredentials);
      expect(auth.getEmail()).toBe(mockCredentials.client_email);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        new ServiceAccountAuth('invalid-json');
      }).toThrow('Failed to load service account credentials');
    });

    it('should throw error for invalid credentials structure', () => {
      expect(() => {
        new ServiceAccountAuth({ invalid: 'credentials' } as any);
      }).toThrow('Invalid service account credentials format');
    });
  });

  describe('loadCredentials', () => {
    let auth: ServiceAccountAuth;

    beforeEach(() => {
      auth = new ServiceAccountAuth();
    });

    it('should load valid JSON string credentials', () => {
      auth.loadCredentials(JSON.stringify(mockCredentials));
      expect(auth.getEmail()).toBe(mockCredentials.client_email);
      expect(auth.getProjectId()).toBe(mockCredentials.project_id);
    });

    it('should load valid object credentials', () => {
      auth.loadCredentials(mockCredentials);
      expect(auth.getEmail()).toBe(mockCredentials.client_email);
    });

    it('should reject credentials without type field', () => {
      const invalid = { ...mockCredentials };
      delete (invalid as any).type;

      expect(() => {
        auth.loadCredentials(invalid);
      }).toThrow('Invalid service account credentials format');
    });

    it('should reject credentials with wrong type', () => {
      const invalid = { ...mockCredentials, type: 'user_account' };

      expect(() => {
        auth.loadCredentials(invalid);
      }).toThrow('Invalid service account credentials format');
    });

    it('should reject credentials without project_id', () => {
      const invalid = { ...mockCredentials };
      delete (invalid as any).project_id;

      expect(() => {
        auth.loadCredentials(invalid);
      }).toThrow('Invalid service account credentials format');
    });

    it('should reject credentials without private_key', () => {
      const invalid = { ...mockCredentials };
      delete (invalid as any).private_key;

      expect(() => {
        auth.loadCredentials(invalid);
      }).toThrow('Invalid service account credentials format');
    });

    it('should reject credentials without client_email', () => {
      const invalid = { ...mockCredentials };
      delete (invalid as any).client_email;

      expect(() => {
        auth.loadCredentials(invalid);
      }).toThrow('Invalid service account credentials format');
    });

    it('should handle credentials reload', () => {
      auth.loadCredentials(mockCredentials);
      expect(auth.getEmail()).toBe(mockCredentials.client_email);

      const newCredentials = {
        ...mockCredentials,
        client_email: 'new@test-project.iam.gserviceaccount.com'
      };

      auth.loadCredentials(newCredentials);
      expect(auth.getEmail()).toBe('new@test-project.iam.gserviceaccount.com');
    });
  });

  describe('verifyToken', () => {
    let auth: ServiceAccountAuth;

    beforeEach(() => {
      auth = new ServiceAccountAuth(mockCredentials);
    });

    it('should return error if credentials not loaded', async () => {
      const unloadedAuth = new ServiceAccountAuth();
      const result = await unloadedAuth.verifyToken('token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Service account credentials not loaded');
    });

    it('should reject invalid token format', async () => {
      const result = await auth.verifyToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should reject token with invalid signature', async () => {
      // Create a token with wrong signature
      const badToken = jwt.sign(
        {
          iss: mockCredentials.client_email,
          sub: mockCredentials.client_email,
          aud: mockCredentials.token_uri
        },
        'wrong-secret'
      );

      const result = await auth.verifyToken(badToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject token with wrong issuer', async () => {
      const token = auth.generateToken(['scope1']);
      const wrongIssuerToken = token.replace(
        mockCredentials.client_email,
        'wrong@example.com'
      );

      const result = await auth.verifyToken(wrongIssuerToken);

      expect(result.valid).toBe(false);
    });

    it('should handle malformed JWT', async () => {
      const result = await auth.verifyToken('not.a.jwt');

      expect(result.valid).toBe(false);
    });

    it('should handle expired token', async () => {
      const expiredToken = jwt.sign(
        {
          iss: mockCredentials.client_email,
          sub: mockCredentials.client_email,
          aud: mockCredentials.token_uri,
          iat: Math.floor(Date.now() / 1000) - 7200,
          exp: Math.floor(Date.now() / 1000) - 3600
        },
        mockCredentials.private_key,
        { algorithm: 'RS256' }
      );

      const result = await auth.verifyToken(expiredToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('generateToken', () => {
    let auth: ServiceAccountAuth;

    beforeEach(() => {
      auth = new ServiceAccountAuth(mockCredentials);
    });

    it('should generate valid token', () => {
      const token = auth.generateToken(['scope1', 'scope2']);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token, { complete: true }) as any;
      expect(decoded.payload.iss).toBe(mockCredentials.client_email);
      expect(decoded.payload.scope).toBe('scope1 scope2');
    });

    it('should generate token with default expiry', () => {
      const token = auth.generateToken();

      const decoded = jwt.decode(token) as any;
      const expectedExp = Math.floor(Date.now() / 1000) + 3600;

      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
    });

    it('should generate token with custom expiry', () => {
      const token = auth.generateToken(['scope1'], 7200);

      const decoded = jwt.decode(token) as any;
      const expectedExp = Math.floor(Date.now() / 1000) + 7200;

      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 7100);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
    });

    it('should generate token with empty scopes', () => {
      const token = auth.generateToken([]);

      const decoded = jwt.decode(token) as any;
      expect(decoded.scope).toBe('');
    });

    it('should throw error if credentials not loaded', () => {
      const unloadedAuth = new ServiceAccountAuth();

      expect(() => {
        unloadedAuth.generateToken();
      }).toThrow('Service account credentials not loaded');
    });

    it('should include required JWT claims', () => {
      const token = auth.generateToken(['scope1']);
      const decoded = jwt.decode(token) as any;

      expect(decoded.iss).toBe(mockCredentials.client_email);
      expect(decoded.sub).toBe(mockCredentials.client_email);
      expect(decoded.aud).toBe(mockCredentials.token_uri);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate tokens with different content each time', () => {
      const token1 = auth.generateToken(['scope1']);
      // Wait a bit to ensure different timestamp
      const token2 = auth.generateToken(['scope1']);

      expect(token1).not.toBe(token2);
    });
  });

  describe('getEmail', () => {
    it('should return null when credentials not loaded', () => {
      const auth = new ServiceAccountAuth();
      expect(auth.getEmail()).toBeNull();
    });

    it('should return email when credentials loaded', () => {
      const auth = new ServiceAccountAuth(mockCredentials);
      expect(auth.getEmail()).toBe(mockCredentials.client_email);
    });
  });

  describe('getProjectId', () => {
    it('should return null when credentials not loaded', () => {
      const auth = new ServiceAccountAuth();
      expect(auth.getProjectId()).toBeNull();
    });

    it('should return project ID when credentials loaded', () => {
      const auth = new ServiceAccountAuth(mockCredentials);
      expect(auth.getProjectId()).toBe(mockCredentials.project_id);
    });
  });
});

describe('createServiceAccountMiddleware', () => {
  let auth: ServiceAccountAuth;
  let middleware: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  const mockCredentials = {
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'key-123',
    private_key: `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/yU8L/q5MKkZsWQ+9m5VIWfHDvpyF9Xhz
dummy-private-key-for-testing-only
-----END RSA PRIVATE KEY-----`,
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: '123456789',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com'
  };

  beforeEach(() => {
    auth = new ServiceAccountAuth(mockCredentials);
    middleware = createServiceAccountMiddleware(auth);

    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should return 401 when authorization header is missing', async () => {
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 401,
          message: 'Unauthorized'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid authorization header format', async () => {
    mockReq.headers.authorization = 'InvalidFormat token';

    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Invalid authorization header format'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 401,
          message: 'Invalid credentials'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() for valid token', async () => {
    const validToken = auth.generateToken(['scope1']);
    mockReq.headers.authorization = `Bearer ${validToken}`;

    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.serviceAccount).toEqual({
      email: mockCredentials.client_email
    });
  });

  it('should handle case-insensitive Bearer keyword', async () => {
    const validToken = auth.generateToken(['scope1']);
    mockReq.headers.authorization = `bearer ${validToken}`;

    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject token without Bearer prefix', async () => {
    const validToken = auth.generateToken(['scope1']);
    mockReq.headers.authorization = validToken;

    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
