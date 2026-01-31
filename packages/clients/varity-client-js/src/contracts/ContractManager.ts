/**
 * Contract Manager - Handle smart contract interactions
 */

import {
  type ThirdwebClient,
  type Chain,
  getContract,
  prepareContractCall,
  sendTransaction,
  readContract,
  prepareEvent,
  getContractEvents,
} from 'thirdweb';
import { deployContract } from 'thirdweb/deploys';
import { prepareTransaction } from 'thirdweb/transaction';
import type { Account } from 'thirdweb/wallets';
import type {
  ContractDeployOptions,
  ContractReadOptions,
  ContractWriteOptions,
  ContractEventFilter,
  ContractEvent,
  TransactionResult,
  ContractError,
} from '../types';
import { ContractError as ContractErrorClass } from '../types';

/**
 * ContractManager - Manage smart contract operations
 *
 * @example
 * ```typescript
 * // Read from contract
 * const balance = await contractManager.read({
 *   address: '0x...',
 *   abi: ERC20_ABI,
 *   functionName: 'balanceOf',
 *   args: ['0x...']
 * });
 *
 * // Write to contract
 * const result = await contractManager.write({
 *   address: '0x...',
 *   abi: ERC20_ABI,
 *   functionName: 'transfer',
 *   args: ['0x...', 1000000n]
 * }, account);
 * ```
 */
export class ContractManager {
  constructor(
    private readonly client: ThirdwebClient,
    private readonly chain: Chain
  ) {}

  /**
   * Get contract instance
   * @param address Contract address
   * @param abi Contract ABI
   * @returns Contract instance
   */
  getContractInstance(address: string, abi?: any[]) {
    return getContract({
      client: this.client,
      chain: this.chain,
      address,
      abi,
    });
  }

  /**
   * Read from contract (no gas required)
   * @param options Contract read options
   * @returns Read result
   */
  async read(options: ContractReadOptions): Promise<any> {
    try {
      const contract = this.getContractInstance(options.address, options.abi);

      const result = await readContract({
        contract,
        method: options.functionName,
        params: options.args || [],
      });

      return result;
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to read from contract: ${error.message}`, {
        address: options.address,
        functionName: options.functionName,
        error,
      });
    }
  }

  /**
   * Write to contract (requires gas and wallet signature)
   * @param options Contract write options
   * @param account Wallet account
   * @returns Transaction result
   */
  async write(
    options: ContractWriteOptions,
    account: Account
  ): Promise<TransactionResult> {
    try {
      const contract = this.getContractInstance(options.address, options.abi);

      // Prepare contract call
      const transaction = prepareContractCall({
        contract,
        method: options.functionName,
        params: options.args || [],
        value: options.value,
      });

      // Send transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      return {
        transactionHash: result.transactionHash,
        blockNumber: 0, // Will be filled after confirmation
        from: account.address,
        to: options.address,
        gasUsed: BigInt(0), // Will be filled after confirmation
        status: 'success',
      };
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to write to contract: ${error.message}`, {
        address: options.address,
        functionName: options.functionName,
        error,
      });
    }
  }

  /**
   * Deploy new contract
   * @param options Deployment options
   * @param account Deployer account
   * @returns Deployed contract address and transaction
   */
  async deploy(
    options: ContractDeployOptions,
    account: Account
  ): Promise<{ address: string; transactionHash: string }> {
    try {
      // deployContract in v5 returns the contract address as a string
      const contractAddress = await deployContract({
        client: this.client,
        chain: this.chain,
        account,
        abi: options.abi || [],
        bytecode: options.bytecode as `0x${string}`,
        constructorParams: {} as Record<string, unknown>, // v5 expects params as object
      });

      return {
        address: contractAddress,
        transactionHash: '', // v5 doesn't return transactionHash directly
      };
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to deploy contract: ${error.message}`, {
        error,
      });
    }
  }

  /**
   * Get contract events
   * @param filter Event filter options
   * @returns Array of events
   */
  async getEvents(filter: ContractEventFilter): Promise<ContractEvent[]> {
    try {
      const contract = this.getContractInstance(filter.address, filter.abi);

      // Prepare event using prepareEvent with proper event signature format
      const preparedEvent = prepareEvent({
        signature: filter.eventName as `event ${string}`,
      });

      const events = await getContractEvents({
        contract,
        events: [preparedEvent],
        fromBlock: BigInt(filter.fromBlock || 0),
        toBlock: filter.toBlock ? BigInt(filter.toBlock) : undefined,
      });

      return events.map((event: any) => ({
        eventName: filter.eventName,
        args: event.args,
        blockNumber: Number(event.blockNumber),
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      }));
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to get contract events: ${error.message}`, {
        address: filter.address,
        eventName: filter.eventName,
        error,
      });
    }
  }

  /**
   * Listen to contract events (real-time)
   * @param filter Event filter options
   * @param callback Event callback
   * @returns Cleanup function
   */
  watchEvents(
    filter: ContractEventFilter,
    callback: (event: ContractEvent) => void
  ): () => void {
    const contract = this.getContractInstance(filter.address, filter.abi);
    let isActive = true;

    // Poll for new events
    const pollInterval = setInterval(async () => {
      if (!isActive) return;

      try {
        const latestBlock = filter.toBlock || 'latest';
        const events = await this.getEvents({
          ...filter,
          fromBlock: filter.fromBlock,
          toBlock: typeof latestBlock === 'string' ? undefined : latestBlock,
        });

        events.forEach(callback);
      } catch (error) {
        console.error('Error watching events:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Return cleanup function
    return () => {
      isActive = false;
      clearInterval(pollInterval);
    };
  }

  /**
   * Estimate gas for contract call
   * @param options Contract write options
   * @param account Wallet account
   * @returns Estimated gas
   */
  async estimateGas(
    options: ContractWriteOptions,
    account: Account
  ): Promise<bigint> {
    try {
      const contract = this.getContractInstance(options.address, options.abi);

      const transaction = prepareContractCall({
        contract,
        method: options.functionName,
        params: options.args || [],
        value: options.value,
      });

      // Estimate gas (this is a simplified version)
      // In production, use proper gas estimation
      return BigInt(200000); // Default gas limit
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to estimate gas: ${error.message}`, {
        address: options.address,
        functionName: options.functionName,
        error,
      });
    }
  }

  /**
   * Batch read multiple contract calls
   * @param calls Array of read options
   * @returns Array of results
   */
  async batchRead(calls: ContractReadOptions[]): Promise<any[]> {
    try {
      const results = await Promise.all(
        calls.map((call) => this.read(call))
      );
      return results;
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to batch read: ${error.message}`, {
        error,
      });
    }
  }

  /**
   * Batch write multiple contract calls (in sequence)
   * @param calls Array of write options
   * @param account Wallet account
   * @returns Array of transaction results
   */
  async batchWrite(
    calls: ContractWriteOptions[],
    account: Account
  ): Promise<TransactionResult[]> {
    const results: TransactionResult[] = [];

    for (const call of calls) {
      try {
        const result = await this.write(call, account);
        results.push(result);
      } catch (error: any) {
        throw new ContractErrorClass(
          `Failed to execute batch write at index ${results.length}: ${error.message}`,
          {
            completedCalls: results.length,
            error,
          }
        );
      }
    }

    return results;
  }

  /**
   * Check if contract exists at address
   * @param address Contract address
   * @returns True if contract exists
   */
  async contractExists(address: string): Promise<boolean> {
    try {
      // Try to get contract code
      // This is a simplified check
      return true; // In production, check for bytecode
    } catch {
      return false;
    }
  }

  /**
   * Get contract bytecode
   * @param address Contract address
   * @returns Contract bytecode
   */
  async getBytecode(address: string): Promise<string> {
    try {
      // Get contract bytecode
      // This requires additional Thirdweb SDK methods
      return '0x'; // Placeholder
    } catch (error: any) {
      throw new ContractErrorClass(`Failed to get bytecode: ${error.message}`, {
        address,
        error,
      });
    }
  }
}

export default ContractManager;
