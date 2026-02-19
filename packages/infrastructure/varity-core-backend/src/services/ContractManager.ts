/**
 * Contract Manager - Varity L3 Smart Contract Integration
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Manages all smart contract interactions on Varity L3 (Arbitrum Orbit)
 *
 * Enhanced with Thirdweb SDK v5 wrapper (optional, preserves ethers.js)
 */

import { ethers, Contract, Provider, Wallet, TransactionReceipt } from 'ethers';
import {
  createThirdwebClient,
  getContract as getThirdwebContract,
  defineChain,
  type ThirdwebClient,
  type Chain
} from 'thirdweb';
import { deployContract as deployThirdwebContract } from 'thirdweb/deploys';
import {
  privateKeyToAccount,
  type Account
} from 'thirdweb/wallets';
import { readContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { NetworkConfig, ContractError, DashboardRegisteredEvent } from '../types';
import logger, { sanitizeLogData } from '../utils/logger';

export interface ContractDeploymentResult {
  address: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

/**
 * Varity L3 Chain Definition for Thirdweb
 * Chain ID: 33529
 * Native Token: USDC (6 decimals - NOT 18!)
 */
export const VARITY_L3_CHAIN = defineChain({
  id: 33529,
  name: 'Varity L3 Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6, // CRITICAL: USDC has 6 decimals, not 18!
  },
  blockExplorers: [
    {
      name: 'Varity Explorer',
      url: 'https://explorer.varity.network',
    },
  ],
  testnet: true,
  rpc: process.env.VARITY_L3_RPC_URL || 'https://rpc.varity.network',
});

export class ContractManager {
  private provider: Provider;
  private signer?: Wallet;
  private networkConfig: NetworkConfig;

  // Contract instances (lazy loaded)
  private dashboardRegistry?: Contract;
  private templateManager?: Contract;
  private accessControl?: Contract;
  private billingModule?: Contract;

  // Thirdweb integration (optional)
  private thirdwebClient?: ThirdwebClient;
  private thirdwebAccount?: Account;
  private thirdwebChain?: Chain;
  private useThirdweb: boolean = false;

  constructor(networkConfig: NetworkConfig, privateKey?: string) {
    this.networkConfig = networkConfig;

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    // Initialize signer if private key provided
    if (privateKey) {
      this.signer = new Wallet(privateKey, this.provider);
      logger.info('ContractManager initialized with signer', {
        network: networkConfig.name,
        chainId: networkConfig.chainId,
      });
    } else {
      logger.info('ContractManager initialized in read-only mode', {
        network: networkConfig.name,
        chainId: networkConfig.chainId,
      });
    }
  }

  /**
   * Initialize Thirdweb SDK (optional enhancement)
   */
  initializeThirdweb(clientId: string, privateKey?: string): void {
    try {
      this.thirdwebClient = createThirdwebClient({ clientId });

      // Use Varity L3 chain if it matches, otherwise define custom chain
      if (this.networkConfig.chainId === 33529) {
        this.thirdwebChain = VARITY_L3_CHAIN;
      } else {
        // Define chain for Thirdweb (Arbitrum Sepolia, Arbitrum One, etc.)
        this.thirdwebChain = defineChain({
          id: this.networkConfig.chainId,
          name: this.networkConfig.name,
          nativeCurrency: {
            name: this.networkConfig.chainId === 33529 ? 'USDC' : 'ETH',
            symbol: this.networkConfig.chainId === 33529 ? 'USDC' : 'ETH',
            decimals: this.networkConfig.chainId === 33529 ? 6 : 18,
          },
          ...(this.networkConfig.isTestnet && { testnet: true as const }),
          rpc: this.networkConfig.rpcUrl,
        });
      }

      // Initialize account if private key provided
      if (privateKey) {
        this.thirdwebAccount = privateKeyToAccount({
          client: this.thirdwebClient,
          privateKey,
        });
      }

      this.useThirdweb = true;

      logger.info('Thirdweb SDK initialized', {
        network: this.networkConfig.name,
        chainId: this.networkConfig.chainId,
        hasAccount: !!this.thirdwebAccount,
        nativeCurrency: this.thirdwebChain.nativeCurrency?.symbol,
        decimals: this.thirdwebChain.nativeCurrency?.decimals,
      });
    } catch (error: any) {
      logger.warn('Thirdweb initialization failed, falling back to ethers.js', {
        error: error.message,
      });
      this.useThirdweb = false;
    }
  }

  /**
   * Get network configuration for Arbitrum Sepolia testnet
   */
  static getArbitrumSepoliaConfig(): NetworkConfig {
    return {
      chainId: 421614,
      name: 'Arbitrum Sepolia',
      rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      isTestnet: true,
    };
  }

  /**
   * Get network configuration for Arbitrum One mainnet
   */
  static getArbitrumOneConfig(): NetworkConfig {
    return {
      chainId: 42161,
      name: 'Arbitrum One',
      rpcUrl: process.env.ARBITRUM_ONE_RPC || 'https://arb1.arbitrum.io/rpc',
      explorerUrl: 'https://arbiscan.io',
      isTestnet: false,
    };
  }

  /**
   * Deploy a smart contract to the network
   * Tries Thirdweb if enabled, falls back to ethers.js
   */
  async deployContract(
    abi: any[],
    bytecode: string,
    constructorArgs: any[] = []
  ): Promise<ContractDeploymentResult> {
    // Try Thirdweb deployment first if enabled
    if (this.useThirdweb && this.thirdwebClient && this.thirdwebChain && this.thirdwebAccount) {
      try {
        return await this.deployWithThirdweb(abi, bytecode, constructorArgs);
      } catch (error: any) {
        logger.warn('Thirdweb deployment failed, falling back to ethers.js', {
          error: error.message,
        });
        // Fall through to ethers.js deployment
      }
    }

    // Ethers.js deployment (default or fallback)
    return await this.deployWithEthers(abi, bytecode, constructorArgs);
  }

  /**
   * Deploy contract using Thirdweb SDK
   */
  private async deployWithThirdweb(
    abi: any[],
    bytecode: string,
    constructorArgs: any[] = []
  ): Promise<ContractDeploymentResult> {
    if (!this.thirdwebClient || !this.thirdwebChain || !this.thirdwebAccount) {
      throw new ContractError('Thirdweb not properly initialized');
    }

    logger.info('Deploying contract with Thirdweb...', {
      network: this.networkConfig.name,
      argsCount: constructorArgs.length,
    });

    // Ensure bytecode starts with 0x
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode as `0x${string}` : `0x${bytecode}` as `0x${string}`;

    // Convert constructor args to params object
    const constructorParams: Record<string, unknown> = {};
    constructorArgs.forEach((arg, index) => {
      constructorParams[`arg${index}`] = arg;
    });

    const address = await deployThirdwebContract({
      client: this.thirdwebClient,
      chain: this.thirdwebChain,
      account: this.thirdwebAccount,
      abi,
      bytecode: formattedBytecode,
      constructorParams,
    });

    // Get transaction details from blockchain
    const blockNumber = await this.provider.getBlockNumber();

    logger.info('Contract deployed successfully with Thirdweb', {
      address,
      blockNumber,
      method: 'thirdweb',
    });

    return {
      address,
      transactionHash: address, // Thirdweb v5 returns address directly
      blockNumber,
      gasUsed: BigInt(0), // Gas info not directly available in Thirdweb v5
    };
  }

  /**
   * Deploy contract using ethers.js (preserved for backwards compatibility)
   */
  private async deployWithEthers(
    abi: any[],
    bytecode: string,
    constructorArgs: any[] = []
  ): Promise<ContractDeploymentResult> {
    if (!this.signer) {
      throw new ContractError('Cannot deploy contract without signer');
    }

    try {
      logger.info('Deploying contract with ethers.js...', {
        network: this.networkConfig.name,
        argsCount: constructorArgs.length,
      });

      const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment();

      const address = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();

      if (!deployTx) {
        throw new ContractError('Deployment transaction not found');
      }

      const receipt = await deployTx.wait();

      if (!receipt) {
        throw new ContractError('Deployment receipt not found');
      }

      logger.info('Contract deployed successfully with ethers.js', {
        address,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        method: 'ethers',
      });

      return {
        address,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      logger.error('Contract deployment failed', { error: error.message });
      throw new ContractError('Failed to deploy contract', error);
    }
  }

  /**
   * Get a contract instance
   */
  getContract(address: string, abi: any[]): Contract {
    return new Contract(address, abi, this.signer || this.provider);
  }

  /**
   * Initialize Dashboard Registry contract
   */
  initializeDashboardRegistry(address: string, abi: any[]): void {
    this.dashboardRegistry = this.getContract(address, abi);
    logger.info('Dashboard Registry initialized', { address });
  }

  /**
   * Initialize Template Manager contract
   */
  initializeTemplateManager(address: string, abi: any[]): void {
    this.templateManager = this.getContract(address, abi);
    logger.info('Template Manager initialized', { address });
  }

  /**
   * Initialize Access Control contract
   */
  initializeAccessControl(address: string, abi: any[]): void {
    this.accessControl = this.getContract(address, abi);
    logger.info('Access Control initialized', { address });
  }

  /**
   * Initialize Billing Module contract
   */
  initializeBillingModule(address: string, abi: any[]): void {
    this.billingModule = this.getContract(address, abi);
    logger.info('Billing Module initialized', { address });
  }

  /**
   * Register a new dashboard deployment
   */
  async registerDashboard(
    customerId: string,
    dashboardAddress: string,
    industry: string,
    templateVersion: string,
    storageCID: string
  ): Promise<TransactionReceipt> {
    if (!this.dashboardRegistry) {
      throw new ContractError('Dashboard Registry not initialized');
    }

    try {
      logger.info('Registering dashboard...', {
        customerId,
        industry,
        templateVersion,
      });

      const tx = await this.dashboardRegistry.registerDashboard(
        customerId,
        dashboardAddress,
        industry,
        templateVersion,
        storageCID
      );

      const receipt = await tx.wait();

      logger.info('Dashboard registered successfully', {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt;
    } catch (error: any) {
      logger.error('Dashboard registration failed', { error: error.message });
      throw new ContractError('Failed to register dashboard', error);
    }
  }

  /**
   * Get dashboard details by customer ID
   */
  async getDashboard(customerId: string): Promise<any> {
    if (!this.dashboardRegistry) {
      throw new ContractError('Dashboard Registry not initialized');
    }

    try {
      const dashboard = await this.dashboardRegistry.getDashboard(customerId);
      return dashboard;
    } catch (error: any) {
      logger.error('Failed to get dashboard', { error: error.message });
      throw new ContractError('Failed to get dashboard', error);
    }
  }

  /**
   * Grant access to a customer wallet
   */
  async grantAccess(
    customerWallet: string,
    resourceId: string,
    accessLevel: number
  ): Promise<TransactionReceipt> {
    if (!this.accessControl) {
      throw new ContractError('Access Control not initialized');
    }

    try {
      logger.info('Granting access...', {
        customerWallet,
        resourceId,
        accessLevel,
      });

      const tx = await this.accessControl.grantAccess(
        customerWallet,
        resourceId,
        accessLevel
      );

      const receipt = await tx.wait();

      logger.info('Access granted successfully', {
        transactionHash: receipt.hash,
      });

      return receipt;
    } catch (error: any) {
      logger.error('Failed to grant access', { error: error.message });
      throw new ContractError('Failed to grant access', error);
    }
  }

  /**
   * Record usage for billing
   */
  async recordUsage(
    customerId: string,
    usageType: string,
    amount: bigint
  ): Promise<TransactionReceipt> {
    if (!this.billingModule) {
      throw new ContractError('Billing Module not initialized');
    }

    try {
      const tx = await this.billingModule.recordUsage(
        customerId,
        usageType,
        amount
      );

      const receipt = await tx.wait();

      return receipt;
    } catch (error: any) {
      logger.error('Failed to record usage', { error: error.message });
      throw new ContractError('Failed to record usage', error);
    }
  }

  /**
   * Listen for DashboardRegistered events
   */
  onDashboardRegistered(
    callback: (event: DashboardRegisteredEvent) => void
  ): void {
    if (!this.dashboardRegistry) {
      throw new ContractError('Dashboard Registry not initialized');
    }

    this.dashboardRegistry.on(
      'DashboardRegistered',
      (customerId, dashboardAddress, industry, templateVersion, timestamp) => {
        callback({
          customerId,
          dashboardAddress,
          industry,
          templateVersion,
          timestamp: Number(timestamp),
        });
      }
    );

    logger.info('Listening for DashboardRegistered events');
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    contractAddress: string,
    abi: any[],
    methodName: string,
    args: any[]
  ): Promise<bigint> {
    try {
      const contract = this.getContract(contractAddress, abi);
      const gasEstimate = await contract[methodName].estimateGas(...args);

      logger.info('Gas estimated', {
        method: methodName,
        gasEstimate: gasEstimate.toString(),
      });

      return gasEstimate;
    } catch (error: any) {
      logger.error('Gas estimation failed', { error: error.message });
      throw new ContractError('Failed to estimate gas', error);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }

  /**
   * Get block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<TransactionReceipt | null> {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get Thirdweb contract instance (if Thirdweb is initialized)
   */
  getThirdwebContract(address: string, abi: any[]): any {
    if (!this.thirdwebClient || !this.thirdwebChain) {
      throw new ContractError('Thirdweb not initialized');
    }

    return getThirdwebContract({
      client: this.thirdwebClient,
      chain: this.thirdwebChain,
      address,
      abi,
    });
  }

  /**
   * Read from contract using Thirdweb
   */
  async readContractThirdweb(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    if (!this.thirdwebClient || !this.thirdwebChain) {
      throw new ContractError('Thirdweb not initialized');
    }

    const contract = this.getThirdwebContract(contractAddress, abi);

    return await readContract({
      contract,
      method: functionName,
      params: args,
    });
  }

  /**
   * Write to contract using Thirdweb
   */
  async writeContractThirdweb(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    if (!this.thirdwebClient || !this.thirdwebChain || !this.thirdwebAccount) {
      throw new ContractError('Thirdweb not fully initialized (need account)');
    }

    const contract = this.getThirdwebContract(contractAddress, abi);

    const transaction = prepareContractCall({
      contract,
      method: functionName,
      params: args,
    });

    return await sendTransaction({
      transaction,
      account: this.thirdwebAccount,
    });
  }

  /**
   * Get Thirdweb client (for external use)
   */
  getThirdwebClient(): ThirdwebClient | undefined {
    return this.thirdwebClient;
  }

  /**
   * Get Thirdweb chain definition (for external use)
   */
  getThirdwebChain(): Chain | undefined {
    return this.thirdwebChain;
  }

  /**
   * Get Thirdweb account (for external use)
   */
  getThirdwebAccount(): Account | undefined {
    return this.thirdwebAccount;
  }

  /**
   * Check if Thirdweb is enabled
   */
  isThirdwebEnabled(): boolean {
    return this.useThirdweb;
  }
}

export default ContractManager;
