/**
 * Thirdweb Wrapper for Varity SDK
 *
 * This wrapper provides Thirdweb SDK v5 functionality while maintaining
 * 100% backwards compatibility with existing ethers.js v6 implementation.
 *
 * Pattern: Optional enhancement layer - does NOT break existing functionality
 */

import { createThirdwebClient, getContract as getThirdwebContract, type Chain } from 'thirdweb';
import { deployContract as deployThirdwebContract } from 'thirdweb/deploys';
import { upload, download } from 'thirdweb/storage';
import { privateKeyToAccount, type Account } from 'thirdweb/wallets';
import { ethers } from 'ethers';
import { varietyTestnet, VARITY_TESTNET_RPC } from './varity-chain';
import { ChainRegistry, varityL3Testnet } from '../chains';

/**
 * Configuration for ThirdwebWrapper
 */
export interface ThirdwebWrapperConfig {
  /**
   * Chain to use (defaults to Varity L3 Testnet)
   * Can be a chain ID number or a Chain object from thirdweb/chains
   */
  chain?: number | Chain;

  /**
   * RPC URL (optional - will use chain's default if not provided)
   */
  rpcUrl?: string;

  /**
   * Thirdweb Client ID (from .env.testnet)
   * Default: acb17e07e34ab2b8317aa40cbb1b5e1d
   */
  clientId?: string;

  /**
   * Optional private key for wallet operations
   */
  privateKey?: string;

  /**
   * @deprecated Use chain parameter instead
   */
  chainId?: number;
}

/**
 * Contract deployment parameters
 */
export interface DeployContractParams {
  name: string;
  abi: any[];
  bytecode: string;
  constructorArgs?: any[];
}

/**
 * ThirdwebWrapper Class
 *
 * Provides Thirdweb SDK capabilities with ethers.js fallback.
 * All existing ethers.js functionality is preserved.
 */
export class ThirdwebWrapper {
  private client: ReturnType<typeof createThirdwebClient>;
  private ethersProvider: ethers.JsonRpcProvider;
  private chainId: number;
  private account?: Account;
  private chain: Chain;

  constructor(config: ThirdwebWrapperConfig) {
    // Determine chain
    if (config.chain) {
      if (typeof config.chain === 'number') {
        // Chain ID provided - look up in registry
        this.chain = ChainRegistry.getChain(config.chain);
        this.chainId = config.chain;
      } else {
        // Chain object provided directly
        this.chain = config.chain;
        this.chainId = config.chain.id;
      }
    } else if (config.chainId) {
      // Legacy chainId parameter (deprecated but supported)
      console.warn('ThirdwebWrapper: chainId parameter is deprecated. Use chain parameter instead.');
      this.chain = ChainRegistry.getChain(config.chainId);
      this.chainId = config.chainId;
    } else {
      // Default to Varity L3 Testnet
      this.chain = varityL3Testnet;
      this.chainId = varityL3Testnet.id;
    }

    // Initialize Thirdweb Client
    this.client = createThirdwebClient({
      clientId: config.clientId || process.env.THIRDWEB_CLIENT_ID || 'acb17e07e34ab2b8317aa40cbb1b5e1d',
    });

    // Initialize account if private key provided
    if (config.privateKey) {
      this.account = privateKeyToAccount({
        client: this.client,
        privateKey: config.privateKey,
      });
    }

    // Preserve ethers.js fallback with RPC from config or chain default
    const rpcUrl = config.rpcUrl || (this.chain.rpc as string) || VARITY_TESTNET_RPC;
    this.ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
  }

  // ===== NEW: Thirdweb Methods =====

  /**
   * Get a contract instance using Thirdweb
   * @param address Contract address
   * @returns Thirdweb contract instance
   */
  async getContract(address: string) {
    return getThirdwebContract({
      client: this.client,
      chain: this.chain,
      address,
    });
  }

  /**
   * Deploy a contract using Thirdweb
   * @param params Deployment parameters
   * @returns Deployed contract address
   */
  async deployContract(params: DeployContractParams) {
    if (!this.account) {
      throw new Error('Account required for contract deployment. Provide privateKey in config.');
    }

    const address = await deployThirdwebContract({
      client: this.client,
      chain: this.chain,
      account: this.account,
      abi: params.abi as any, // Type cast to satisfy Thirdweb's strict typing
      bytecode: params.bytecode as `0x${string}`,
      constructorParams: params.constructorArgs as any || [],
    });

    return {
      address,
      deployed: true,
      method: 'thirdweb',
      transactionHash: address, // Thirdweb v5 returns address directly
    };
  }

  /**
   * Upload data to IPFS using Thirdweb Storage
   * @param data Data to upload (can be JSON, File, or any supported type)
   * @returns IPFS URI
   */
  async uploadToIPFS(data: any) {
    const uri = await upload({
      client: this.client,
      files: [data],
    });

    return uri;
  }

  /**
   * Download data from IPFS using Thirdweb Storage
   * @param uri IPFS URI
   * @returns Downloaded data
   */
  async downloadFromIPFS(uri: string) {
    const data = await download({
      client: this.client,
      uri,
    });

    return data;
  }

  // ===== PRESERVED: Ethers.js Fallback Methods =====

  /**
   * Get the ethers.js provider (backwards compatibility)
   * @returns Ethers JsonRpcProvider
   */
  getEthersProvider(): ethers.JsonRpcProvider {
    return this.ethersProvider;
  }

  /**
   * Get a contract instance using ethers.js (backwards compatibility)
   * @param address Contract address
   * @param abi Contract ABI
   * @returns Ethers Contract instance
   */
  async getContractWithEthers(address: string, abi: any[]): Promise<ethers.Contract> {
    return new ethers.Contract(address, abi, this.ethersProvider);
  }

  /**
   * Deploy a contract using ethers.js (backwards compatibility)
   * @param params Deployment parameters
   * @returns Deployment result
   */
  async deployContractWithEthers(params: DeployContractParams) {
    if (!this.account) {
      throw new Error('Account required for contract deployment. Provide privateKey in config.');
    }

    const wallet = new ethers.Wallet(this.account.address, this.ethersProvider);
    const factory = new ethers.ContractFactory(params.abi, params.bytecode, wallet);
    const contract = await factory.deploy(...(params.constructorArgs || []));
    await contract.waitForDeployment();

    return {
      address: await contract.getAddress(),
      deployed: true,
      method: 'ethers',
      transactionHash: contract.deploymentTransaction()?.hash,
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Get the Thirdweb client instance
   * @returns Thirdweb client
   */
  getClient() {
    return this.client;
  }

  /**
   * Get the Thirdweb account (if configured)
   * @returns Thirdweb account or undefined
   */
  getAccount(): Account | undefined {
    return this.account;
  }

  /**
   * Get the chain configuration
   * @returns Varity chain definition
   */
  getChain() {
    return this.chain;
  }

  /**
   * Get the chain ID
   * @returns Chain ID (33529)
   */
  getChainId(): number {
    return this.chainId;
  }

  /**
   * Check if Thirdweb account is configured
   * @returns True if account is available
   */
  hasAccount(): boolean {
    return !!this.account;
  }

  // ===== HYBRID METHODS: Try Thirdweb, fallback to Ethers =====

  /**
   * Deploy contract with automatic fallback
   * Tries Thirdweb first, falls back to ethers.js on error
   * @param params Deployment parameters
   * @returns Deployment result
   */
  async deployWithFallback(params: DeployContractParams) {
    try {
      return await this.deployContract(params);
    } catch (error) {
      console.warn('Thirdweb deployment failed, falling back to ethers.js:', error);
      return await this.deployContractWithEthers(params);
    }
  }

  // ===== BLOCKCHAIN QUERY METHODS (using ethers.js) =====

  /**
   * Get contract events
   * @param params Event query parameters
   * @returns Contract events
   */
  async getContractEvents(params: {
    contract: any;
    fromBlock?: number;
    toBlock?: number | 'latest';
    eventName?: string;
  }) {
    // Use ethers.js to query events
    const provider = this.ethersProvider;
    const filter = {
      address: params.contract.address,
      fromBlock: params.fromBlock || 0,
      toBlock: params.toBlock || 'latest',
    };

    const logs = await provider.getLogs(filter);
    return logs;
  }

  /**
   * Get block information
   * @param blockNumber Block number or 'latest'
   * @returns Block information
   */
  async getBlock(blockNumber: string | number) {
    return await this.ethersProvider.getBlock(blockNumber);
  }

  /**
   * Get transaction information
   * @param hash Transaction hash
   * @returns Transaction information
   */
  async getTransaction(hash: string) {
    return await this.ethersProvider.getTransaction(hash);
  }

  /**
   * Get current gas price
   * @returns Gas price in wei
   */
  async getGasPrice() {
    const feeData = await this.ethersProvider.getFeeData();
    return feeData.gasPrice;
  }

  /**
   * Get wallet balance
   * @param address Wallet address
   * @returns Balance in wei
   */
  async getBalance(address: string) {
    return await this.ethersProvider.getBalance(address);
  }

  /**
   * Get NFTs for a wallet
   * @param address Wallet address
   * @param options Query options
   * @returns NFT list
   */
  async getNFTs(address: string, options?: { limit?: number; offset?: number }) {
    // TODO: Implement NFT querying using Thirdweb SDK or external API
    // For now, return empty array as placeholder
    console.warn('getNFTs not yet implemented, returning empty array');
    return [];
  }

  /**
   * Get transaction history for a wallet
   * @param address Wallet address
   * @param options Query options
   * @returns Transaction history
   */
  async getTransactionHistory(
    address: string,
    options?: { limit?: number; offset?: number }
  ) {
    // TODO: Implement transaction history using block explorer API
    // For now, return empty array as placeholder
    console.warn('getTransactionHistory not yet implemented, returning empty array');
    return [];
  }

  /**
   * Get token balances for a wallet
   * @param address Wallet address
   * @returns Token balances
   */
  async getTokenBalances(address: string) {
    // TODO: Implement token balance querying using Thirdweb SDK or external API
    // For now, return empty array as placeholder
    console.warn('getTokenBalances not yet implemented, returning empty array');
    return [];
  }

  /**
   * Send transaction
   * @param params Transaction parameters
   * @returns Transaction result
   */
  async sendTransaction(params: {
    from: string;
    to: string;
    amount: string;
    token?: string;
  }) {
    if (!this.account) {
      throw new Error('Account required for sending transactions. Provide privateKey in config.');
    }

    // Use ethers.js to send transaction
    const wallet = new ethers.Wallet(this.account.address, this.ethersProvider);

    const tx = await wallet.sendTransaction({
      to: params.to,
      value: ethers.parseEther(params.amount),
    });

    await tx.wait();

    return {
      transactionHash: tx.hash,
      from: params.from,
      to: params.to,
      amount: params.amount,
    };
  }
}

/**
 * Factory function to create ThirdwebWrapper instance
 * @param config Configuration options
 * @returns ThirdwebWrapper instance
 */
export function createThirdwebWrapper(config: ThirdwebWrapperConfig): ThirdwebWrapper {
  return new ThirdwebWrapper(config);
}
