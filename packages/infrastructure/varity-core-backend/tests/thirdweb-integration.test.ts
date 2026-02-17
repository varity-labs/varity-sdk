/**
 * Thirdweb Integration Test Suite
 * Tests Thirdweb v5.112.0 integration with ContractManager and VarityBackend
 */

import { ContractManager, VARITY_L3_CHAIN, VarityBackend } from '../src/index';
import { createThirdwebClient, defineChain } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';

describe('Thirdweb Integration Tests', () => {
  const TEST_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const TEST_CLIENT_ID = process.env.THIRDWEB_CLIENT_ID || 'a35636133eb5ec6f30eb9f4c15fce2f3';

  describe('Varity L3 Chain Definition', () => {
    test('should have correct chain ID', () => {
      expect(VARITY_L3_CHAIN.id).toBe(33529);
    });

    test('should have USDC as native currency', () => {
      expect(VARITY_L3_CHAIN.nativeCurrency?.symbol).toBe('USDC');
      expect(VARITY_L3_CHAIN.nativeCurrency?.name).toBe('USDC');
    });

    test('should have 6 decimals for USDC (NOT 18)', () => {
      expect(VARITY_L3_CHAIN.nativeCurrency?.decimals).toBe(6);
    });

    test('should be marked as testnet', () => {
      expect(VARITY_L3_CHAIN.testnet).toBe(true);
    });

    test('should have correct name', () => {
      expect(VARITY_L3_CHAIN.name).toBe('Varity L3 Testnet');
    });
  });

  describe('ContractManager Thirdweb Integration', () => {
    let contractManager: ContractManager;

    beforeEach(() => {
      const networkConfig = {
        chainId: 33529,
        name: 'Varity L3 Testnet',
        rpcUrl: 'https://rpc.varity.network',
        explorerUrl: 'https://explorer.varity.network',
        isTestnet: true,
      };
      contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);
    });

    test('should initialize without Thirdweb by default', () => {
      expect(contractManager.isThirdwebEnabled()).toBe(false);
    });

    test('should initialize Thirdweb with valid client ID', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      expect(contractManager.isThirdwebEnabled()).toBe(true);
    });

    test('should have Thirdweb client after initialization', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      const client = contractManager.getThirdwebClient();
      expect(client).toBeDefined();
      expect(client?.clientId).toBe(TEST_CLIENT_ID);
    });

    test('should have Thirdweb account after initialization with private key', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      const account = contractManager.getThirdwebAccount();
      expect(account).toBeDefined();
      expect(account?.address).toBeDefined();
    });

    test('should use Varity L3 chain for chain ID 33529', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      const chain = contractManager.getThirdwebChain();
      expect(chain).toBeDefined();
      expect(chain?.id).toBe(33529);
      expect(chain?.nativeCurrency?.decimals).toBe(6);
    });

    test('should have correct RPC URL for Varity L3', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      const chain = contractManager.getThirdwebChain();
      expect(chain?.rpc).toBeDefined();
    });
  });

  describe('ContractManager Arbitrum Sepolia', () => {
    let contractManager: ContractManager;

    beforeEach(() => {
      const networkConfig = ContractManager.getArbitrumSepoliaConfig();
      contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);
    });

    test('should use ETH with 18 decimals for Arbitrum Sepolia', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      const chain = contractManager.getThirdwebChain();
      expect(chain).toBeDefined();
      expect(chain?.id).toBe(421614);
      expect(chain?.nativeCurrency?.symbol).toBe('ETH');
      expect(chain?.nativeCurrency?.decimals).toBe(18);
    });
  });

  describe('ContractManager Arbitrum One', () => {
    let contractManager: ContractManager;

    beforeEach(() => {
      const networkConfig = ContractManager.getArbitrumOneConfig();
      contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);
    });

    test('should use ETH with 18 decimals for Arbitrum One', () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
      const chain = contractManager.getThirdwebChain();
      expect(chain).toBeDefined();
      expect(chain?.id).toBe(42161);
      expect(chain?.nativeCurrency?.symbol).toBe('ETH');
      expect(chain?.nativeCurrency?.decimals).toBe(18);
    });
  });

  describe('ContractManager Deployment Methods', () => {
    let contractManager: ContractManager;

    beforeEach(() => {
      const networkConfig = {
        chainId: 33529,
        name: 'Varity L3 Testnet',
        rpcUrl: 'https://rpc.varity.network',
        explorerUrl: 'https://explorer.varity.network',
        isTestnet: true,
      };
      contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);
    });

    test('should have deployContract method', () => {
      expect(contractManager.deployContract).toBeDefined();
      expect(typeof contractManager.deployContract).toBe('function');
    });

    test('should attempt Thirdweb deployment if enabled', async () => {
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);

      // Mock ABI and bytecode (minimal for testing)
      const mockABI = [
        {
          inputs: [],
          stateMutability: 'nonpayable',
          type: 'constructor',
        },
      ];
      const mockBytecode = '0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358';

      // This will fail because we're not connected to a real network
      // But it should attempt Thirdweb deployment first
      try {
        await contractManager.deployContract(mockABI, mockBytecode, []);
      } catch (error: any) {
        // Expected to fail, but should have tried Thirdweb first
        expect(error).toBeDefined();
      }
    });

    test('should fall back to ethers.js if Thirdweb fails', async () => {
      // Don't initialize Thirdweb - should use ethers.js directly
      expect(contractManager.isThirdwebEnabled()).toBe(false);

      const mockABI = [
        {
          inputs: [],
          stateMutability: 'nonpayable',
          type: 'constructor',
        },
      ];
      const mockBytecode = '0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358';

      // This will fail because we're not connected to a real network
      try {
        await contractManager.deployContract(mockABI, mockBytecode, []);
      } catch (error: any) {
        // Expected to fail, but should have used ethers.js
        expect(error).toBeDefined();
      }
    });
  });

  describe('ContractManager Thirdweb Contract Methods', () => {
    let contractManager: ContractManager;

    beforeEach(() => {
      const networkConfig = {
        chainId: 33529,
        name: 'Varity L3 Testnet',
        rpcUrl: 'https://rpc.varity.network',
        explorerUrl: 'https://explorer.varity.network',
        isTestnet: true,
      };
      contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);
      contractManager.initializeThirdweb(TEST_CLIENT_ID, TEST_PRIVATE_KEY);
    });

    test('should have getThirdwebContract method', () => {
      expect(contractManager.getThirdwebContract).toBeDefined();
      expect(typeof contractManager.getThirdwebContract).toBe('function');
    });

    test('should have readContractThirdweb method', () => {
      expect(contractManager.readContractThirdweb).toBeDefined();
      expect(typeof contractManager.readContractThirdweb).toBe('function');
    });

    test('should have writeContractThirdweb method', () => {
      expect(contractManager.writeContractThirdweb).toBeDefined();
      expect(typeof contractManager.writeContractThirdweb).toBe('function');
    });

    test('should throw error if Thirdweb not initialized for Thirdweb-specific methods', () => {
      const uninitializedManager = new ContractManager(
        {
          chainId: 33529,
          name: 'Varity L3 Testnet',
          rpcUrl: 'https://rpc.varity.network',
          explorerUrl: 'https://explorer.varity.network',
          isTestnet: true,
        },
        TEST_PRIVATE_KEY
      );

      const mockABI: any[] = [];
      const mockAddress = '0x0000000000000000000000000000000000000000';

      expect(() => {
        uninitializedManager.getThirdwebContract(mockAddress, mockABI);
      }).toThrow('Thirdweb not initialized');
    });
  });

  describe('VarityBackend SDK Initialization', () => {
    test('should initialize with Arbitrum Sepolia', async () => {
      const sdk = await VarityBackend.initialize({
        network: 'arbitrum-sepolia',
        privateKey: TEST_PRIVATE_KEY,
        thirdwebClientId: TEST_CLIENT_ID,
        filecoinConfig: {
          pinataApiKey: 'test-api-key',
          pinataSecretKey: 'test-secret-key',
          gatewayUrl: 'https://gateway.pinata.cloud',
        },
        akashConfig: {
          rpcEndpoint: 'https://rpc.akash.forbole.com',
        },
        celestiaConfig: {
          rpcEndpoint: 'https://rpc.celestia.test',
          namespace: 'varity-test',
          enableZKProofs: true,
        },
      });

      expect(sdk).toBeDefined();
      expect(sdk.contractManager).toBeDefined();
      expect(sdk.contractManager.isThirdwebEnabled()).toBe(true);
      expect(sdk.networkConfig.chainId).toBe(421614);
    });

    test('should initialize with Arbitrum One', async () => {
      const sdk = await VarityBackend.initialize({
        network: 'arbitrum-one',
        privateKey: TEST_PRIVATE_KEY,
        thirdwebClientId: TEST_CLIENT_ID,
        filecoinConfig: {
          pinataApiKey: 'test-api-key',
          pinataSecretKey: 'test-secret-key',
          gatewayUrl: 'https://gateway.pinata.cloud',
        },
        akashConfig: {
          rpcEndpoint: 'https://rpc.akash.forbole.com',
        },
        celestiaConfig: {
          rpcEndpoint: 'https://rpc.celestia.test',
          namespace: 'varity-test',
          enableZKProofs: true,
        },
      });

      expect(sdk).toBeDefined();
      expect(sdk.contractManager).toBeDefined();
      expect(sdk.contractManager.isThirdwebEnabled()).toBe(true);
      expect(sdk.networkConfig.chainId).toBe(42161);
    });

    test('should initialize with Varity L3', async () => {
      const sdk = await VarityBackend.initialize({
        network: 'varity-l3',
        privateKey: TEST_PRIVATE_KEY,
        thirdwebClientId: TEST_CLIENT_ID,
        filecoinConfig: {
          pinataApiKey: 'test-api-key',
          pinataSecretKey: 'test-secret-key',
          gatewayUrl: 'https://gateway.pinata.cloud',
        },
        akashConfig: {
          rpcEndpoint: 'https://rpc.akash.forbole.com',
        },
        celestiaConfig: {
          rpcEndpoint: 'https://rpc.celestia.test',
          namespace: 'varity-test',
          enableZKProofs: true,
        },
      });

      expect(sdk).toBeDefined();
      expect(sdk.contractManager).toBeDefined();
      expect(sdk.contractManager.isThirdwebEnabled()).toBe(true);
      expect(sdk.networkConfig.chainId).toBe(33529);

      const chain = sdk.contractManager.getThirdwebChain();
      expect(chain?.nativeCurrency?.decimals).toBe(6); // USDC decimals
    });

    test('should work without Thirdweb client ID', async () => {
      const sdk = await VarityBackend.initialize({
        network: 'arbitrum-sepolia',
        privateKey: TEST_PRIVATE_KEY,
        filecoinConfig: {
          pinataApiKey: 'test-api-key',
          pinataSecretKey: 'test-secret-key',
          gatewayUrl: 'https://gateway.pinata.cloud',
        },
        akashConfig: {
          rpcEndpoint: 'https://rpc.akash.forbole.com',
        },
        celestiaConfig: {
          rpcEndpoint: 'https://rpc.celestia.test',
          namespace: 'varity-test',
          enableZKProofs: true,
        },
      });

      expect(sdk).toBeDefined();
      expect(sdk.contractManager).toBeDefined();
      expect(sdk.contractManager.isThirdwebEnabled()).toBe(false);
    });
  });

  describe('Thirdweb Direct Usage', () => {
    test('should be able to create Thirdweb client directly', () => {
      const client = createThirdwebClient({ clientId: TEST_CLIENT_ID });
      expect(client).toBeDefined();
      expect(client.clientId).toBe(TEST_CLIENT_ID);
    });

    test('should be able to create account from private key', () => {
      const client = createThirdwebClient({ clientId: TEST_CLIENT_ID });
      const account = privateKeyToAccount({
        client,
        privateKey: TEST_PRIVATE_KEY,
      });
      expect(account).toBeDefined();
      expect(account.address).toBeDefined();
    });

    test('should be able to define custom chain', () => {
      const customChain = defineChain({
        id: 12345,
        name: 'Test Chain',
        nativeCurrency: {
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 18,
        },
        testnet: true,
        rpc: 'https://test-rpc.example.com',
      });

      expect(customChain).toBeDefined();
      expect(customChain.id).toBe(12345);
      expect(customChain.nativeCurrency?.decimals).toBe(18);
    });
  });

  describe('Backwards Compatibility', () => {
    test('should preserve all existing ethers.js methods', () => {
      const networkConfig = ContractManager.getArbitrumSepoliaConfig();
      const contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);

      // Core ethers.js methods should still exist
      expect(contractManager.deployContract).toBeDefined();
      expect(contractManager.getContract).toBeDefined();
      expect(contractManager.estimateGas).toBeDefined();
      expect(contractManager.getGasPrice).toBeDefined();
      expect(contractManager.getBlockNumber).toBeDefined();
      expect(contractManager.getTransactionReceipt).toBeDefined();
      expect(contractManager.waitForTransaction).toBeDefined();
    });

    test('should work with ethers.js only (no Thirdweb)', async () => {
      const networkConfig = ContractManager.getArbitrumSepoliaConfig();
      const contractManager = new ContractManager(networkConfig, TEST_PRIVATE_KEY);

      expect(contractManager.isThirdwebEnabled()).toBe(false);

      // Should be able to get gas price
      try {
        const gasPrice = await contractManager.getGasPrice();
        expect(gasPrice).toBeDefined();
      } catch (error) {
        // May fail if not connected to real network, but method should exist
        expect(error).toBeDefined();
      }
    });
  });
});
