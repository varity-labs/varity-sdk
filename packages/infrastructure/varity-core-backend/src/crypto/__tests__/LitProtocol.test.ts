/**
 * Unit Tests for Lit Protocol Client
 * PROPRIETARY - DO NOT DISTRIBUTE
 */

import LitProtocolClient, { AccessControlBuilder } from '../LitProtocol';
import { AccessControlManager, VarityAccessPresets } from '../access-control';
import { ethers } from 'ethers';

describe('LitProtocolClient', () => {
  let litClient: LitProtocolClient;
  let testWallet: ethers.Wallet;

  beforeAll(() => {
    // Create test wallet
    testWallet = ethers.Wallet.createRandom();
  });

  beforeEach(() => {
    litClient = new LitProtocolClient();
  });

  afterEach(async () => {
    if (litClient) {
      await litClient.disconnect();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await litClient.initialize();
      const info = litClient.getNetworkInfo();
      expect(info.initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      await litClient.initialize();
      await litClient.initialize(); // Should not throw
      const info = litClient.getNetworkInfo();
      expect(info.initialized).toBe(true);
    });
  });

  describe('Authentication Signature', () => {
    it('should generate auth signature', async () => {
      await litClient.initialize();
      const authSig = await litClient.generateAuthSignature(
        testWallet.privateKey
      );

      expect(authSig).toHaveProperty('sig');
      expect(authSig).toHaveProperty('derivedVia');
      expect(authSig).toHaveProperty('signedMessage');
      expect(authSig).toHaveProperty('address');
      expect(authSig.address.toLowerCase()).toBe(testWallet.address.toLowerCase());
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt string data', async () => {
      await litClient.initialize();

      const testData = 'Hello, Varity encrypted world!';
      const accessConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: testWallet.address.toLowerCase(),
          },
        },
      ];

      // Encrypt
      const encrypted = await litClient.encryptData(
        testData,
        accessConditions,
        'ethereum'
      );

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.dataToEncryptHash).toBeDefined();
      expect(encrypted.accessControlConditions).toEqual(accessConditions);

      // Generate auth signature
      const authSig = await litClient.generateAuthSignature(
        testWallet.privateKey
      );

      // Decrypt
      const decrypted = await litClient.decryptData(
        encrypted.ciphertext,
        encrypted.dataToEncryptHash,
        encrypted.accessControlConditions,
        authSig,
        'ethereum'
      );

      expect(decrypted.decryptedData).toBe(testData);
    }, 30000); // 30 second timeout for network operations

    it('should encrypt and decrypt buffer data', async () => {
      await litClient.initialize();

      const testBuffer = Buffer.from('Binary data for testing');
      const accessConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: testWallet.address.toLowerCase(),
          },
        },
      ];

      // Encrypt
      const encrypted = await litClient.encryptBuffer(
        testBuffer,
        accessConditions,
        'ethereum'
      );

      // Generate auth signature
      const authSig = await litClient.generateAuthSignature(
        testWallet.privateKey
      );

      // Decrypt
      const decrypted = await litClient.decryptToBuffer(
        encrypted.ciphertext,
        encrypted.dataToEncryptHash,
        encrypted.accessControlConditions,
        authSig,
        'ethereum'
      );

      expect(decrypted.equals(testBuffer)).toBe(true);
    }, 30000);

    it('should deny access for unauthorized wallet', async () => {
      await litClient.initialize();

      const testData = 'Secret data';
      const authorizedWallet = ethers.Wallet.createRandom();
      const unauthorizedWallet = ethers.Wallet.createRandom();

      const accessConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: authorizedWallet.address.toLowerCase(),
          },
        },
      ];

      // Encrypt with authorized wallet
      const encrypted = await litClient.encryptData(
        testData,
        accessConditions,
        'ethereum'
      );

      // Try to decrypt with unauthorized wallet
      const unauthorizedAuthSig = await litClient.generateAuthSignature(
        unauthorizedWallet.privateKey
      );

      await expect(
        litClient.decryptData(
          encrypted.ciphertext,
          encrypted.dataToEncryptHash,
          encrypted.accessControlConditions,
          unauthorizedAuthSig,
          'ethereum'
        )
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Access Control Conditions', () => {
    it('should create Varity internal conditions', () => {
      const adminWallets = [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
      ];

      const conditions = litClient.createVarityInternalConditions(
        adminWallets,
        'ethereum'
      );

      expect(conditions.length).toBe(3); // 2 conditions + 1 OR operator
      expect(conditions[0].returnValueTest.value).toBe(adminWallets[0].toLowerCase());
      expect(conditions[1].operator).toBe('or');
      expect(conditions[2].returnValueTest.value).toBe(adminWallets[1].toLowerCase());
    });

    it('should create customer data conditions with emergency wallets', () => {
      const customerWallet = '0x1234567890123456789012345678901234567890';
      const emergencyWallets = [
        '0x0987654321098765432109876543210987654321',
      ];

      const conditions = litClient.createCustomerDataConditions(
        customerWallet,
        emergencyWallets,
        'ethereum'
      );

      expect(conditions.length).toBe(3); // customer + OR + emergency
      expect(conditions[0].returnValueTest.value).toBe(customerWallet.toLowerCase());
    });

    it('should create temporary access conditions', () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      const expirationTimestamp = Date.now() + 86400000; // 24 hours

      const conditions = litClient.createTemporaryAccessConditions(
        walletAddress,
        expirationTimestamp,
        'ethereum'
      );

      expect(conditions.length).toBe(3); // wallet + AND + timelock
      expect(conditions[1].operator).toBe('and');
    });

    it('should create NFT-gated access conditions', () => {
      const nftContract = '0x1234567890123456789012345678901234567890';
      const tokenId = '1';

      const conditions = litClient.createNFTGatedConditions(
        nftContract,
        tokenId,
        'ethereum'
      );

      expect(conditions.length).toBe(1);
      expect(conditions[0].contractAddress).toBe(nftContract);
      expect(conditions[0].standardContractType).toBe('ERC721');
    });
  });

  describe('Access Verification', () => {
    it('should verify wallet has access', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      const conditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: walletAddress.toLowerCase(),
          },
        },
      ];

      const hasAccess = await litClient.verifyAccess(walletAddress, conditions);
      expect(hasAccess).toBe(true);
    });

    it('should verify wallet does not have access', async () => {
      const authorizedWallet = '0x1234567890123456789012345678901234567890';
      const unauthorizedWallet = '0x0987654321098765432109876543210987654321';

      const conditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: authorizedWallet.toLowerCase(),
          },
        },
      ];

      const hasAccess = await litClient.verifyAccess(unauthorizedWallet, conditions);
      expect(hasAccess).toBe(false);
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate decryption costs', () => {
      const decryptionsPerMonth = 10000;
      const cost = litClient.estimateDecryptionCost(decryptionsPerMonth);

      expect(cost).toBe(1.0); // 10000 * $0.0001 = $1.00
    });
  });
});

describe('AccessControlBuilder', () => {
  let builder: AccessControlBuilder;

  beforeEach(() => {
    builder = new AccessControlBuilder();
  });

  describe('Wallet Ownership', () => {
    it('should add wallet ownership condition', () => {
      const wallet = '0x1234567890123456789012345678901234567890';
      const conditions = builder.walletOwnership(wallet, 'ethereum').build();

      expect(conditions.length).toBe(1);
      expect(conditions[0].returnValueTest.value).toBe(wallet.toLowerCase());
    });

    it('should add multiple wallets with OR', () => {
      const wallet1 = '0x1234567890123456789012345678901234567890';
      const wallet2 = '0x0987654321098765432109876543210987654321';

      const conditions = builder
        .walletOwnership(wallet1, 'ethereum')
        .or()
        .walletOwnership(wallet2, 'ethereum')
        .build();

      expect(conditions.length).toBe(3); // wallet1 + OR + wallet2
      expect(conditions[1].operator).toBe('or');
    });
  });

  describe('NFT Ownership', () => {
    it('should add NFT ownership condition', () => {
      const nftContract = '0x1234567890123456789012345678901234567890';
      const tokenId = '1';

      const conditions = builder
        .nftOwnership(nftContract, tokenId, 'ethereum')
        .build();

      expect(conditions.length).toBe(1);
      expect(conditions[0].contractAddress).toBe(nftContract);
      expect(conditions[0].method).toBe('ownerOf');
    });
  });

  describe('Token Balance', () => {
    it('should add token balance condition', () => {
      const tokenContract = '0x1234567890123456789012345678901234567890';
      const minBalance = '1000000000000000000'; // 1 token

      const conditions = builder
        .tokenBalance(tokenContract, minBalance, 'ethereum')
        .build();

      expect(conditions.length).toBe(1);
      expect(conditions[0].method).toBe('balanceOf');
      expect(conditions[0].returnValueTest.comparator).toBe('>=');
    });
  });

  describe('Timelock', () => {
    it('should add timelock condition', () => {
      const expirationTimestamp = Date.now() + 86400000;

      const conditions = builder
        .timelock(expirationTimestamp, 'ethereum')
        .build();

      expect(conditions.length).toBe(1);
      expect(conditions[0].method).toBe('eth_getBlockByNumber');
    });
  });

  describe('Complex Conditions', () => {
    it('should build complex AND/OR conditions', () => {
      const wallet1 = '0x1234567890123456789012345678901234567890';
      const wallet2 = '0x0987654321098765432109876543210987654321';
      const expirationTimestamp = Date.now() + 86400000;

      const conditions = builder
        .walletOwnership(wallet1, 'ethereum')
        .or()
        .walletOwnership(wallet2, 'ethereum')
        .and()
        .timelock(expirationTimestamp, 'ethereum')
        .build();

      expect(conditions.length).toBe(5); // wallet1 + OR + wallet2 + AND + timelock
    });
  });
});

describe('AccessControlManager', () => {
  let manager: AccessControlManager;

  beforeEach(() => {
    manager = new AccessControlManager('ethereum');
  });

  describe('Layer 1: Varity Internal', () => {
    it('should create admin-only access', () => {
      const adminWallets = [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
      ];

      const conditions = manager.createAccessControl({
        layer: 'varity-internal',
        adminWallets,
      });

      expect(conditions.length).toBe(3); // 2 admins + 1 OR
    });

    it('should throw error without admin wallets', () => {
      expect(() => {
        manager.createAccessControl({
          layer: 'varity-internal',
        });
      }).toThrow();
    });
  });

  describe('Layer 2: Industry RAG', () => {
    it('should create industry-shared access', () => {
      const conditions = manager.createAccessControl({
        layer: 'industry-rag',
        primaryWallet: '0x1234567890123456789012345678901234567890',
        adminWallets: ['0x0987654321098765432109876543210987654321'],
      });

      expect(conditions.length).toBe(3); // primary + OR + admin
    });
  });

  describe('Layer 3: Customer Data', () => {
    it('should create customer private access', () => {
      const conditions = manager.createAccessControl({
        layer: 'customer-data',
        primaryWallet: '0x1234567890123456789012345678901234567890',
        emergencyWallets: ['0x0987654321098765432109876543210987654321'],
      });

      expect(conditions.length).toBe(3); // customer + OR + emergency
    });

    it('should throw error without primary wallet', () => {
      expect(() => {
        manager.createAccessControl({
          layer: 'customer-data',
        });
      }).toThrow();
    });
  });
});

describe('VarityAccessPresets', () => {
  it('should create admin-only preset', () => {
    const adminWallets = ['0x1234567890123456789012345678901234567890'];
    const conditions = VarityAccessPresets.adminOnly(adminWallets);

    expect(conditions.length).toBe(1);
  });

  it('should create customer private preset', () => {
    const customerWallet = '0x1234567890123456789012345678901234567890';
    const emergencyWallets = ['0x0987654321098765432109876543210987654321'];

    const conditions = VarityAccessPresets.customerPrivate(
      customerWallet,
      emergencyWallets
    );

    expect(conditions.length).toBe(3);
  });

  it('should create temporary customer access preset', () => {
    const customerWallet = '0x1234567890123456789012345678901234567890';
    const expirationTimestamp = Date.now() + 86400000;

    const conditions = VarityAccessPresets.temporaryCustomerAccess(
      customerWallet,
      expirationTimestamp
    );

    expect(conditions.length).toBeGreaterThan(1);
  });
});
