/**
 * Comprehensive Test Suite for Varity Client
 */

import { VarityClient } from '../VarityClient';
import {
  formatUSDC,
  parseUSDC,
  getUSDCAmount,
  isValidAddress,
  shortenAddress,
  getChainName,
} from '../utils/formatting';

// Mock Thirdweb SDK
jest.mock('thirdweb', () => ({
  createThirdwebClient: jest.fn(() => ({ clientId: 'test' })),
  defineChain: jest.fn((config) => ({
    id: config.id,
    name: config.name,
    rpc: config.rpc,
    nativeCurrency: config.nativeCurrency,
  })),
  getContract: jest.fn(),
  readContract: jest.fn(),
  sendTransaction: jest.fn(),
  upload: jest.fn(),
  download: jest.fn(),
  getWalletBalance: jest.fn(),
}));

jest.mock('thirdweb/wallets', () => ({
  createWallet: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe('VarityClient', () => {
  describe('Client Initialization', () => {
    test('should create client with default configuration', () => {
      const client = new VarityClient();

      expect(client).toBeDefined();
      expect(client.getChainId()).toBe(33529); // Varity L3
    });

    test('should create client with custom chain', () => {
      const client = new VarityClient({
        chain: 'arbitrum-sepolia',
      });

      expect(client.getChainId()).toBe(421614); // Arbitrum Sepolia
    });

    test('should create client with custom client ID', () => {
      const client = new VarityClient({
        clientId: 'custom-client-id',
      });

      expect(client).toBeDefined();
    });

    test('should identify Varity L3 correctly', () => {
      const clientL3 = new VarityClient({ chain: 'varity-l3' });
      const clientSepolia = new VarityClient({ chain: 'arbitrum-sepolia' });

      expect(clientL3.isVarityL3()).toBe(true);
      expect(clientSepolia.isVarityL3()).toBe(false);
    });

    test('should get correct chain configuration', () => {
      const client = new VarityClient({ chain: 'varity-l3' });
      const config = client.getConfig();

      expect(config.chainId).toBe(33529);
      expect(config.chainName).toBe('Varity L3');
      expect(config.isVarityL3).toBe(true);
      expect(config.nativeCurrency.symbol).toBe('USDC');
      expect(config.nativeCurrency.decimals).toBe(6);
    });
  });

  describe('USDC Formatting', () => {
    test('should format USDC correctly', () => {
      expect(formatUSDC(BigInt(1_000_000))).toBe('1.000000');
      expect(formatUSDC(BigInt(1_500_000))).toBe('1.500000');
      expect(formatUSDC(BigInt(100))).toBe('0.000100');
      expect(formatUSDC(BigInt(0))).toBe('0.000000');
    });

    test('should parse USDC correctly', () => {
      expect(parseUSDC('1')).toBe(BigInt(1_000_000));
      expect(parseUSDC('1.5')).toBe(BigInt(1_500_000));
      expect(parseUSDC('0.000001')).toBe(BigInt(1));
      expect(parseUSDC('10.5')).toBe(BigInt(10_500_000));
    });

    test('should handle USDC edge cases', () => {
      expect(formatUSDC(BigInt(0))).toBe('0.000000');
      expect(parseUSDC('0')).toBe(BigInt(0));
      expect(parseUSDC('0.000001')).toBe(BigInt(1));
    });

    test('should get USDC amount object', () => {
      const amount = getUSDCAmount(BigInt(1_500_000));

      expect(amount.raw).toBe(BigInt(1_500_000));
      expect(amount.formatted).toBe('1.500000');
      expect(amount.decimals).toBe(6);
    });

    test('should parse and format USDC round-trip', () => {
      const original = '2.5';
      const parsed = parseUSDC(original);
      const formatted = formatUSDC(parsed);

      expect(formatted).toBe('2.500000');
    });
  });

  describe('Address Utilities', () => {
    test('should validate addresses correctly', () => {
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });

    test('should shorten addresses correctly', () => {
      const address = '0x1234567890123456789012345678901234567890';

      expect(shortenAddress(address)).toBe('0x1234...7890');
      expect(shortenAddress(address, 6)).toBe('0x123456...567890');
    });

    test('should handle invalid addresses in shortening', () => {
      expect(shortenAddress('invalid')).toBe('invalid');
    });
  });

  describe('Chain Utilities', () => {
    test('should get correct chain names', () => {
      expect(getChainName(33529)).toBe('Varity L3');
      expect(getChainName(421614)).toBe('Arbitrum Sepolia');
      expect(getChainName(42161)).toBe('Arbitrum One');
      expect(getChainName(999999)).toContain('Chain 999999');
    });
  });

  describe('Client Managers', () => {
    test('should have contract manager', () => {
      const client = new VarityClient();
      expect(client.contracts).toBeDefined();
    });

    test('should have wallet manager', () => {
      const client = new VarityClient();
      expect(client.wallet).toBeDefined();
    });

    test('should have auth manager', () => {
      const client = new VarityClient();
      expect(client.auth).toBeDefined();
    });

    test('should have storage manager', () => {
      const client = new VarityClient();
      expect(client.storage).toBeDefined();
    });
  });
});

describe('WalletManager', () => {
  let client: VarityClient;

  beforeEach(() => {
    client = new VarityClient();
  });

  test('should check connection status', () => {
    expect(client.wallet.isConnected()).toBe(false);
  });

  test('should get null address when not connected', () => {
    expect(client.wallet.getAddress()).toBeNull();
  });

  test('should get null account when not connected', () => {
    expect(client.wallet.getAccount()).toBeNull();
  });
});

describe('SIWEAuth', () => {
  let client: VarityClient;

  beforeEach(() => {
    client = new VarityClient();
  });

  test('should generate SIWE message', async () => {
    const message = await client.auth.generateMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      statement: 'Sign in to example',
      uri: 'https://example.com',
    });

    expect(message).toContain('example.com');
    expect(message).toContain('0x1234567890123456789012345678901234567890');
    expect(message).toContain('Sign in to example');
  });

  test('should format SIWE message correctly', async () => {
    const message = await client.auth.generateMessage({
      domain: 'test.com',
      address: '0x0000000000000000000000000000000000000000',
      statement: 'Test statement',
    });

    expect(message).toContain('URI:');
    expect(message).toContain('Version:');
    expect(message).toContain('Chain ID:');
    expect(message).toContain('Nonce:');
    expect(message).toContain('Issued At:');
  });
});

describe('StorageManager', () => {
  let client: VarityClient;

  beforeEach(() => {
    client = new VarityClient();
  });

  test('should validate CIDs correctly', () => {
    const validCIDv0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
    const invalidCID = 'invalid-cid';

    expect(client.storage.isValidCID(validCIDv0)).toBe(true);
    expect(client.storage.isValidCID(invalidCID)).toBe(false);
  });

  test('should get gateway URL', () => {
    const cid = 'QmTest123';
    const url = client.storage.getGatewayUrl(cid);

    expect(url).toContain(cid);
    expect(url).toContain('ipfs');
  });

  test('should get IPFS URI', () => {
    const cid = 'QmTest123';
    const uri = client.storage.getIPFSUri(cid);

    expect(uri).toBe(`ipfs://${cid}`);
  });

  test('should handle CID with ipfs:// prefix', () => {
    const cid = 'ipfs://QmTest123';
    const uri = client.storage.getIPFSUri(cid);

    expect(uri).toBe('ipfs://QmTest123');
  });
});

describe('Error Handling', () => {
  test('should create custom errors', () => {
    const { VarityError, WalletError, ContractError } = require('../types');

    const varietyError = new VarityError('Test error', 'TEST_CODE');
    expect(varietyError.message).toBe('Test error');
    expect(varietyError.code).toBe('TEST_CODE');

    const walletError = new WalletError('Wallet error');
    expect(walletError.name).toBe('WalletError');

    const contractError = new ContractError('Contract error');
    expect(contractError.name).toBe('ContractError');
  });
});

describe('Integration Tests', () => {
  test('should create full workflow', () => {
    // Create client
    const client = new VarityClient({ chain: 'varity-l3' });

    // Verify client is created
    expect(client).toBeDefined();
    expect(client.isVarityL3()).toBe(true);

    // Verify all managers are available
    expect(client.contracts).toBeDefined();
    expect(client.wallet).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.storage).toBeDefined();

    // Test USDC operations
    const amount = parseUSDC('10.5');
    const formatted = formatUSDC(amount);
    expect(formatted).toBe('10.500000');

    // Cleanup
    client.dispose();
  });

  test('should handle multiple clients', () => {
    const client1 = new VarityClient({ chain: 'varity-l3' });
    const client2 = new VarityClient({ chain: 'arbitrum-sepolia' });

    expect(client1.getChainId()).toBe(33529);
    expect(client2.getChainId()).toBe(421614);

    client1.dispose();
    client2.dispose();
  });
});
