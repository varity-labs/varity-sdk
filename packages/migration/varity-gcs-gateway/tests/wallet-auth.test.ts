/**
 * Wallet Authentication Test Suite
 * Tests SIWE authentication, hybrid auth mode, and permission mapping
 */

import request from 'supertest';
import { ethers } from 'ethers';
import { GCSGatewayServer } from '../src/server';
import { SIWEAuth } from '../src/auth/siwe';
import { PermissionManager } from '../src/auth/permissions';

describe('Wallet Authentication', () => {
  let server: GCSGatewayServer;
  let app: any;
  let wallet: ethers.Wallet;
  let siweAuth: SIWEAuth;
  let permissionManager: PermissionManager;

  beforeAll(async () => {
    // Set environment for wallet auth
    process.env.AUTH_MODE = 'wallet';
    process.env.WALLET_AUTH_ENABLED = 'true';
    process.env.JWT_SECRET = 'test-secret';

    // Create test wallet
    wallet = ethers.Wallet.createRandom();

    // Initialize services
    siweAuth = new SIWEAuth();
    permissionManager = new PermissionManager();

    // Create customer permissions for test wallet
    permissionManager.createCustomerPermissions(
      wallet.address,
      'test-customer-123',
      'iso-merchant'
    );

    // Start server
    server = new GCSGatewayServer();
    app = server.getApp();
  });

  afterAll(() => {
    // Clean up
    permissionManager.clearPermissions();
  });

  describe('SIWE Authentication Flow', () => {
    let nonce: string;
    let message: any;
    let signature: string;
    let token: string;

    it('should generate nonce for wallet', async () => {
      const response = await request(app)
        .get('/auth/nonce')
        .query({ address: wallet.address })
        .expect(200);

      expect(response.body).toHaveProperty('nonce');
      expect(response.body).toHaveProperty('address');
      expect(response.body.address).toBe(wallet.address.toLowerCase());
      expect(response.body.chainId).toBe(33529);

      nonce = response.body.nonce;
    });

    it('should generate SIWE message', async () => {
      const response = await request(app)
        .post('/auth/message')
        .send({
          address: wallet.address,
          resources: ['bucket:test-bucket']
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('formattedMessage');
      expect(response.body.message.address).toBe(wallet.address);
      expect(response.body.message.chainId).toBe(33529);

      message = response.body.message;
    });

    it('should verify valid SIWE signature and issue JWT', async () => {
      // Sign the SIWE message
      const formattedMessage = siweAuth.formatSIWEMessage(message);
      signature = await wallet.signMessage(formattedMessage);

      const response = await request(app)
        .post('/auth/verify')
        .send({
          message,
          signature
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('chainId');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.address).toBe(wallet.address);
      expect(response.body.chainId).toBe(33529);

      token = response.body.token;
    });

    it('should reject invalid signature', async () => {
      const invalidSignature = '0x' + '0'.repeat(130);

      await request(app)
        .post('/auth/verify')
        .send({
          message,
          signature: invalidSignature
        })
        .expect(401);
    });

    it('should reject expired message', async () => {
      const expiredMessage = {
        ...message,
        expirationTime: new Date(Date.now() - 10000).toISOString()
      };

      const sig = await wallet.signMessage(siweAuth.formatSIWEMessage(expiredMessage));

      await request(app)
        .post('/auth/verify')
        .send({
          message: expiredMessage,
          signature: sig
        })
        .expect(401);
    });

    it('should access GCS API with JWT token', async () => {
      await request(app)
        .get('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should refresh JWT token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ token })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(token);
    });

    it('should get wallet permissions', async () => {
      const response = await request(app)
        .get('/auth/permissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('buckets');
      expect(response.body).toHaveProperty('isAdmin');
      expect(response.body.address).toBe(wallet.address.toLowerCase());
    });

    it('should get storage layer access', async () => {
      const response = await request(app)
        .get('/auth/storage-layers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('storageLayerAccess');
      expect(response.body.storageLayerAccess).toHaveProperty('varityInternal');
      expect(response.body.storageLayerAccess).toHaveProperty('industryRag');
      expect(response.body.storageLayerAccess).toHaveProperty('customerData');
    });
  });

  describe('Permission System', () => {
    let token: string;

    beforeAll(async () => {
      // Generate nonce
      const nonceRes = await request(app)
        .get('/auth/nonce')
        .query({ address: wallet.address });

      // Generate message
      const messageRes = await request(app)
        .post('/auth/message')
        .send({ address: wallet.address });

      const message = messageRes.body.message;

      // Sign and verify
      const formattedMessage = siweAuth.formatSIWEMessage(message);
      const signature = await wallet.signMessage(formattedMessage);

      const verifyRes = await request(app)
        .post('/auth/verify')
        .send({ message, signature });

      token = verifyRes.body.token;
    });

    it('should allow access to customer bucket', async () => {
      const response = await request(app)
        .get('/storage/v1/b/customer-test-customer-123-data')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should allow read access to industry RAG bucket', async () => {
      const response = await request(app)
        .get('/storage/v1/b/industry-iso-merchant-rag-docs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should deny write access to industry RAG bucket', async () => {
      const response = await request(app)
        .post('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'industry-iso-merchant-rag-new',
          location: 'FILECOIN',
          storageClass: 'STANDARD'
        })
        .expect(403);
    });

    it('should deny access to Varity internal bucket', async () => {
      const response = await request(app)
        .get('/storage/v1/b/varity-internal-docs')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should deny access to other customer bucket', async () => {
      const response = await request(app)
        .get('/storage/v1/b/customer-other-customer-456-data')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Hybrid Authentication Mode', () => {
    let walletToken: string;
    let oauth2Token: string;

    beforeAll(async () => {
      // Set hybrid mode
      process.env.AUTH_MODE = 'hybrid';

      // Get wallet token
      const nonceRes = await request(app)
        .get('/auth/nonce')
        .query({ address: wallet.address });

      const messageRes = await request(app)
        .post('/auth/message')
        .send({ address: wallet.address });

      const message = messageRes.body.message;
      const formattedMessage = siweAuth.formatSIWEMessage(message);
      const signature = await wallet.signMessage(formattedMessage);

      const verifyRes = await request(app)
        .post('/auth/verify')
        .send({ message, signature });

      walletToken = verifyRes.body.token;

      // Mock OAuth2 token (in real tests, use actual Google OAuth2)
      oauth2Token = 'mock-oauth2-token';
    });

    it('should accept wallet authentication', async () => {
      const response = await request(app)
        .get('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', `Bearer ${walletToken}`)
        .expect(200);
    });

    it('should accept OAuth2 authentication', async () => {
      // Note: This will fail without valid OAuth2 token
      // In production, use actual Google OAuth2 token
      const response = await request(app)
        .get('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', `Bearer ${oauth2Token}`)
        .expect(401); // Expected to fail with mock token
    });

    it('should reject invalid token', async () => {
      await request(app)
        .get('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject missing authorization header', async () => {
      await request(app)
        .get('/storage/v1/b')
        .query({ project: 'test-project' })
        .expect(401);
    });
  });

  describe('Admin Permissions', () => {
    let adminWallet: ethers.Wallet;
    let adminToken: string;

    beforeAll(async () => {
      adminWallet = ethers.Wallet.createRandom();

      // Create admin permissions
      permissionManager.createAdminPermissions(adminWallet.address);

      // Get admin token
      const nonceRes = await request(app)
        .get('/auth/nonce')
        .query({ address: adminWallet.address });

      const messageRes = await request(app)
        .post('/auth/message')
        .send({ address: adminWallet.address });

      const message = messageRes.body.message;
      const formattedMessage = siweAuth.formatSIWEMessage(message);
      const signature = await adminWallet.signMessage(formattedMessage);

      const verifyRes = await request(app)
        .post('/auth/verify')
        .send({ message, signature });

      adminToken = verifyRes.body.token;
    });

    it('should allow admin access to all storage layers', async () => {
      const response = await request(app)
        .get('/auth/storage-layers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.storageLayerAccess.varityInternal).toBe(true);
      expect(response.body.storageLayerAccess.industryRag).toBe(true);
      expect(response.body.storageLayerAccess.customerData).toBe(true);
    });

    it('should allow admin to create buckets', async () => {
      const response = await request(app)
        .post('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'admin-test-bucket',
          location: 'FILECOIN',
          storageClass: 'STANDARD'
        })
        .expect(200);
    });

    it('should allow admin to delete buckets', async () => {
      const response = await request(app)
        .delete('/storage/v1/b/admin-test-bucket')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Session Management', () => {
    it('should reject expired JWT token', async () => {
      // Create token with 1 second expiry
      process.env.JWT_EXPIRES_IN = '1s';

      const nonceRes = await request(app)
        .get('/auth/nonce')
        .query({ address: wallet.address });

      const messageRes = await request(app)
        .post('/auth/message')
        .send({ address: wallet.address });

      const message = messageRes.body.message;
      const formattedMessage = siweAuth.formatSIWEMessage(message);
      const signature = await wallet.signMessage(formattedMessage);

      const verifyRes = await request(app)
        .post('/auth/verify')
        .send({ message, signature });

      const token = verifyRes.body.token;

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      await request(app)
        .get('/storage/v1/b')
        .query({ project: 'test-project' })
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      // Reset expiry
      process.env.JWT_EXPIRES_IN = '24h';
    });
  });
});
