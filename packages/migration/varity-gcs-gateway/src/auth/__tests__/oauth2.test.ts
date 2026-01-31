/**
 * OAuth2 Authentication Tests
 * Comprehensive tests for OAuth2 verification and middleware
 */

import axios from 'axios';
import { OAuth2Verifier, oauth2Middleware } from '../oauth2';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OAuth2Verifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('should verify valid token successfully', async () => {
      const mockResponse = {
        data: {
          email: 'test@example.com',
          sub: 'user-123',
          exp: String(Math.floor(Date.now() / 1000) + 3600),
          scope: 'https://www.googleapis.com/auth/devstorage.full_control'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await OAuth2Verifier.verify('valid-token');

      expect(result.valid).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.userId).toBe('user-123');
      expect(result.scopes).toContain('https://www.googleapis.com/auth/devstorage.full_control');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should reject token without email', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          exp: String(Math.floor(Date.now() / 1000) + 3600)
        }
      });

      const result = await OAuth2Verifier.verify('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token response');
    });

    it('should reject token without expiration', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          email: 'test@example.com'
        }
      });

      const result = await OAuth2Verifier.verify('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token response');
    });

    it('should reject expired token', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          email: 'test@example.com',
          sub: 'user-123',
          exp: String(Math.floor(Date.now() / 1000) - 3600), // Expired 1 hour ago
          scope: 'https://www.googleapis.com/auth/devstorage.read_only'
        }
      });

      const result = await OAuth2Verifier.verify('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await OAuth2Verifier.verify('token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle API error responses', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          data: {
            error_description: 'Invalid token'
          }
        }
      });

      const result = await OAuth2Verifier.verify('token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should parse multiple scopes correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          email: 'test@example.com',
          sub: 'user-123',
          exp: String(Math.floor(Date.now() / 1000) + 3600),
          scope: 'scope1 scope2 scope3'
        }
      });

      const result = await OAuth2Verifier.verify('token');

      expect(result.valid).toBe(true);
      expect(result.scopes).toEqual(['scope1', 'scope2', 'scope3']);
    });

    it('should handle token with no scopes', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          email: 'test@example.com',
          sub: 'user-123',
          exp: String(Math.floor(Date.now() / 1000) + 3600)
        }
      });

      const result = await OAuth2Verifier.verify('token');

      expect(result.valid).toBe(true);
      expect(result.scopes).toEqual([]);
    });

    it('should respect timeout configuration', async () => {
      mockedAxios.get.mockRejectedValueOnce({ code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' });

      const result = await OAuth2Verifier.verify('token');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info successfully', async () => {
      const mockUserInfo = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg'
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUserInfo });

      const result = await OAuth2Verifier.getUserInfo('valid-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid-token'
          }
        })
      );
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed'));

      const result = await OAuth2Verifier.getUserInfo('invalid-token');

      expect(result).toBeNull();
    });

    it('should handle network timeouts', async () => {
      mockedAxios.get.mockRejectedValueOnce({ code: 'ECONNABORTED' });

      const result = await OAuth2Verifier.getUserInfo('token');

      expect(result).toBeNull();
    });
  });

  describe('extractToken', () => {
    it('should extract Bearer token', () => {
      const token = OAuth2Verifier.extractToken('Bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should extract OAuth token', () => {
      const token = OAuth2Verifier.extractToken('OAuth xyz789');
      expect(token).toBe('xyz789');
    });

    it('should be case insensitive', () => {
      expect(OAuth2Verifier.extractToken('bearer token123')).toBe('token123');
      expect(OAuth2Verifier.extractToken('BEARER token456')).toBe('token456');
      expect(OAuth2Verifier.extractToken('oauth token789')).toBe('token789');
    });

    it('should return null for undefined header', () => {
      const token = OAuth2Verifier.extractToken(undefined);
      expect(token).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(OAuth2Verifier.extractToken('InvalidFormat token')).toBeNull();
      expect(OAuth2Verifier.extractToken('token')).toBeNull();
      expect(OAuth2Verifier.extractToken('')).toBeNull();
    });

    it('should handle tokens with special characters', () => {
      const token = OAuth2Verifier.extractToken('Bearer token-with_special.chars=');
      expect(token).toBe('token-with_special.chars=');
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(1000);
      const token = OAuth2Verifier.extractToken(`Bearer ${longToken}`);
      expect(token).toBe(longToken);
    });
  });

  describe('validateScopes', () => {
    it('should validate exact scope match', () => {
      const result = OAuth2Verifier.validateScopes(
        ['scope1', 'scope2'],
        ['scope1']
      );
      expect(result).toBe(true);
    });

    it('should validate multiple required scopes', () => {
      const result = OAuth2Verifier.validateScopes(
        ['scope1', 'scope2', 'scope3'],
        ['scope1', 'scope2']
      );
      expect(result).toBe(true);
    });

    it('should validate prefix matches', () => {
      const result = OAuth2Verifier.validateScopes(
        ['https://www.googleapis.com/auth/devstorage.full_control'],
        ['https://www.googleapis.com/auth/devstorage']
      );
      expect(result).toBe(true);
    });

    it('should fail when required scope is missing', () => {
      const result = OAuth2Verifier.validateScopes(
        ['scope1', 'scope2'],
        ['scope1', 'scope3']
      );
      expect(result).toBe(false);
    });

    it('should handle empty required scopes', () => {
      const result = OAuth2Verifier.validateScopes(
        ['scope1', 'scope2'],
        []
      );
      expect(result).toBe(true);
    });

    it('should handle empty token scopes', () => {
      const result = OAuth2Verifier.validateScopes(
        [],
        ['scope1']
      );
      expect(result).toBe(false);
    });

    it('should be case sensitive', () => {
      const result = OAuth2Verifier.validateScopes(
        ['Scope1'],
        ['scope1']
      );
      expect(result).toBe(false);
    });
  });
});

describe('oauth2Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should call next() for valid token', async () => {
    mockReq.headers.authorization = 'Bearer valid-token';

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        email: 'test@example.com',
        sub: 'user-123',
        exp: String(Math.floor(Date.now() / 1000) + 3600),
        scope: 'scope1 scope2'
      }
    });

    await oauth2Middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      email: 'test@example.com',
      userId: 'user-123',
      scopes: ['scope1', 'scope2']
    });
  });

  it('should return 401 when authorization header is missing', async () => {
    await oauth2Middleware(mockReq, mockRes, mockNext);

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

  it('should return 401 for invalid token', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    mockedAxios.get.mockRejectedValueOnce(new Error('Invalid token'));

    await oauth2Middleware(mockReq, mockRes, mockNext);

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

  it('should return 401 for expired token', async () => {
    mockReq.headers.authorization = 'Bearer expired-token';

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        email: 'test@example.com',
        sub: 'user-123',
        exp: String(Math.floor(Date.now() / 1000) - 3600)
      }
    });

    await oauth2Middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle malformed authorization header', async () => {
    mockReq.headers.authorization = 'InvalidFormat';

    await oauth2Middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
