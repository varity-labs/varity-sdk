import { createThirdwebWrapper, type ThirdwebWrapperConfig } from '@varity-labs/sdk';
import { envConfig } from '../config/env.config';
import { logger } from '../config/logger.config';
import { readContract, prepareContractCall, sendTransaction } from 'thirdweb';
import type { ThirdwebWrapper } from '@varity-labs/sdk';
import type { ThirdwebContract, ThirdwebClient } from 'thirdweb';

/**
 * Thirdweb Service
 * Manages Thirdweb SDK integration for Varity L3
 */
class ThirdwebService {
  private wrapper: ThirdwebWrapper | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize Thirdweb wrapper
   */
  async initialize(privateKey?: string): Promise<void> {
    try {
      const config: ThirdwebWrapperConfig = {
        chainId: envConfig.arbitrum.chainId,
        rpcUrl: envConfig.arbitrum.rpcUrl,
        clientId: envConfig.thirdweb.clientId,
        privateKey,
      };

      this.wrapper = createThirdwebWrapper(config);
      this.isInitialized = true;

      logger.info('Thirdweb service initialized successfully', {
        chainId: envConfig.arbitrum.chainId,
        rpcUrl: envConfig.arbitrum.rpcUrl,
        hasPrivateKey: !!privateKey,
      });
    } catch (error) {
      logger.error('Failed to initialize Thirdweb service', error);
      throw error;
    }
  }

  /**
   * Get Thirdweb wrapper instance
   */
  getWrapper(): ThirdwebWrapper {
    if (!this.wrapper) {
      throw new Error('Thirdweb service not initialized. Call initialize() first.');
    }
    return this.wrapper;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.wrapper !== null;
  }

  /**
   * Deploy a smart contract
   */
  async deployContract(params: {
    name: string;
    abi: any[];
    bytecode: string;
    constructorArgs?: any[];
  }) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      logger.info('Deploying contract via Thirdweb', { name: params.name });

      const result = await this.wrapper!.deployContract({
        name: params.name,
        abi: params.abi,
        bytecode: params.bytecode,
        constructorArgs: params.constructorArgs,
      });

      logger.info('Contract deployed successfully', {
        name: params.name,
        address: result.address,
      });

      return result;
    } catch (error) {
      logger.error('Contract deployment failed', error);
      throw error;
    }
  }

  /**
   * Get contract instance
   */
  async getContract(address: string): Promise<ThirdwebContract> {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getContract(address);
    } catch (error) {
      logger.error('Failed to get contract', { address, error });
      throw error;
    }
  }

  /**
   * Read from a smart contract
   */
  async readContract(params: {
    address: string;
    abi: any[];
    functionName: string;
    args?: any[];
  }) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      const contract = await this.getContract(params.address);

      // Find the function in the ABI
      const abiFunction = params.abi.find(
        (item: any) => item.type === 'function' && item.name === params.functionName
      );

      if (!abiFunction) {
        throw new Error(`Function ${params.functionName} not found in ABI`);
      }

      // Use Thirdweb's readContract function with the ABI function
      const result = await readContract({
        contract,
        method: abiFunction,
        params: params.args || [],
      });

      logger.info('Contract read successful', {
        address: params.address,
        function: params.functionName,
      });

      return result;
    } catch (error) {
      logger.error('Contract read failed', {
        address: params.address,
        function: params.functionName,
        error,
      });
      throw error;
    }
  }

  /**
   * Write to a smart contract (requires account)
   */
  async writeContract(params: {
    address: string;
    abi: any[];
    functionName: string;
    args?: any[];
  }) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    if (!this.wrapper!.hasAccount()) {
      throw new Error('Account required for contract write operations');
    }

    try {
      const contract = await this.getContract(params.address);
      const account = this.wrapper!.getAccount()!;

      // Find the function in the ABI
      const abiFunction = params.abi.find(
        (item: any) => item.type === 'function' && item.name === params.functionName
      );

      if (!abiFunction) {
        throw new Error(`Function ${params.functionName} not found in ABI`);
      }

      // Prepare the transaction
      const transaction = prepareContractCall({
        contract,
        method: abiFunction,
        params: params.args || [],
      });

      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      logger.info('Contract write successful', {
        address: params.address,
        function: params.functionName,
        transactionHash: result.transactionHash,
      });

      return result;
    } catch (error) {
      logger.error('Contract write failed', {
        address: params.address,
        function: params.functionName,
        error,
      });
      throw error;
    }
  }

  /**
   * Upload data to IPFS
   */
  async uploadToIPFS(data: any) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      const uri = await this.wrapper!.uploadToIPFS(data);

      logger.info('Data uploaded to IPFS', { uri });

      return uri;
    } catch (error) {
      logger.error('IPFS upload failed', error);
      throw error;
    }
  }

  /**
   * Download data from IPFS
   */
  async downloadFromIPFS(uri: string) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      const data = await this.wrapper!.downloadFromIPFS(uri);

      logger.info('Data downloaded from IPFS', { uri });

      return data;
    } catch (error) {
      logger.error('IPFS download failed', { uri, error });
      throw error;
    }
  }

  /**
   * Get chain information
   */
  getChainInfo() {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    const chain = this.wrapper!.getChain();

    return {
      chainId: chain.id,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpc,
      blockExplorers: chain.blockExplorers,
      testnet: chain.testnet,
    };
  }

  /**
   * Get Thirdweb client
   */
  getClient(): ThirdwebClient {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    return this.wrapper!.getClient();
  }

  /**
   * Get contract events
   */
  async getContractEvents(params: {
    address: string;
    fromBlock?: number;
    toBlock?: number | 'latest';
    eventName?: string;
  }) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      const contract = await this.getContract(params.address);

      // Use Thirdweb's events functionality
      // This is a simplified implementation - actual implementation depends on SDK version
      const events = await this.wrapper!.getContractEvents({
        contract,
        fromBlock: params.fromBlock,
        toBlock: params.toBlock || 'latest',
        eventName: params.eventName,
      });

      logger.info('Contract events retrieved', {
        address: params.address,
        eventCount: events.length,
      });

      return events;
    } catch (error) {
      logger.error('Failed to get contract events', {
        address: params.address,
        error,
      });
      throw error;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: string | number) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getBlock(blockNumber);
    } catch (error) {
      logger.error('Failed to get block', { blockNumber, error });
      throw error;
    }
  }

  /**
   * Get transaction information
   */
  async getTransaction(hash: string) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getTransaction(hash);
    } catch (error) {
      logger.error('Failed to get transaction', { hash, error });
      throw error;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getGasPrice();
    } catch (error) {
      logger.error('Failed to get gas price', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getBalance(address);
    } catch (error) {
      logger.error('Failed to get balance', { address, error });
      throw error;
    }
  }

  /**
   * Get wallet NFTs
   */
  async getNFTs(address: string, options?: { limit?: number; offset?: number }) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getNFTs(address, options);
    } catch (error) {
      logger.error('Failed to get NFTs', { address, error });
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    address: string,
    options?: { limit?: number; offset?: number }
  ) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getTransactionHistory(address, options);
    } catch (error) {
      logger.error('Failed to get transaction history', { address, error });
      throw error;
    }
  }

  /**
   * Get token balances
   */
  async getTokenBalances(address: string) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    try {
      return await this.wrapper!.getTokenBalances(address);
    } catch (error) {
      logger.error('Failed to get token balances', { address, error });
      throw error;
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(params: {
    from: string;
    to: string;
    amount: string;
    token?: string;
  }) {
    if (!this.isReady()) {
      throw new Error('Thirdweb service not initialized');
    }

    if (!this.wrapper!.hasAccount()) {
      throw new Error('Account required for sending transactions');
    }

    try {
      return await this.wrapper!.sendTransaction(params);
    } catch (error) {
      logger.error('Failed to send transaction', { params, error });
      throw error;
    }
  }
}

// Export singleton instance
export const thirdwebService = new ThirdwebService();
export default thirdwebService;
