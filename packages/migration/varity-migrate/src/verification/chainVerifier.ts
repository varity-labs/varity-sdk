/**
 * Chain Verification Module
 *
 * Verifies blockchain chain connectivity and configuration
 * before migration operations.
 */

import { createThirdwebClient, defineChain, getRpcClient } from 'thirdweb';
import { ChainConfig, getChainConfig, VARITY_L3_CHAIN } from '../chains/chainConfig';
import { ethers } from 'ethers';

export interface ChainVerificationResult {
  chainId: number;
  chainName: string;
  isValid: boolean;
  rpcConnectivity: {
    connected: boolean;
    rpcUrl: string;
    latency?: number;
    blockNumber?: number;
    error?: string;
  };
  chainIdMatch: {
    expected: number;
    actual?: number;
    matches: boolean;
  };
  gasTokenInfo?: {
    symbol: string;
    decimals: number;
    balance?: string;
  };
  warnings: string[];
  errors: string[];
}

export interface MigrationChainVerification {
  sourceChain: ChainVerificationResult;
  destinationChain: ChainVerificationResult;
  migrationAllowed: boolean;
  compatibilityIssues: string[];
  recommendations: string[];
}

export class ChainVerifier {
  private thirdwebClient: any;

  constructor(clientId?: string) {
    // Initialize Thirdweb client
    // In production, use actual client ID from environment
    this.thirdwebClient = createThirdwebClient({
      clientId: clientId || 'varity-migration-tool'
    });
  }

  /**
   * Verify a single blockchain chain
   */
  async verifyChain(
    chainId: number,
    rpcUrlOverride?: string
  ): Promise<ChainVerificationResult> {
    const chainConfig = getChainConfig(chainId);

    if (!chainConfig) {
      return {
        chainId,
        chainName: 'Unknown',
        isValid: false,
        rpcConnectivity: {
          connected: false,
          rpcUrl: rpcUrlOverride || 'none',
          error: `Chain ID ${chainId} is not supported`
        },
        chainIdMatch: {
          expected: chainId,
          matches: false
        },
        warnings: [],
        errors: [`Chain ID ${chainId} is not in supported chains list`]
      };
    }

    const result: ChainVerificationResult = {
      chainId,
      chainName: chainConfig.name,
      isValid: false,
      rpcConnectivity: {
        connected: false,
        rpcUrl: rpcUrlOverride || chainConfig.rpcUrls[0]
      },
      chainIdMatch: {
        expected: chainId,
        matches: false
      },
      warnings: [],
      errors: []
    };

    // Verify RPC connectivity
    const rpcResult = await this.verifyRpcConnectivity(
      chainConfig,
      rpcUrlOverride
    );
    result.rpcConnectivity = rpcResult;

    // Verify chain ID matches
    if (rpcResult.connected && rpcResult.blockNumber !== undefined) {
      const chainIdResult = await this.verifyChainId(
        chainConfig,
        rpcUrlOverride
      );
      result.chainIdMatch = chainIdResult;
    }

    // Check if chain is valid
    result.isValid =
      result.rpcConnectivity.connected &&
      result.chainIdMatch.matches &&
      result.errors.length === 0;

    // Add warnings for special considerations
    if (chainConfig.migrationRules.specialConsiderations) {
      result.warnings.push(
        ...chainConfig.migrationRules.specialConsiderations
      );
    }

    return result;
  }

  /**
   * Verify RPC connectivity to a chain
   */
  private async verifyRpcConnectivity(
    chainConfig: ChainConfig,
    rpcUrlOverride?: string
  ): Promise<ChainVerificationResult['rpcConnectivity']> {
    const rpcUrl = rpcUrlOverride || chainConfig.rpcUrls[0];
    const startTime = Date.now();

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connectivity by fetching block number
      const blockNumber = await provider.getBlockNumber();
      const latency = Date.now() - startTime;

      return {
        connected: true,
        rpcUrl,
        latency,
        blockNumber
      };
    } catch (error: any) {
      return {
        connected: false,
        rpcUrl,
        error: error.message || 'Failed to connect to RPC'
      };
    }
  }

  /**
   * Verify that the chain ID matches expected
   */
  private async verifyChainId(
    chainConfig: ChainConfig,
    rpcUrlOverride?: string
  ): Promise<ChainVerificationResult['chainIdMatch']> {
    const rpcUrl = rpcUrlOverride || chainConfig.rpcUrls[0];

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const network = await provider.getNetwork();
      const actualChainId = Number(network.chainId);

      return {
        expected: chainConfig.chainId,
        actual: actualChainId,
        matches: actualChainId === chainConfig.chainId
      };
    } catch (error: any) {
      return {
        expected: chainConfig.chainId,
        matches: false
      };
    }
  }

  /**
   * Verify wallet gas token balance for a chain
   */
  async verifyWalletBalance(
    chainId: number,
    walletAddress: string,
    rpcUrlOverride?: string
  ): Promise<ChainVerificationResult['gasTokenInfo']> {
    const chainConfig = getChainConfig(chainId);

    if (!chainConfig) {
      return {
        symbol: 'UNKNOWN',
        decimals: 18
      };
    }

    const rpcUrl = rpcUrlOverride || chainConfig.rpcUrls[0];

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(walletAddress);

      return {
        symbol: chainConfig.nativeCurrency.symbol,
        decimals: chainConfig.nativeCurrency.decimals,
        balance: ethers.formatUnits(
          balance,
          chainConfig.nativeCurrency.decimals
        )
      };
    } catch (error: any) {
      return {
        symbol: chainConfig.nativeCurrency.symbol,
        decimals: chainConfig.nativeCurrency.decimals,
        balance: 'Error fetching balance'
      };
    }
  }

  /**
   * Verify both source and destination chains for migration
   */
  async verifyMigrationChains(
    sourceChainId: number,
    destinationChainId: number = VARITY_L3_CHAIN.chainId,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<MigrationChainVerification> {
    const [sourceResult, destResult] = await Promise.all([
      this.verifyChain(sourceChainId, sourceRpcUrl),
      this.verifyChain(destinationChainId, destRpcUrl)
    ]);

    const compatibilityIssues: string[] = [];
    const recommendations: string[] = [];

    // Check if source chain is supported
    const sourceConfig = getChainConfig(sourceChainId);
    if (sourceConfig && !sourceConfig.migrationRules.supportedAsSource) {
      compatibilityIssues.push(
        `Source chain ${sourceConfig.name} is not supported for migration`
      );
    }

    // Check if destination chain is supported
    const destConfig = getChainConfig(destinationChainId);
    if (destConfig && !destConfig.migrationRules.supportedAsDestination) {
      compatibilityIssues.push(
        `Destination chain ${destConfig.name} is not supported for migration`
      );
    }

    // Check gas token decimal mismatch
    if (sourceConfig && destConfig) {
      const sourceDecimals = sourceConfig.nativeCurrency.decimals;
      const destDecimals = destConfig.nativeCurrency.decimals;

      if (sourceDecimals !== destDecimals) {
        recommendations.push(
          `Gas token decimals differ: ${sourceConfig.name} uses ${sourceDecimals} decimals (${sourceConfig.nativeCurrency.symbol}), ` +
          `while ${destConfig.name} uses ${destDecimals} decimals (${destConfig.nativeCurrency.symbol}). ` +
          `Cost calculations will be adjusted accordingly.`
        );
      }

      // Special recommendation for Varity L3 USDC
      if (destinationChainId === VARITY_L3_CHAIN.chainId) {
        recommendations.push(
          'Varity L3 uses USDC (6 decimals) for gas instead of ETH (18 decimals). ' +
          'Ensure you have sufficient USDC for gas fees on Varity L3.'
        );
      }
    }

    // Add RPC connectivity issues
    if (!sourceResult.rpcConnectivity.connected) {
      compatibilityIssues.push(
        `Cannot connect to source chain RPC: ${sourceResult.rpcConnectivity.error}`
      );
    }
    if (!destResult.rpcConnectivity.connected) {
      compatibilityIssues.push(
        `Cannot connect to destination chain RPC: ${destResult.rpcConnectivity.error}`
      );
    }

    // Add chain ID mismatch issues
    if (!sourceResult.chainIdMatch.matches) {
      compatibilityIssues.push(
        `Source chain ID mismatch: expected ${sourceResult.chainIdMatch.expected}, ` +
        `got ${sourceResult.chainIdMatch.actual || 'unknown'}`
      );
    }
    if (!destResult.chainIdMatch.matches) {
      compatibilityIssues.push(
        `Destination chain ID mismatch: expected ${destResult.chainIdMatch.expected}, ` +
        `got ${destResult.chainIdMatch.actual || 'unknown'}`
      );
    }

    const migrationAllowed =
      sourceResult.isValid &&
      destResult.isValid &&
      compatibilityIssues.length === 0;

    return {
      sourceChain: sourceResult,
      destinationChain: destResult,
      migrationAllowed,
      compatibilityIssues,
      recommendations
    };
  }

  /**
   * Test RPC failover by trying multiple RPC URLs
   */
  async testRpcFailover(chainId: number): Promise<{
    chainId: number;
    workingRpcs: string[];
    failedRpcs: string[];
    fastestRpc?: {
      url: string;
      latency: number;
    };
  }> {
    const chainConfig = getChainConfig(chainId);

    if (!chainConfig) {
      return {
        chainId,
        workingRpcs: [],
        failedRpcs: []
      };
    }

    const results = await Promise.all(
      chainConfig.rpcUrls.map(async (rpcUrl) => {
        const startTime = Date.now();
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          await provider.getBlockNumber();
          const latency = Date.now() - startTime;
          return { rpcUrl, success: true, latency };
        } catch (error) {
          return { rpcUrl, success: false, latency: 0 };
        }
      })
    );

    const workingRpcs = results
      .filter(r => r.success)
      .map(r => r.rpcUrl);

    const failedRpcs = results
      .filter(r => !r.success)
      .map(r => r.rpcUrl);

    const fastestRpc = results
      .filter(r => r.success)
      .sort((a, b) => a.latency - b.latency)[0];

    return {
      chainId,
      workingRpcs,
      failedRpcs,
      fastestRpc: fastestRpc ? {
        url: fastestRpc.rpcUrl,
        latency: fastestRpc.latency
      } : undefined
    };
  }
}

/**
 * Format chain verification result for display
 */
export function formatChainVerification(result: ChainVerificationResult): string {
  const lines: string[] = [];

  lines.push(`\n=== ${result.chainName} (Chain ID: ${result.chainId}) ===`);
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);

  lines.push('\nRPC Connectivity:');
  lines.push(`  URL: ${result.rpcConnectivity.rpcUrl}`);
  lines.push(`  Connected: ${result.rpcConnectivity.connected ? '✅ Yes' : '❌ No'}`);
  if (result.rpcConnectivity.latency) {
    lines.push(`  Latency: ${result.rpcConnectivity.latency}ms`);
  }
  if (result.rpcConnectivity.blockNumber) {
    lines.push(`  Block Number: ${result.rpcConnectivity.blockNumber}`);
  }
  if (result.rpcConnectivity.error) {
    lines.push(`  Error: ${result.rpcConnectivity.error}`);
  }

  lines.push('\nChain ID Verification:');
  lines.push(`  Expected: ${result.chainIdMatch.expected}`);
  if (result.chainIdMatch.actual !== undefined) {
    lines.push(`  Actual: ${result.chainIdMatch.actual}`);
  }
  lines.push(`  Matches: ${result.chainIdMatch.matches ? '✅ Yes' : '❌ No'}`);

  if (result.gasTokenInfo) {
    lines.push('\nGas Token:');
    lines.push(`  Symbol: ${result.gasTokenInfo.symbol}`);
    lines.push(`  Decimals: ${result.gasTokenInfo.decimals}`);
    if (result.gasTokenInfo.balance) {
      lines.push(`  Balance: ${result.gasTokenInfo.balance}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(w => lines.push(`  ⚠️  ${w}`));
  }

  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    result.errors.forEach(e => lines.push(`  ❌ ${e}`));
  }

  return lines.join('\n');
}

/**
 * Format migration chain verification for display
 */
export function formatMigrationVerification(
  verification: MigrationChainVerification
): string {
  const lines: string[] = [];

  lines.push('\n╔═══════════════════════════════════════════════════════════╗');
  lines.push('║         BLOCKCHAIN MIGRATION VERIFICATION                 ║');
  lines.push('╚═══════════════════════════════════════════════════════════╝');

  lines.push(formatChainVerification(verification.sourceChain));
  lines.push(formatChainVerification(verification.destinationChain));

  lines.push('\n=== Migration Compatibility ===');
  lines.push(`Migration Allowed: ${verification.migrationAllowed ? '✅ YES' : '❌ NO'}`);

  if (verification.compatibilityIssues.length > 0) {
    lines.push('\nCompatibility Issues:');
    verification.compatibilityIssues.forEach(issue => {
      lines.push(`  ❌ ${issue}`);
    });
  }

  if (verification.recommendations.length > 0) {
    lines.push('\nRecommendations:');
    verification.recommendations.forEach(rec => {
      lines.push(`  💡 ${rec}`);
    });
  }

  return lines.join('\n');
}
