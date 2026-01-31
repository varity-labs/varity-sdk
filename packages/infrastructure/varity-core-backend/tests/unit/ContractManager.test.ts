/**
 * Contract Manager Unit Tests - Comprehensive Coverage
 * Target: 75%+ coverage for ContractManager
 */

import { ContractManager, ContractDeploymentResult } from '../../src/services/ContractManager';
import { NetworkConfig, ContractError } from '../../src/types';
import { ethers } from 'ethers';

// We won't use jest.mock for ethers, instead we'll spy on methods after import

describe('ContractManager - Comprehensive Test Suite', () => {
  let contractManager: ContractManager;
  let contractManagerWithSigner: ContractManager;
  let networkConfig: NetworkConfig;
  let mockProvider: any;
  let mockSigner: any;
  let mockContract: any;

  beforeEach(() => {
    // Mock provider with all required methods
    mockProvider = {
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(1000000000) }),
      getTransactionReceipt: jest.fn(),
      waitForTransaction: jest.fn(),
      resolveName: jest.fn().mockResolvedValue(null), // Required by Contract
      getNetwork: jest.fn().mockResolvedValue({ chainId: 421614n, name: 'arbitrum-sepolia' }),
    };

    // Mock signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0xSignerAddress'),
      signMessage: jest.fn().mockResolvedValue('mock-signature'),
      provider: mockProvider,
    };

    // Mock contract
    mockContract = {
      waitForDeployment: jest.fn().mockResolvedValue(undefined),
      getAddress: jest.fn().mockResolvedValue('0xContractAddress'),
      deploymentTransaction: jest.fn().mockReturnValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xDeploymentTxHash',
          blockNumber: 12345,
          gasUsed: BigInt(500000),
        }),
      }),
      registerDashboard: jest.fn().mockReturnValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xRegisterTxHash',
          blockNumber: 12346,
        }),
      }),
      getDashboard: jest.fn().mockResolvedValue({
        dashboardAddress: '0xDashboardAddress',
        industry: 'finance',
        templateVersion: 'v1.0.0',
        isActive: true,
      }),
      grantAccess: jest.fn().mockReturnValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xGrantAccessTxHash',
          blockNumber: 12347,
        }),
      }),
      recordUsage: jest.fn().mockReturnValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xRecordUsageTxHash',
          blockNumber: 12348,
        }),
      }),
      on: jest.fn(),
      test: {
        estimateGas: jest.fn().mockResolvedValue(BigInt(300000)),
      },
    };

    // Spy on ethers constructors
    jest.spyOn(ethers, 'JsonRpcProvider').mockImplementation(() => mockProvider as any);
    jest.spyOn(ethers, 'Wallet').mockImplementation(() => mockSigner as any);
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract as any);
    jest.spyOn(ethers, 'ContractFactory').mockImplementation(() => ({
      deploy: jest.fn().mockResolvedValue(mockContract),
    }) as any);

    networkConfig = {
      chainId: 421614,
      name: 'Arbitrum Sepolia',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      isTestnet: true,
    };

    contractManager = new ContractManager(networkConfig);
    // Use a valid 64-character hex private key format for testing
    contractManagerWithSigner = new ContractManager(
      networkConfig,
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize in read-only mode without private key', () => {
      expect(contractManager).toBeDefined();
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(networkConfig.rpcUrl);
    });

    it('should initialize with signer when private key provided', () => {
      expect(contractManagerWithSigner).toBeDefined();
      expect(ethers.Wallet).toHaveBeenCalled();
    });

    it('should have correct network configuration', () => {
      expect(networkConfig.chainId).toBe(421614);
      expect(networkConfig.name).toBe('Arbitrum Sepolia');
      expect(networkConfig.isTestnet).toBe(true);
    });
  });

  describe('Static Network Configurations', () => {
    it('should return Arbitrum Sepolia config', () => {
      const config = ContractManager.getArbitrumSepoliaConfig();
      expect(config.chainId).toBe(421614);
      expect(config.name).toBe('Arbitrum Sepolia');
      expect(config.isTestnet).toBe(true);
      expect(config.rpcUrl).toContain('sepolia');
    });

    it('should return Arbitrum One config', () => {
      const config = ContractManager.getArbitrumOneConfig();
      expect(config.chainId).toBe(42161);
      expect(config.name).toBe('Arbitrum One');
      expect(config.isTestnet).toBe(false);
      expect(config.rpcUrl).toContain('arb1');
    });
  });

  describe('Contract Deployment', () => {
    const mockAbi = [{ inputs: [], name: 'test', outputs: [], stateMutability: 'view', type: 'function' }];
    const mockBytecode = '0x60806040';

    it('should deploy contract successfully', async () => {
      const result = await contractManagerWithSigner.deployContract(mockAbi, mockBytecode, []);

      expect(result).toBeDefined();
      expect(result.address).toBe('0xContractAddress');
      expect(result.transactionHash).toBe('0xDeploymentTxHash');
      expect(result.blockNumber).toBe(12345);
      expect(result.gasUsed).toBe(BigInt(500000));
    });

    it('should deploy contract with constructor arguments', async () => {
      const args = ['arg1', 'arg2', 123];
      const result = await contractManagerWithSigner.deployContract(mockAbi, mockBytecode, args);

      expect(result).toBeDefined();
      expect(ethers.ContractFactory).toHaveBeenCalledWith(mockAbi, mockBytecode, mockSigner);
    });

    it('should throw error when deploying without signer', async () => {
      await expect(
        contractManager.deployContract(mockAbi, mockBytecode, [])
      ).rejects.toThrow('Cannot deploy contract without signer');
    });

    it('should handle deployment transaction not found', async () => {
      mockContract.deploymentTransaction.mockReturnValue(null);

      await expect(
        contractManagerWithSigner.deployContract(mockAbi, mockBytecode, [])
      ).rejects.toThrow('Deployment transaction not found');
    });

    it('should handle deployment receipt not found', async () => {
      mockContract.deploymentTransaction.mockReturnValue({
        wait: jest.fn().mockResolvedValue(null),
      });

      await expect(
        contractManagerWithSigner.deployContract(mockAbi, mockBytecode, [])
      ).rejects.toThrow('Deployment receipt not found');
    });

    it('should handle deployment failure', async () => {
      (ethers.ContractFactory as any).mockImplementation(() => ({
        deploy: jest.fn().mockRejectedValue(new Error('Deployment failed')),
      }));

      await expect(
        contractManagerWithSigner.deployContract(mockAbi, mockBytecode, [])
      ).rejects.toThrow('Failed to deploy contract');
    });
  });

  describe('Contract Initialization', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockAbi: any[] = [];

    it('should initialize Dashboard Registry', () => {
      contractManager.initializeDashboardRegistry(mockAddress, mockAbi);
      expect(ethers.Contract).toHaveBeenCalledWith(mockAddress, mockAbi, mockProvider);
    });

    it('should initialize Template Manager', () => {
      contractManager.initializeTemplateManager(mockAddress, mockAbi);
      expect(ethers.Contract).toHaveBeenCalledWith(mockAddress, mockAbi, mockProvider);
    });

    it('should initialize Access Control', () => {
      contractManager.initializeAccessControl(mockAddress, mockAbi);
      expect(ethers.Contract).toHaveBeenCalledWith(mockAddress, mockAbi, mockProvider);
    });

    it('should initialize Billing Module', () => {
      contractManager.initializeBillingModule(mockAddress, mockAbi);
      expect(ethers.Contract).toHaveBeenCalledWith(mockAddress, mockAbi, mockProvider);
    });

    it('should get contract instance', () => {
      const contract = contractManager.getContract(mockAddress, mockAbi);
      expect(contract).toBeDefined();
      expect(ethers.Contract).toHaveBeenCalledWith(mockAddress, mockAbi, mockProvider);
    });
  });

  describe('Dashboard Registration', () => {
    beforeEach(() => {
      contractManager.initializeDashboardRegistry('0xRegistryAddress', []);
    });

    it('should register dashboard successfully', async () => {
      const receipt = await contractManager.registerDashboard(
        'customer-123',
        '0xDashboardAddress',
        'finance',
        'v1.0.0',
        'QmStorageCID'
      );

      expect(receipt).toBeDefined();
      expect(receipt.hash).toBe('0xRegisterTxHash');
      expect(mockContract.registerDashboard).toHaveBeenCalledWith(
        'customer-123',
        '0xDashboardAddress',
        'finance',
        'v1.0.0',
        'QmStorageCID'
      );
    });

    it('should throw error if registry not initialized', async () => {
      const uninitializedManager = new ContractManager(networkConfig);

      await expect(
        uninitializedManager.registerDashboard(
          'customer-123',
          '0xDashboardAddress',
          'finance',
          'v1.0.0',
          'QmStorageCID'
        )
      ).rejects.toThrow('Dashboard Registry not initialized');
    });

    it('should handle registration failure', async () => {
      mockContract.registerDashboard.mockReturnValue({
        wait: jest.fn().mockRejectedValue(new Error('Registration failed')),
      });

      await expect(
        contractManager.registerDashboard(
          'customer-123',
          '0xDashboardAddress',
          'finance',
          'v1.0.0',
          'QmStorageCID'
        )
      ).rejects.toThrow('Failed to register dashboard');
    });
  });

  describe('Dashboard Retrieval', () => {
    beforeEach(() => {
      contractManager.initializeDashboardRegistry('0xRegistryAddress', []);
    });

    it('should get dashboard details', async () => {
      const dashboard = await contractManager.getDashboard('customer-123');

      expect(dashboard).toBeDefined();
      expect(dashboard.industry).toBe('finance');
      expect(mockContract.getDashboard).toHaveBeenCalledWith('customer-123');
    });

    it('should throw error if registry not initialized', async () => {
      const uninitializedManager = new ContractManager(networkConfig);

      await expect(
        uninitializedManager.getDashboard('customer-123')
      ).rejects.toThrow('Dashboard Registry not initialized');
    });

    it('should handle get dashboard failure', async () => {
      mockContract.getDashboard.mockRejectedValue(new Error('Dashboard not found'));

      await expect(
        contractManager.getDashboard('customer-123')
      ).rejects.toThrow('Failed to get dashboard');
    });
  });

  describe('Access Control', () => {
    beforeEach(() => {
      contractManager.initializeAccessControl('0xAccessControlAddress', []);
    });

    it('should grant access successfully', async () => {
      const receipt = await contractManager.grantAccess(
        '0xCustomerWallet',
        'resource-123',
        1
      );

      expect(receipt).toBeDefined();
      expect(receipt.hash).toBe('0xGrantAccessTxHash');
      expect(mockContract.grantAccess).toHaveBeenCalledWith(
        '0xCustomerWallet',
        'resource-123',
        1
      );
    });

    it('should throw error if access control not initialized', async () => {
      const uninitializedManager = new ContractManager(networkConfig);

      await expect(
        uninitializedManager.grantAccess('0xCustomerWallet', 'resource-123', 1)
      ).rejects.toThrow('Access Control not initialized');
    });

    it('should handle grant access failure', async () => {
      mockContract.grantAccess.mockReturnValue({
        wait: jest.fn().mockRejectedValue(new Error('Access denied')),
      });

      await expect(
        contractManager.grantAccess('0xCustomerWallet', 'resource-123', 1)
      ).rejects.toThrow('Failed to grant access');
    });
  });

  describe('Billing Module', () => {
    beforeEach(() => {
      contractManager.initializeBillingModule('0xBillingModuleAddress', []);
    });

    it('should record usage successfully', async () => {
      const receipt = await contractManager.recordUsage(
        'customer-123',
        'compute',
        BigInt(1000)
      );

      expect(receipt).toBeDefined();
      expect(receipt.hash).toBe('0xRecordUsageTxHash');
      expect(mockContract.recordUsage).toHaveBeenCalledWith(
        'customer-123',
        'compute',
        BigInt(1000)
      );
    });

    it('should throw error if billing module not initialized', async () => {
      const uninitializedManager = new ContractManager(networkConfig);

      await expect(
        uninitializedManager.recordUsage('customer-123', 'compute', BigInt(1000))
      ).rejects.toThrow('Billing Module not initialized');
    });

    it('should handle record usage failure', async () => {
      mockContract.recordUsage.mockReturnValue({
        wait: jest.fn().mockRejectedValue(new Error('Record failed')),
      });

      await expect(
        contractManager.recordUsage('customer-123', 'compute', BigInt(1000))
      ).rejects.toThrow('Failed to record usage');
    });
  });

  describe('Event Listening', () => {
    beforeEach(() => {
      contractManager.initializeDashboardRegistry('0xRegistryAddress', []);
    });

    it('should listen for DashboardRegistered events', () => {
      const callback = jest.fn();
      contractManager.onDashboardRegistered(callback);

      expect(mockContract.on).toHaveBeenCalledWith(
        'DashboardRegistered',
        expect.any(Function)
      );
    });

    it('should throw error if registry not initialized', () => {
      const uninitializedManager = new ContractManager(networkConfig);
      const callback = jest.fn();

      expect(() => {
        uninitializedManager.onDashboardRegistered(callback);
      }).toThrow('Dashboard Registry not initialized');
    });

    it('should execute callback on event', () => {
      const callback = jest.fn();
      contractManager.onDashboardRegistered(callback);

      // Get the event handler that was registered
      const eventHandler = mockContract.on.mock.calls[0][1];

      // Simulate event emission
      eventHandler(
        'customer-123',
        '0xDashboardAddress',
        'finance',
        'v1.0.0',
        BigInt(1234567890)
      );

      expect(callback).toHaveBeenCalledWith({
        customerId: 'customer-123',
        dashboardAddress: '0xDashboardAddress',
        industry: 'finance',
        templateVersion: 'v1.0.0',
        timestamp: 1234567890,
      });
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate gas for contract method', async () => {
      const gasEstimate = await contractManager.estimateGas(
        '0xContractAddress',
        [],
        'test',
        []
      );

      expect(gasEstimate).toBe(BigInt(300000));
    });

    it('should handle gas estimation failure', async () => {
      mockContract.test.estimateGas.mockRejectedValue(new Error('Estimation failed'));

      await expect(
        contractManager.estimateGas('0xContractAddress', [], 'test', [])
      ).rejects.toThrow('Failed to estimate gas');
    });

    it('should get current gas price', async () => {
      const gasPrice = await contractManager.getGasPrice();

      expect(gasPrice).toBe(BigInt(1000000000));
      expect(mockProvider.getFeeData).toHaveBeenCalled();
    });

    it('should return 0 if gas price is null', async () => {
      mockProvider.getFeeData.mockResolvedValue({ gasPrice: null });

      const gasPrice = await contractManager.getGasPrice();
      expect(gasPrice).toBe(BigInt(0));
    });
  });

  describe('Provider Operations', () => {
    it('should get block number', async () => {
      const blockNumber = await contractManager.getBlockNumber();

      expect(blockNumber).toBe(12345);
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
    });

    it('should get transaction receipt', async () => {
      const mockReceipt = {
        hash: '0xTxHash',
        blockNumber: 12345,
        status: 1,
      };

      mockProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const receipt = await contractManager.getTransactionReceipt('0xTxHash');

      expect(receipt).toEqual(mockReceipt);
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledWith('0xTxHash');
    });

    it('should return null for non-existent transaction', async () => {
      mockProvider.getTransactionReceipt.mockResolvedValue(null);

      const receipt = await contractManager.getTransactionReceipt('0xInvalidTxHash');

      expect(receipt).toBeNull();
    });

    it('should wait for transaction confirmation', async () => {
      const mockReceipt = {
        hash: '0xTxHash',
        blockNumber: 12345,
        status: 1,
      };

      mockProvider.waitForTransaction.mockResolvedValue(mockReceipt);

      const receipt = await contractManager.waitForTransaction('0xTxHash', 3);

      expect(receipt).toEqual(mockReceipt);
      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith('0xTxHash', 3);
    });

    it('should wait with default confirmations', async () => {
      const mockReceipt = {
        hash: '0xTxHash',
        blockNumber: 12345,
        status: 1,
      };

      mockProvider.waitForTransaction.mockResolvedValue(mockReceipt);

      const receipt = await contractManager.waitForTransaction('0xTxHash');

      expect(receipt).toEqual(mockReceipt);
      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith('0xTxHash', 1);
    });
  });
});
