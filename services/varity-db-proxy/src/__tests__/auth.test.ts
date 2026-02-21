// Set env vars before importing config (config.ts calls process.exit if missing)
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests';

import jwt from 'jsonwebtoken';
import { generateAppToken, validateAppToken } from '../auth';
import { Request, Response, NextFunction } from 'express';

describe('generateAppToken', () => {
  it('generates a valid JWT token', () => {
    const token = generateAppToken('my_app');
    const decoded = jwt.verify(token, 'test_jwt_secret_for_unit_tests') as any;
    expect(decoded.appId).toBe('my_app');
  });

  it('includes expiration by default', () => {
    const token = generateAppToken('my_app');
    const decoded = jwt.decode(token) as any;
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  it('respects custom expiration', () => {
    const token = generateAppToken('my_app', '1h');
    const decoded = jwt.decode(token) as any;
    // 1 hour = 3600 seconds
    expect(decoded.exp - decoded.iat).toBe(3600);
  });
});

describe('validateAppToken middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = { headers: {} };
    mockRes = { status: statusMock, json: jsonMock };
    mockNext = jest.fn();
  });

  it('rejects requests with no authorization header', () => {
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.stringContaining('Missing') })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejects requests with non-Bearer authorization', () => {
    mockReq.headers = { authorization: 'Basic abc123' };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejects invalid JWT tokens', () => {
    mockReq.headers = { authorization: 'Bearer invalid.token.here' };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
  });

  it('rejects tokens signed with wrong secret', () => {
    const badToken = jwt.sign({ appId: 'test' }, 'wrong_secret');
    mockReq.headers = { authorization: `Bearer ${badToken}` };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('rejects tokens without appId', () => {
    const noAppIdToken = jwt.sign({ userId: 'test' }, 'test_jwt_secret_for_unit_tests');
    mockReq.headers = { authorization: `Bearer ${noAppIdToken}` };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token: missing appId' })
    );
  });

  it('rejects expired tokens', () => {
    const expiredToken = jwt.sign(
      { appId: 'test', exp: Math.floor(Date.now() / 1000) - 3600 },
      'test_jwt_secret_for_unit_tests'
    );
    mockReq.headers = { authorization: `Bearer ${expiredToken}` };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token expired' })
    );
  });

  it('accepts valid tokens and sets appContext', () => {
    const validToken = generateAppToken('test_app_123');
    mockReq.headers = { authorization: `Bearer ${validToken}` };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.appContext).toEqual({
      appId: 'test_app_123',
      schema: 'app_test_app_123',
    });
  });

  it('creates schema name with app_ prefix', () => {
    const validToken = generateAppToken('my_cool_app');
    mockReq.headers = { authorization: `Bearer ${validToken}` };
    validateAppToken(mockReq as Request, mockRes as Response, mockNext);
    expect(mockReq.appContext?.schema).toBe('app_my_cool_app');
  });
});
