/**
 * NFT Licensing Service for Varity SDK
 *
 * ERC-1155 NFT-based licensing system using thirdweb v5.
 * Production patterns extracted from generic-template-dashboard (lines 218-280).
 *
 * @example
 * ```typescript
 * import { BlockchainService, NFTLicensingService } from '@varity-labs/sdk';
 *
 * const blockchain = new BlockchainService({ rpcUrl: "...", chainId: 33529 });
 * const licensing = new NFTLicensingService(blockchain);
 *
 * const hasLicense = await licensing.hasLicense("0x...", 1);
 * console.log(`User has license: ${hasLicense}`);
 * ```
 */

import type { BlockchainService } from './BlockchainService';
import type { NFTLicenseMetadata, LicenseInfo } from './types';

export class NFTLicensingService {
  private blockchain: BlockchainService;
  private nftContractName: string;

  constructor(
    blockchainService: BlockchainService,
    nftContractName: string = 'ToolLicenseNFT'
  ) {
    this.blockchain = blockchainService;
    this.nftContractName = nftContractName;
  }

  /**
   * Check if customer owns license NFT for a specific tool
   *
   * @param customerWallet - Customer's wallet address
   * @param toolId - The tool's ID
   * @returns True if customer owns the license NFT
   *
   * Production Pattern: Extracted from lines 220-246
   */
  async hasLicense(customerWallet: string, toolId: number): Promise<boolean> {
    try {
      // Call balanceOf(address, uint256) - ERC-1155 function
      const balance = await this.blockchain.readContract<bigint>(
        this.nftContractName,
        'balanceOf',
        [customerWallet, BigInt(toolId)]
      );

      return balance > 0n;
    } catch (error) {
      console.error(
        `Error checking license for wallet ${customerWallet}, tool ${toolId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get all tool IDs that the user has licenses for
   *
   * @param customerWallet - Customer's wallet address
   * @returns List of tool IDs the user has licenses for
   *
   * Production Pattern: Extracted from lines 248-280
   */
  async getUserLicenses(customerWallet: string): Promise<number[]> {
    try {
      // Get all active tools from marketplace
      const toolIds = await this.blockchain.readContract<bigint[]>(
        'ToolMarketplace',
        'getActiveTools',
        []
      );

      // Check balance for each tool
      const licenses: number[] = [];
      for (const toolId of toolIds) {
        const balance = await this.blockchain.readContract<bigint>(
          this.nftContractName,
          'balanceOf',
          [customerWallet, toolId]
        );

        if (balance > 0n) {
          licenses.push(Number(toolId));
        }
      }

      return licenses;
    } catch (error) {
      console.error(`Error getting user licenses for wallet ${customerWallet}:`, error);
      return [];
    }
  }

  /**
   * Get tool metadata including price and details
   *
   * @param toolId - The tool's unique ID
   * @returns NFTLicenseMetadata object, or null if not found
   *
   * Production Pattern: Extracted from lines 186-216
   */
  async getToolMetadata(toolId: number): Promise<NFTLicenseMetadata | null> {
    try {
      // Call getToolMetadata function
      const metadata = await this.blockchain.readContract<any[]>(
        this.nftContractName,
        'getToolMetadata',
        [BigInt(toolId)]
      );

      // Parse response
      return {
        toolId,
        name: metadata[0] || '',
        description: metadata[1] || '',
        price: BigInt(metadata[2] || 0),
        creator: metadata[3] || '',
        isActive: metadata[4] || false,
      };
    } catch (error) {
      console.error(`Error getting tool metadata for tool ${toolId}:`, error);
      return null;
    }
  }

  /**
   * Get detailed license information for a user's NFT
   *
   * @param customerWallet - Customer's wallet address
   * @param toolId - The tool's ID
   * @returns LicenseInfo object, or null if not found
   */
  async getLicenseInfo(
    customerWallet: string,
    toolId: number
  ): Promise<LicenseInfo | null> {
    try {
      // Get balance
      const balance = await this.blockchain.readContract<bigint>(
        this.nftContractName,
        'balanceOf',
        [customerWallet, BigInt(toolId)]
      );

      return {
        toolId,
        balance,
        isValid: balance > 0n,
      };
    } catch (error) {
      console.error(
        `Error getting license info for wallet ${customerWallet}, tool ${toolId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get list of all active tool IDs from the marketplace
   *
   * @returns List of active tool IDs
   *
   * Production Pattern: Extracted from lines 165-184
   */
  async getActiveTools(): Promise<number[]> {
    try {
      const toolIds = await this.blockchain.readContract<bigint[]>(
        'ToolMarketplace',
        'getActiveTools',
        []
      );

      return toolIds.map((id) => Number(id));
    } catch (error) {
      console.error('Error getting active tools:', error);
      return [];
    }
  }
}
