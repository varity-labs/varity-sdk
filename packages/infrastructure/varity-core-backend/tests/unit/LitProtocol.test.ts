/**
 * Lit Protocol Client Unit Tests - Comprehensive Test Suite
 * Week 1-2: Storage Layer Verification
 *
 * Tests Lit Protocol encryption and access control for:
 * - Layer 1: Varity Internal (admin-only access)
 * - Layer 2: Industry RAG (industry-wide access)
 * - Layer 3: Customer Data (customer-only + emergency access)
 */

import { LitProtocolClient, AccessControlBuilder, EncryptionResult, AuthSignature } from '../../src/crypto/LitProtocol';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import * as LitJsSdk from '@lit-protocol/encryption';
import { ethers } from 'ethers';

// Mock Lit Protocol SDK
jest.mock('@lit-protocol/lit-node-client');
jest.mock('@lit-protocol/encryption');
jest.mock('@lit-protocol/auth-helpers', () => ({
  createSiweMessage: jest.fn().mockResolvedValue('mock-siwe-message'),
  generateAuthSig: jest.fn(),
  LitAbility: { LitActionExecution: 'lit-action-execution' },
  LitActionResource: jest.fn().mockImplementation((resource) => ({ resource })),
}));
jest.mock('ethers');

describe('LitProtocolClient - Comprehensive Test Suite', () => {
  let litClient: LitProtocolClient;
  let mockLitNodeClient: jest.Mocked<LitNodeClient>;

  beforeEach(() => {
    // Mock LitNodeClient
    mockLitNodeClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      ready: Promise.resolve(true),
      getLatestBlockhash: jest.fn().mockResolvedValue('mock-blockhash'),
    } as any;

    (LitNodeClient as jest.MockedClass<typeof LitNodeClient>).mockImplementation(() => mockLitNodeClient);

    litClient = new LitProtocolClient(LitNetwork.DatilTest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should connect to DatilTest network', async () => {
      await litClient.initialize();

      expect(LitNodeClient).toHaveBeenCalledWith({
        litNetwork: LitNetwork.DatilTest,
        debug: false,
      });
      expect(mockLitNodeClient.connect).toHaveBeenCalled();
    });

    it('should not reinitialize if already connected', async () => {
      await litClient.initialize();
      await litClient.initialize();

      expect(mockLitNodeClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should generate auth signature', async () => {
      const mockWallet = {
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        signMessage: jest.fn().mockResolvedValue('mock-signature'),
      };

      (ethers.Wallet as any).mockImplementation(() => mockWallet);

      await litClient.initialize();
      const authSig = await litClient.generateAuthSignature('0xprivatekey');

      expect(authSig).toBeDefined();
      expect(authSig.sig).toBe('mock-signature');
      expect(authSig.address).toBe('0x1234567890123456789012345678901234567890');
      expect(authSig.derivedVia).toBe('web3.eth.personal.sign');
    });
  });

  describe('Encryption - Wallet Ownership', () => {
    it('should encrypt with single wallet ACL', async () => {
      const mockEncryptResult = {
        ciphertext: 'encrypted-data-base64',
        dataToEncryptHash: 'hash-of-encrypted-data',
      };

      (LitJsSdk.encryptString as jest.Mock).mockResolvedValue(mockEncryptResult);

      await litClient.initialize();

      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xSingleWallet',
          },
        },
      ];

      const result = await litClient.encryptData(
        'sensitive data',
        accessControlConditions,
        'ethereum'
      );

      expect(result).toBeDefined();
      expect(result.ciphertext).toBe('encrypted-data-base64');
      expect(result.dataToEncryptHash).toBe('hash-of-encrypted-data');
      expect(LitJsSdk.encryptString).toHaveBeenCalled();
    });

    it('should encrypt with multiple wallet OR condition', async () => {
      const mockEncryptResult = {
        ciphertext: 'multi-wallet-encrypted',
        dataToEncryptHash: 'multi-wallet-hash',
      };

      (LitJsSdk.encryptString as jest.Mock).mockResolvedValue(mockEncryptResult);

      await litClient.initialize();

      const builder = new AccessControlBuilder();
      const conditions = builder
        .walletOwnership('0xWallet1', 'ethereum')
        .or()
        .walletOwnership('0xWallet2', 'ethereum')
        .or()
        .walletOwnership('0xWallet3', 'ethereum')
        .build();

      const result = await litClient.encryptData('multi-owner data', conditions);

      expect(result.ciphertext).toBe('multi-wallet-encrypted');
      expect(conditions).toHaveLength(5); // 3 conditions + 2 operators
    });

    it('should decrypt with valid wallet', async () => {
      const mockDecryptResult = 'decrypted plaintext data';

      (LitJsSdk.decryptToString as jest.Mock).mockResolvedValue(mockDecryptResult);

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'valid-signature',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xValidWallet',
      };

      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xValidWallet',
          },
        },
      ];

      const result = await litClient.decryptData(
        'encrypted-ciphertext',
        'data-hash',
        accessControlConditions,
        authSig,
        'ethereum'
      );

      expect(result.decryptedData).toBe('decrypted plaintext data');
      expect(LitJsSdk.decryptToString).toHaveBeenCalled();
    });

    it('should reject invalid wallet', async () => {
      (LitJsSdk.decryptToString as jest.Mock).mockRejectedValue(
        new Error('not authorized to decrypt')
      );

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'invalid-signature',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xInvalidWallet',
      };

      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xValidWallet',
          },
        },
      ];

      await expect(
        litClient.decryptData('ciphertext', 'hash', accessControlConditions, authSig)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('Encryption - NFT Ownership', () => {
    it('should encrypt with NFT ownership ACL', async () => {
      const mockEncryptResult = {
        ciphertext: 'nft-encrypted',
        dataToEncryptHash: 'nft-hash',
      };

      (LitJsSdk.encryptString as jest.Mock).mockResolvedValue(mockEncryptResult);

      await litClient.initialize();

      const builder = new AccessControlBuilder();
      const conditions = builder.nftOwnership('0xNFTContract', '123', 'ethereum').build();

      const result = await litClient.encryptData('nft-gated data', conditions);

      expect(result.ciphertext).toBe('nft-encrypted');
      expect(conditions[0].standardContractType).toBe('ERC721');
      expect(conditions[0].method).toBe('ownerOf');
    });

    it('should verify NFT ownership for decryption', async () => {
      const mockDecryptResult = 'nft-gated content';

      (LitJsSdk.decryptToString as jest.Mock).mockResolvedValue(mockDecryptResult);

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'nft-owner-sig',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xNFTOwner',
      };

      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '0xNFTContract',
          standardContractType: 'ERC721',
          chain: 'ethereum',
          method: 'ownerOf',
          parameters: ['123'],
          returnValueTest: {
            comparator: '=',
            value: ':userAddress',
          },
        },
      ];

      const result = await litClient.decryptData('nft-ciphertext', 'nft-hash', accessControlConditions, authSig);

      expect(result.decryptedData).toBe('nft-gated content');
    });
  });

  describe('Encryption - Contract Calls', () => {
    it('should encrypt with contract call ACL', async () => {
      const mockEncryptResult = {
        ciphertext: 'contract-encrypted',
        dataToEncryptHash: 'contract-hash',
      };

      (LitJsSdk.encryptString as jest.Mock).mockResolvedValue(mockEncryptResult);

      await litClient.initialize();

      const builder = new AccessControlBuilder();
      const conditions = builder
        .customContract(
          '0xCustomContract',
          'hasAccess',
          [':userAddress'],
          { comparator: '=', value: 'true' },
          'ethereum'
        )
        .build();

      const result = await litClient.encryptData('contract-gated data', conditions);

      expect(result.ciphertext).toBe('contract-encrypted');
      expect(conditions[0].conditionType).toBe('evmContract');
      expect(conditions[0].functionName).toBe('hasAccess');
    });

    it('should verify contract state for decryption', async () => {
      const mockDecryptResult = 'contract-verified content';

      (LitJsSdk.decryptToString as jest.Mock).mockResolvedValue(mockDecryptResult);

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'contract-user-sig',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xContractUser',
      };

      const accessControlConditions = [
        {
          conditionType: 'evmContract',
          contractAddress: '0xAccessContract',
          functionName: 'isAuthorized',
          functionParams: [':userAddress'],
          chain: 'ethereum',
          returnValueTest: {
            comparator: '=',
            value: 'true',
          },
        },
      ];

      const result = await litClient.decryptData(
        'contract-ciphertext',
        'contract-hash',
        accessControlConditions,
        authSig
      );

      expect(result.decryptedData).toBe('contract-verified content');
    });
  });

  describe('Layer-Specific ACLs', () => {
    it('should build Layer 1 ACL (varity-admins-only)', async () => {
      const adminWallets = ['0xAdmin1', '0xAdmin2', '0xAdmin3'];

      const conditions = litClient.createVarityInternalConditions(adminWallets, 'ethereum');

      expect(conditions).toBeDefined();
      expect(conditions.length).toBeGreaterThan(adminWallets.length); // Includes OR operators
    });

    it('should build Layer 2 ACL (industry-customers)', async () => {
      const industryRegistryContract = '0xIndustryRegistry';
      const industry = 'finance';

      const conditions = litClient.createIndustryRagConditions(industryRegistryContract, industry, 'ethereum');

      expect(conditions).toBeDefined();
      expect(conditions[0].contractAddress).toBe(industryRegistryContract);
      expect(conditions[0].functionParams).toContain(industry);
    });

    it('should build Layer 3 ACL (customer-only)', async () => {
      const customerWallet = '0xCustomer123';
      const emergencyWallets = ['0xEmergency1', '0xEmergency2'];

      const conditions = litClient.createCustomerDataConditions(
        customerWallet,
        emergencyWallets,
        'ethereum'
      );

      expect(conditions).toBeDefined();
      // Should have customer wallet + emergency wallets with OR operators
      expect(conditions.length).toBeGreaterThan(emergencyWallets.length);
    });

    it('should reject Layer 1 without admin wallets', () => {
      expect(() => {
        litClient.createVarityInternalConditions([], 'ethereum');
      }).toThrow('At least one admin wallet is required');
    });
  });

  describe('Time-Locked Access', () => {
    it('should encrypt with time lock', async () => {
      const mockEncryptResult = {
        ciphertext: 'timelocked-encrypted',
        dataToEncryptHash: 'timelocked-hash',
      };

      (LitJsSdk.encryptString as jest.Mock).mockResolvedValue(mockEncryptResult);

      await litClient.initialize();

      const expirationTimestamp = Math.floor(Date.now() / 1000) + 86400; // +24 hours
      const builder = new AccessControlBuilder();
      const conditions = builder
        .walletOwnership('0xTimelockWallet', 'ethereum')
        .and()
        .timelock(expirationTimestamp, 'ethereum')
        .build();

      const result = await litClient.encryptData('timelocked data', conditions);

      expect(result.ciphertext).toBe('timelocked-encrypted');
      expect(conditions).toContainEqual({ operator: 'and' });
    });

    it('should reject decryption before unlock time', async () => {
      (LitJsSdk.decryptToString as jest.Mock).mockRejectedValue(
        new Error('Timelock not yet expired')
      );

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'early-access-sig',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xEarlyWallet',
      };

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // Future
      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: 'eth_getBlockByNumber',
          parameters: ['latest'],
          returnValueTest: {
            comparator: '<=',
            value: futureTimestamp.toString(),
          },
        },
      ];

      await expect(
        litClient.decryptData('timelocked-ciphertext', 'timelocked-hash', accessControlConditions, authSig)
      ).rejects.toThrow();
    });

    it('should allow decryption after unlock time', async () => {
      const mockDecryptResult = 'unlocked content';

      (LitJsSdk.decryptToString as jest.Mock).mockResolvedValue(mockDecryptResult);

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'unlocked-sig',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xUnlockedWallet',
      };

      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // Past
      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: 'eth_getBlockByNumber',
          parameters: ['latest'],
          returnValueTest: {
            comparator: '<=',
            value: pastTimestamp.toString(),
          },
        },
      ];

      const result = await litClient.decryptData(
        'timelocked-ciphertext',
        'timelocked-hash',
        accessControlConditions,
        authSig
      );

      expect(result.decryptedData).toBe('unlocked content');
    });
  });

  describe('Buffer Encryption/Decryption', () => {
    it('should encrypt buffer data', async () => {
      const mockEncryptResult = {
        ciphertext: 'buffer-encrypted',
        dataToEncryptHash: 'buffer-hash',
      };

      (LitJsSdk.encryptString as jest.Mock).mockResolvedValue(mockEncryptResult);

      await litClient.initialize();

      const buffer = Buffer.from('binary file data');
      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xBufferWallet',
          },
        },
      ];

      const result = await litClient.encryptBuffer(buffer, accessControlConditions, 'ethereum');

      expect(result.ciphertext).toBe('buffer-encrypted');
      // Should have base64 encoded the buffer
      expect(LitJsSdk.encryptString).toHaveBeenCalledWith(
        expect.objectContaining({
          dataToEncrypt: buffer.toString('base64'),
        }),
        expect.any(Object)
      );
    });

    it('should decrypt to buffer', async () => {
      const originalData = Buffer.from('original binary data');
      const base64Data = originalData.toString('base64');

      (LitJsSdk.decryptToString as jest.Mock).mockResolvedValue(base64Data);

      await litClient.initialize();

      const authSig: AuthSignature = {
        sig: 'buffer-sig',
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: 'SIWE message',
        address: '0xBufferWallet',
      };

      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xBufferWallet',
          },
        },
      ];

      const result = await litClient.decryptToBuffer(
        'buffer-ciphertext',
        'buffer-hash',
        accessControlConditions,
        authSig,
        'ethereum'
      );

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('original binary data');
    });
  });

  describe('Access Verification', () => {
    it('should verify wallet meets access conditions', async () => {
      const walletAddress = '0xAuthorizedWallet';
      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xAuthorizedWallet',
          },
        },
      ];

      const hasAccess = await litClient.verifyAccess(walletAddress, accessControlConditions);

      expect(hasAccess).toBe(true);
    });

    it('should reject unauthorized wallet', async () => {
      const walletAddress = '0xUnauthorizedWallet';
      const accessControlConditions = [
        {
          conditionType: 'evmBasic',
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: '0xAuthorizedWallet',
          },
        },
      ];

      const hasAccess = await litClient.verifyAccess(walletAddress, accessControlConditions);

      expect(hasAccess).toBe(false);
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate decryption costs', () => {
      const decryptionsPerMonth = 10000;
      const cost = litClient.estimateDecryptionCost(decryptionsPerMonth);

      expect(cost).toBe(1.0); // $0.0001 × 10,000
    });

    it('should calculate costs for different usage levels', () => {
      const testCases = [
        { decryptions: 1000, expected: 0.1 },
        { decryptions: 10000, expected: 1.0 },
        { decryptions: 100000, expected: 10.0 },
      ];

      testCases.forEach(({ decryptions, expected }) => {
        const cost = litClient.estimateDecryptionCost(decryptions);
        expect(cost).toBe(expected);
      });
    });
  });

  describe('Network Information', () => {
    it('should return network info', async () => {
      await litClient.initialize();

      const info = litClient.getNetworkInfo();

      expect(info.network).toBe(LitNetwork.DatilTest);
      expect(info.initialized).toBe(true);
    });

    it('should show uninitialized state', () => {
      const info = litClient.getNetworkInfo();

      expect(info.initialized).toBe(false);
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from Lit Protocol network', async () => {
      await litClient.initialize();
      await litClient.disconnect();

      expect(mockLitNodeClient.disconnect).toHaveBeenCalled();

      const info = litClient.getNetworkInfo();
      expect(info.initialized).toBe(false);
    });

    it('should handle disconnect when not connected', async () => {
      await litClient.disconnect();

      expect(mockLitNodeClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('AccessControlBuilder', () => {
    it('should build single condition', () => {
      const builder = new AccessControlBuilder();
      const conditions = builder.walletOwnership('0xWallet', 'ethereum').build();

      expect(conditions).toHaveLength(1);
      expect(conditions[0].returnValueTest.value).toBe('0xwallet');
    });

    it('should build OR conditions', () => {
      const builder = new AccessControlBuilder();
      const conditions = builder
        .walletOwnership('0xWallet1', 'ethereum')
        .or()
        .walletOwnership('0xWallet2', 'ethereum')
        .build();

      expect(conditions).toHaveLength(3); // condition, operator, condition
      expect(conditions[1]).toEqual({ operator: 'or' });
    });

    it('should build AND conditions', () => {
      const builder = new AccessControlBuilder();
      const conditions = builder
        .walletOwnership('0xWallet', 'ethereum')
        .and()
        .tokenBalance('0xTokenContract', '1000000', 'ethereum')
        .build();

      expect(conditions).toHaveLength(3);
      expect(conditions[1]).toEqual({ operator: 'and' });
    });

    it('should throw error with no conditions', () => {
      const builder = new AccessControlBuilder();

      expect(() => builder.build()).toThrow('At least one access control condition is required');
    });
  });
});
