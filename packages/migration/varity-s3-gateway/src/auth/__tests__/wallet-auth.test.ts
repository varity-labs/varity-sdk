import { SiweAuthService } from '../siwe';
import { AccessControlService, S3Permission, S3Role } from '../acl';

describe('SIWE Authentication Service', () => {
  describe('Nonce Management', () => {
    it('should generate a unique nonce', () => {
      const nonce1 = SiweAuthService.generateNonce();
      const nonce2 = SiweAuthService.generateNonce();

      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBe(32); // 16 bytes in hex
    });

    it('should verify valid nonce', () => {
      const nonce = SiweAuthService.generateNonce();
      const isValid = SiweAuthService.verifyNonce(nonce);

      expect(isValid).toBe(true);
    });

    it('should reject invalid nonce', () => {
      const isValid = SiweAuthService.verifyNonce('invalid-nonce');

      expect(isValid).toBe(false);
    });

    it('should reject reused nonce', () => {
      const nonce = SiweAuthService.generateNonce();

      // First verification should succeed
      expect(SiweAuthService.verifyNonce(nonce)).toBe(true);

      // Second verification should fail (nonce already used)
      expect(SiweAuthService.verifyNonce(nonce)).toBe(false);
    });
  });

  describe('SIWE Message Generation', () => {
    it('should generate valid SIWE message', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const domain = 'localhost:3001';
      const uri = 'http://localhost:3001';

      const message = await SiweAuthService.generateSiweMessage({
        address,
        domain,
        uri,
        chainId: 33529,
        statement: 'Test statement'
      });

      expect(message).toBeDefined();
      expect(message).toContain(address);
      expect(message).toContain(domain);
      expect(message).toContain('Test statement');
      expect(message).toContain('33529');
    });
  });

  describe('JWT Token Management', () => {
    it('should create valid JWT token', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const chainId = 33529;
      const nonce = SiweAuthService.generateNonce();

      const token = SiweAuthService.createJwtToken(address, chainId, nonce);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should verify valid JWT token', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const chainId = 33529;
      const nonce = SiweAuthService.generateNonce();

      const token = SiweAuthService.createJwtToken(address, chainId, nonce);
      const result = SiweAuthService.verifyJwtToken(token);

      expect(result.valid).toBe(true);
      expect(result.address).toBe(address.toLowerCase());
      expect(result.chainId).toBe(chainId);
    });

    it('should reject invalid JWT token', () => {
      const result = SiweAuthService.verifyJwtToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should extract Bearer token from Authorization header', () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;

      const extracted = SiweAuthService.extractBearerToken(authHeader);

      expect(extracted).toBe(token);
    });

    it('should return null for invalid Bearer format', () => {
      const extracted = SiweAuthService.extractBearerToken('Invalid Bearer format');

      expect(extracted).toBeNull();
    });
  });

  describe('Active Nonce Count', () => {
    it('should return active nonce count', () => {
      // Generate some nonces
      SiweAuthService.generateNonce();
      SiweAuthService.generateNonce();

      const count = SiweAuthService.getActiveNonceCount();

      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Access Control Service', () => {
  beforeEach(() => {
    // Clear ACLs before each test
    AccessControlService.clearAll();
  });

  describe('Bucket Policy Management', () => {
    it('should create bucket policy with owner', () => {
      const bucket = 'test-bucket';
      const owner = '0x1234567890123456789012345678901234567890';

      const policy = AccessControlService.createBucketPolicy(bucket, owner);

      expect(policy).toBeDefined();
      expect(policy.bucket).toBe(bucket);
      expect(policy.owner).toBe(owner.toLowerCase());
      expect(policy.acl).toHaveLength(1);
      expect(policy.acl[0].role).toBe(S3Role.OWNER);
    });

    it('should get bucket policy', () => {
      const bucket = 'test-bucket';
      const owner = '0x1234567890123456789012345678901234567890';

      AccessControlService.createBucketPolicy(bucket, owner);
      const policy = AccessControlService.getBucketPolicy(bucket);

      expect(policy).toBeDefined();
      expect(policy?.bucket).toBe(bucket);
    });

    it('should delete bucket policy', () => {
      const bucket = 'test-bucket';
      const owner = '0x1234567890123456789012345678901234567890';

      AccessControlService.createBucketPolicy(bucket, owner);
      const deleted = AccessControlService.deleteBucketPolicy(bucket);

      expect(deleted).toBe(true);
      expect(AccessControlService.getBucketPolicy(bucket)).toBeUndefined();
    });
  });

  describe('Access Control', () => {
    const bucket = 'test-bucket';
    const owner = '0x1111111111111111111111111111111111111111';
    const user = '0x2222222222222222222222222222222222222222';

    beforeEach(() => {
      AccessControlService.createBucketPolicy(bucket, owner);
    });

    it('should grant access to wallet', () => {
      const granted = AccessControlService.grantAccess(
        bucket,
        user,
        S3Role.WRITE,
        owner
      );

      expect(granted).toBe(true);

      const role = AccessControlService.getWalletRole(bucket, user);
      expect(role).toBe(S3Role.WRITE);
    });

    it('should revoke access from wallet', () => {
      AccessControlService.grantAccess(bucket, user, S3Role.WRITE, owner);

      const revoked = AccessControlService.revokeAccess(bucket, user, owner);

      expect(revoked).toBe(true);

      const role = AccessControlService.getWalletRole(bucket, user);
      expect(role).toBe(S3Role.NONE);
    });

    it('should not allow revoking owner access', () => {
      const revoked = AccessControlService.revokeAccess(bucket, owner, owner);

      expect(revoked).toBe(false);
    });

    it('should check specific permissions', () => {
      AccessControlService.grantAccess(bucket, user, S3Role.WRITE, owner);

      expect(AccessControlService.hasPermission(bucket, user, S3Permission.READ)).toBe(true);
      expect(AccessControlService.hasPermission(bucket, user, S3Permission.WRITE)).toBe(true);
      expect(AccessControlService.hasPermission(bucket, user, S3Permission.DELETE)).toBe(false);
    });

    it('should check owner has full control', () => {
      expect(AccessControlService.hasPermission(bucket, owner, S3Permission.READ)).toBe(true);
      expect(AccessControlService.hasPermission(bucket, owner, S3Permission.WRITE)).toBe(true);
      expect(AccessControlService.hasPermission(bucket, owner, S3Permission.DELETE)).toBe(true);
      expect(AccessControlService.hasPermission(bucket, owner, S3Permission.WRITE_ACP)).toBe(true);
    });

    it('should get wallet permissions', () => {
      AccessControlService.grantAccess(bucket, user, S3Role.READ, owner);

      const permissions = AccessControlService.getWalletPermissions(bucket, user);

      expect(permissions).toContain(S3Permission.READ);
      expect(permissions).not.toContain(S3Permission.WRITE);
    });

    it('should list accessible buckets for wallet', () => {
      const bucket2 = 'test-bucket-2';
      AccessControlService.createBucketPolicy(bucket2, owner);

      AccessControlService.grantAccess(bucket, user, S3Role.READ, owner);
      AccessControlService.grantAccess(bucket2, user, S3Role.WRITE, owner);

      const buckets = AccessControlService.listAccessibleBuckets(user);

      expect(buckets).toContain(bucket);
      expect(buckets).toContain(bucket2);
      expect(buckets).toHaveLength(2);
    });
  });

  describe('Bucket ACL Management', () => {
    const bucket = 'test-bucket';
    const owner = '0x1111111111111111111111111111111111111111';
    const user = '0x2222222222222222222222222222222222222222';

    beforeEach(() => {
      AccessControlService.createBucketPolicy(bucket, owner);
    });

    it('should get bucket ACL with READ_ACP permission', () => {
      const acl = AccessControlService.getBucketAcl(bucket, owner);

      expect(acl).toBeDefined();
      expect(acl).toHaveLength(1);
    });

    it('should return null for ACL without READ_ACP permission', () => {
      AccessControlService.grantAccess(bucket, user, S3Role.READ, owner);

      const acl = AccessControlService.getBucketAcl(bucket, user);

      expect(acl).toBeNull();
    });
  });

  describe('Ownership Transfer', () => {
    const bucket = 'test-bucket';
    const owner = '0x1111111111111111111111111111111111111111';
    const newOwner = '0x2222222222222222222222222222222222222222';

    beforeEach(() => {
      AccessControlService.createBucketPolicy(bucket, owner);
    });

    it('should transfer ownership', () => {
      const transferred = AccessControlService.transferOwnership(
        bucket,
        newOwner,
        owner
      );

      expect(transferred).toBe(true);

      const policy = AccessControlService.getBucketPolicy(bucket);
      expect(policy?.owner).toBe(newOwner.toLowerCase());
    });

    it('should not allow non-owner to transfer ownership', () => {
      const transferred = AccessControlService.transferOwnership(
        bucket,
        newOwner,
        '0x3333333333333333333333333333333333333333'
      );

      expect(transferred).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', () => {
      const bucket1 = 'bucket-1';
      const bucket2 = 'bucket-2';
      const owner = '0x1111111111111111111111111111111111111111';

      AccessControlService.createBucketPolicy(bucket1, owner);
      AccessControlService.createBucketPolicy(bucket2, owner);

      const stats = AccessControlService.getStats();

      expect(stats.totalBuckets).toBe(2);
      expect(stats.totalAclEntries).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    AccessControlService.clearAll();
  });

  it('should support complete authentication flow', async () => {
    const address = '0x1234567890123456789012345678901234567890';
    const bucket = 'test-bucket';

    // 1. Create bucket policy
    AccessControlService.createBucketPolicy(bucket, address);

    // 2. Check owner permissions
    expect(AccessControlService.hasPermission(bucket, address, S3Permission.WRITE)).toBe(true);

    // 3. Generate nonce
    const nonce = SiweAuthService.generateNonce();
    expect(nonce).toBeDefined();

    // 4. Create JWT token
    const token = SiweAuthService.createJwtToken(address, 33529, nonce);
    expect(token).toBeDefined();

    // 5. Verify JWT token
    const result = SiweAuthService.verifyJwtToken(token);
    expect(result.valid).toBe(true);
    expect(result.address).toBe(address.toLowerCase());

    // 6. Grant access to another user
    const user = '0x2222222222222222222222222222222222222222';
    AccessControlService.grantAccess(bucket, user, S3Role.READ, address);

    // 7. Verify user permissions
    expect(AccessControlService.hasPermission(bucket, user, S3Permission.READ)).toBe(true);
    expect(AccessControlService.hasPermission(bucket, user, S3Permission.WRITE)).toBe(false);
  });
});
