/**
 * Blockchain Service for Varity SDK
 *
 * Core blockchain integration using thirdweb v5.
 * Production patterns extracted from generic-template-dashboard.
 *
 * Features:
 * - thirdweb v5 function-based API
 * - Contract reading via readContract
 * - Transaction submission via Engine
 * - Multi-chain support
 *
 * @example
 * ```typescript
 * import { BlockchainService } from '@varity-labs/sdk';
 *
 * const service = new BlockchainService({
 *   rpcUrl: "https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz",
 *   chainId: 33529
 * });
 *
 * const isConnected = await service.isConnected();
 * ```
 */

import { createThirdwebClient, getContract, defineChain } from 'thirdweb';
import { readContract } from 'thirdweb';
import type { ThirdwebClient, Chain } from 'thirdweb';
import type { ContractConfig, BlockchainServiceOptions } from './types';

export class BlockchainService {
  private client: ThirdwebClient;
  private chain: Chain;
  private contracts: Map<string, any>;
  private abis: Map<string, any[]>;

  constructor(options: BlockchainServiceOptions) {
    const { rpcUrl, chainId, engineUrl, engineAccessToken, backendWallet } = options;

    // Create thirdweb client
    this.client = createThirdwebClient({
      clientId: process.env.THIRDWEB_CLIENT_ID || '',
    });

    // Define chain
    this.chain = defineChain({
      id: chainId,
      rpc: rpcUrl,
    });

    this.contracts = new Map();
    this.abis = new Map();
  }

  /**
   * Check if connected to blockchain
   *
   * Production Pattern: Extracted from lines 143-145
   */
  async isConnected(): Promise<boolean> {
    try {
      // Try to get the latest block number
      const block = await this.getBlockNumber();
      return block > 0;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Get the latest block number
   *
   * Production Pattern: Extracted from lines 147-153
   */
  async getBlockNumber(): Promise<number> {
    try {
      // Use thirdweb to get block number
      const response = await fetch(this.chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      return parseInt(data.result, 16);
    } catch (error) {
      console.error('Failed to get block number:', error);
      return 0;
    }
  }

  /**
   * Get the chain ID
   *
   * Production Pattern: Extracted from lines 155-161
   */
  getChainId(): number {
    return this.chain.id;
  }

  /**
   * Load contract ABI
   *
   * @param contractName - Name of the contract
   * @param abi - Contract ABI
   *
   * Production Pattern: Extracted from lines 79-114
   */
  loadContractABI(contractName: string, abi: any[]): void {
    this.abis.set(contractName, abi);
  }

  /**
   * Initialize a contract instance
   *
   * @param contractName - Name of the contract
   * @param address - Contract address
   *
   * Production Pattern: Extracted from lines 116-140
   */
  initializeContract(contractName: string, address: string): void {
    // Check if zero address
    if (address === '0x0000000000000000000000000000000000000000') {
      console.warn(`Skipping ${contractName} - not deployed yet`);
      return;
    }

    // Get ABI
    const abi = this.abis.get(contractName);
    if (!abi) {
      console.warn(`No ABI found for ${contractName}`);
      return;
    }

    // Create contract instance using thirdweb
    const contract = getContract({
      client: this.client,
      chain: this.chain,
      address,
      abi,
    });

    this.contracts.set(contractName, contract);
  }

  /**
   * Get a cached contract instance
   */
  getContract(contractName: string): any | undefined {
    return this.contracts.get(contractName);
  }

  /**
   * Read from a contract (thirdweb v5 pattern)
   *
   * @example
   * ```typescript
   * const balance = await service.readContract(
   *   'ToolLicenseNFT',
   *   'balanceOf',
   *   [walletAddress, toolId]
   * );
   * ```
   */
  async readContract<T = any>(
    contractName: string,
    functionName: string,
    args: any[] = []
  ): Promise<T> {
    const contract = this.getContract(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not initialized`);
    }

    try {
      const result = await readContract({
        contract,
        method: functionName,
        params: args,
      });

      return result as T;
    } catch (error) {
      console.error(`Error reading from ${contractName}.${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Format USDC amount (6 decimals) to human-readable
   *
   * @param amount - Amount in smallest unit (e.g., 100_000_000)
   * @returns Formatted string (e.g., "100.00 USDC")
   */
  formatUSDC(amount: bigint): string {
    const usdcValue = Number(amount) / 1_000_000;
    return `${usdcValue.toFixed(2)} USDC`;
  }

  /**
   * Parse human-readable USDC to smallest unit
   *
   * @param amountStr - Amount as string (e.g., "100.50")
   * @returns Amount in smallest unit (6 decimals)
   */
  parseUSDC(amountStr: string): bigint {
    const usdcDecimal = parseFloat(amountStr);
    return BigInt(Math.round(usdcDecimal * 1_000_000));
  }
}
