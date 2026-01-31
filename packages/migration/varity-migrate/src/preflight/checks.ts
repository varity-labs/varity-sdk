/**
 * Pre-Flight Checks Module
 *
 * Comprehensive pre-flight checks before initiating blockchain migration
 */

import { ChainVerifier, MigrationChainVerification } from '../verification/chainVerifier';
import { ContractVerifier, ContractVerificationResult } from '../verification/contractVerifier';
import { DataIntegrityVerifier, DataIntegrityCheck } from '../verification/dataIntegrity';
import { getChainConfig, VARITY_L3_CHAIN } from '../chains/chainConfig';
import { ethers } from 'ethers';

export interface PreFlightCheckConfig {
  sourceChainId: number;
  destinationChainId?: number;
  walletAddress?: string;
  contractAddresses?: string[];
  dataChecks?: DataIntegrityCheck[];
  minimumGasBalance?: string;
  sourceRpcUrl?: string;
  destRpcUrl?: string;
}

export interface PreFlightCheckResult {
  passed: boolean;
  timestamp: Date;
  checks: {
    chainConnectivity: {
      passed: boolean;
      result?: MigrationChainVerification;
      error?: string;
    };
    walletBalance: {
      passed: boolean;
      sourceBalance?: string;
      destBalance?: string;
      minimumRequired?: string;
      sufficient: boolean;
      error?: string;
    };
    contractCompatibility: {
      passed: boolean;
      results?: ContractVerificationResult[];
      totalContracts: number;
      deployableContracts: number;
      error?: string;
    };
    networkPermissions: {
      passed: boolean;
      canReadSource: boolean;
      canWriteDestination: boolean;
      error?: string;
    };
    gasCostEstimation: {
      passed: boolean;
      estimatedCost?: string;
      gasTokenSymbol?: string;
      error?: string;
    };
  };
  warnings: string[];
  recommendations: string[];
  blockers: string[];
}

export class PreFlightChecker {
  private chainVerifier: ChainVerifier;
  private contractVerifier: ContractVerifier;
  private dataIntegrityVerifier: DataIntegrityVerifier;

  constructor() {
    this.chainVerifier = new ChainVerifier();
    this.contractVerifier = new ContractVerifier();
    this.dataIntegrityVerifier = new DataIntegrityVerifier();
  }

  /**
   * Run comprehensive pre-flight checks
   */
  async runPreFlightChecks(
    config: PreFlightCheckConfig
  ): Promise<PreFlightCheckResult> {
    const result: PreFlightCheckResult = {
      passed: false,
      timestamp: new Date(),
      checks: {
        chainConnectivity: { passed: false },
        walletBalance: { passed: false, sufficient: false },
        contractCompatibility: { passed: false, totalContracts: 0, deployableContracts: 0 },
        networkPermissions: { passed: false, canReadSource: false, canWriteDestination: false },
        gasCostEstimation: { passed: false }
      },
      warnings: [],
      recommendations: [],
      blockers: []
    };

    const destChainId = config.destinationChainId || VARITY_L3_CHAIN.chainId;

    try {
      // 1. Check chain connectivity
      result.checks.chainConnectivity = await this.checkChainConnectivity(
        config.sourceChainId,
        destChainId,
        config.sourceRpcUrl,
        config.destRpcUrl
      );

      // 2. Check wallet balance
      if (config.walletAddress) {
        result.checks.walletBalance = await this.checkWalletBalance(
          config.walletAddress,
          config.sourceChainId,
          destChainId,
          config.minimumGasBalance,
          config.sourceRpcUrl,
          config.destRpcUrl
        );
      }

      // 3. Check contract compatibility
      if (config.contractAddresses && config.contractAddresses.length > 0) {
        result.checks.contractCompatibility = await this.checkContractCompatibility(
          config.contractAddresses,
          config.sourceChainId,
          destChainId,
          config.sourceRpcUrl,
          config.destRpcUrl
        );
      }

      // 4. Check network permissions
      result.checks.networkPermissions = await this.checkNetworkPermissions(
        config.sourceChainId,
        destChainId,
        config.walletAddress,
        config.sourceRpcUrl,
        config.destRpcUrl
      );

      // 5. Estimate gas costs
      result.checks.gasCostEstimation = await this.estimateGasCosts(
        config.sourceChainId,
        destChainId,
        config.contractAddresses?.length || 0,
        config.destRpcUrl
      );

      // Collect warnings and recommendations
      this.collectFeedback(result, config);

      // Determine overall pass status
      result.passed =
        result.checks.chainConnectivity.passed &&
        result.checks.walletBalance.passed &&
        result.checks.contractCompatibility.passed &&
        result.checks.networkPermissions.passed &&
        result.checks.gasCostEstimation.passed &&
        result.blockers.length === 0;

    } catch (error: any) {
      result.blockers.push(`Pre-flight checks failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Check chain connectivity
   */
  private async checkChainConnectivity(
    sourceChainId: number,
    destChainId: number,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<PreFlightCheckResult['checks']['chainConnectivity']> {
    try {
      const verification = await this.chainVerifier.verifyMigrationChains(
        sourceChainId,
        destChainId,
        sourceRpcUrl,
        destRpcUrl
      );

      return {
        passed: verification.migrationAllowed,
        result: verification
      };
    } catch (error: any) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Check wallet balance
   */
  private async checkWalletBalance(
    walletAddress: string,
    sourceChainId: number,
    destChainId: number,
    minimumRequired?: string,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<PreFlightCheckResult['checks']['walletBalance']> {
    try {
      const [sourceBalance, destBalance] = await Promise.all([
        this.chainVerifier.verifyWalletBalance(sourceChainId, walletAddress, sourceRpcUrl),
        this.chainVerifier.verifyWalletBalance(destChainId, walletAddress, destRpcUrl)
      ]);

      const destConfig = getChainConfig(destChainId);
      const minRequired = minimumRequired || '0.1'; // Default minimum

      const sufficient =
        destBalance?.balance !== undefined &&
        destBalance.balance !== 'Error fetching balance' &&
        parseFloat(destBalance.balance) >= parseFloat(minRequired);

      return {
        passed: sufficient,
        sourceBalance: sourceBalance?.balance || '0',
        destBalance: destBalance?.balance || '0',
        minimumRequired: `${minRequired} ${destConfig?.nativeCurrency.symbol || 'tokens'}`,
        sufficient
      };
    } catch (error: any) {
      return {
        passed: false,
        sufficient: false,
        error: error.message
      };
    }
  }

  /**
   * Check contract compatibility
   */
  private async checkContractCompatibility(
    contractAddresses: string[],
    sourceChainId: number,
    destChainId: number,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<PreFlightCheckResult['checks']['contractCompatibility']> {
    try {
      const results = await this.contractVerifier.batchVerifyContracts(
        contractAddresses,
        sourceChainId,
        destChainId,
        sourceRpcUrl,
        destRpcUrl
      );

      const deployableContracts = results.filter(r => r.isDeployable).length;
      const passed = deployableContracts === results.length;

      return {
        passed,
        results,
        totalContracts: results.length,
        deployableContracts
      };
    } catch (error: any) {
      return {
        passed: false,
        totalContracts: contractAddresses.length,
        deployableContracts: 0,
        error: error.message
      };
    }
  }

  /**
   * Check network permissions
   */
  private async checkNetworkPermissions(
    sourceChainId: number,
    destChainId: number,
    walletAddress?: string,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<PreFlightCheckResult['checks']['networkPermissions']> {
    try {
      const sourceConfig = getChainConfig(sourceChainId);
      const destConfig = getChainConfig(destChainId);

      if (!sourceConfig || !destConfig) {
        throw new Error('Invalid chain configuration');
      }

      // Test read access on source chain
      const sourceProvider = new ethers.JsonRpcProvider(
        sourceRpcUrl || sourceConfig.rpcUrls[0]
      );
      await sourceProvider.getBlockNumber();
      const canReadSource = true;

      // Test write access on destination chain (if wallet provided)
      let canWriteDestination = false;
      if (walletAddress) {
        const destProvider = new ethers.JsonRpcProvider(
          destRpcUrl || destConfig.rpcUrls[0]
        );
        // Check if wallet has balance (proxy for write capability)
        const balance = await destProvider.getBalance(walletAddress);
        canWriteDestination = balance > 0n;
      }

      const passed = canReadSource && (walletAddress ? canWriteDestination : true);

      return {
        passed,
        canReadSource,
        canWriteDestination: walletAddress ? canWriteDestination : true,
      };
    } catch (error: any) {
      return {
        passed: false,
        canReadSource: false,
        canWriteDestination: false,
        error: error.message
      };
    }
  }

  /**
   * Estimate gas costs for migration
   */
  private async estimateGasCosts(
    sourceChainId: number,
    destChainId: number,
    numContracts: number,
    destRpcUrl?: string
  ): Promise<PreFlightCheckResult['checks']['gasCostEstimation']> {
    try {
      const destConfig = getChainConfig(destChainId);
      if (!destConfig) {
        throw new Error('Destination chain not found');
      }

      // Rough estimates for different operation types
      const deploymentGasPerContract = 3000000; // 3M gas per contract
      const dataTransferGas = 100000; // 100K gas for data operations
      const totalGasEstimate = (deploymentGasPerContract * numContracts) + dataTransferGas;

      // Estimate gas price (simplified)
      const gasPrice = destChainId === VARITY_L3_CHAIN.chainId
        ? 0.1 // 0.1 Gwei equivalent for USDC
        : 20; // 20 Gwei for ETH chains

      const gasCostWei = totalGasEstimate * Math.floor(gasPrice * 1e9);
      const gasCost = ethers.formatUnits(gasCostWei, destConfig.nativeCurrency.decimals);

      return {
        passed: true,
        estimatedCost: `${gasCost} ${destConfig.nativeCurrency.symbol}`,
        gasTokenSymbol: destConfig.nativeCurrency.symbol
      };
    } catch (error: any) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Collect warnings, recommendations, and blockers
   */
  private collectFeedback(result: PreFlightCheckResult, config: PreFlightCheckConfig): void {
    // Chain connectivity feedback
    if (result.checks.chainConnectivity.result) {
      const verification = result.checks.chainConnectivity.result;
      result.warnings.push(...verification.sourceChain.warnings);
      result.warnings.push(...verification.destinationChain.warnings);
      result.recommendations.push(...verification.recommendations);
      result.blockers.push(...verification.compatibilityIssues);
    }

    // Wallet balance feedback
    if (!result.checks.walletBalance.sufficient) {
      result.blockers.push(
        `Insufficient gas balance on destination chain. ` +
        `Current: ${result.checks.walletBalance.destBalance}, ` +
        `Required: ${result.checks.walletBalance.minimumRequired}`
      );
    }

    // Contract compatibility feedback
    if (result.checks.contractCompatibility.results) {
      const incompatible =
        result.checks.contractCompatibility.totalContracts -
        result.checks.contractCompatibility.deployableContracts;

      if (incompatible > 0) {
        result.blockers.push(
          `${incompatible} contract(s) are not deployable on destination chain`
        );
      }
    }

    // Network permissions feedback
    if (!result.checks.networkPermissions.canReadSource) {
      result.blockers.push('Cannot read from source chain - check RPC connectivity');
    }
    if (!result.checks.networkPermissions.canWriteDestination) {
      result.warnings.push(
        'Wallet may not have write permissions on destination chain'
      );
    }

    // Gas cost feedback
    if (result.checks.gasCostEstimation.estimatedCost) {
      result.recommendations.push(
        `Estimated migration cost: ${result.checks.gasCostEstimation.estimatedCost}`
      );
    }

    // Varity L3 specific recommendations
    const destChainId = config.destinationChainId || VARITY_L3_CHAIN.chainId;
    if (destChainId === VARITY_L3_CHAIN.chainId) {
      result.recommendations.push(
        'Migration to Varity L3 includes:',
        '  • Lit Protocol encryption for all data',
        '  • Celestia DA for data availability',
        '  • Settlement to Arbitrum One L2',
        '  • Gas paid in USDC (6 decimals)',
        '  • 90% cost savings vs traditional cloud'
      );
    }
  }
}

/**
 * Format pre-flight check result for display
 */
export function formatPreFlightCheckResult(result: PreFlightCheckResult): string {
  const lines: string[] = [];

  lines.push('\n╔═══════════════════════════════════════════════════════════╗');
  lines.push('║         PRE-FLIGHT MIGRATION CHECKS                        ║');
  lines.push('╚═══════════════════════════════════════════════════════════╝');

  lines.push(`\nCheck Time: ${result.timestamp.toISOString()}`);
  lines.push(`Overall Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`);

  lines.push('═══ Individual Checks ═══\n');

  // Chain Connectivity
  lines.push('1. Chain Connectivity:');
  lines.push(`   Status: ${result.checks.chainConnectivity.passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (result.checks.chainConnectivity.error) {
    lines.push(`   Error: ${result.checks.chainConnectivity.error}`);
  }

  // Wallet Balance
  lines.push('\n2. Wallet Balance:');
  lines.push(`   Status: ${result.checks.walletBalance.passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (result.checks.walletBalance.sourceBalance) {
    lines.push(`   Source Balance: ${result.checks.walletBalance.sourceBalance}`);
  }
  if (result.checks.walletBalance.destBalance) {
    lines.push(`   Destination Balance: ${result.checks.walletBalance.destBalance}`);
  }
  if (result.checks.walletBalance.minimumRequired) {
    lines.push(`   Minimum Required: ${result.checks.walletBalance.minimumRequired}`);
  }
  if (result.checks.walletBalance.error) {
    lines.push(`   Error: ${result.checks.walletBalance.error}`);
  }

  // Contract Compatibility
  lines.push('\n3. Contract Compatibility:');
  lines.push(`   Status: ${result.checks.contractCompatibility.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`   Total Contracts: ${result.checks.contractCompatibility.totalContracts}`);
  lines.push(`   Deployable: ${result.checks.contractCompatibility.deployableContracts}`);
  if (result.checks.contractCompatibility.error) {
    lines.push(`   Error: ${result.checks.contractCompatibility.error}`);
  }

  // Network Permissions
  lines.push('\n4. Network Permissions:');
  lines.push(`   Status: ${result.checks.networkPermissions.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`   Can Read Source: ${result.checks.networkPermissions.canReadSource ? '✅' : '❌'}`);
  lines.push(`   Can Write Destination: ${result.checks.networkPermissions.canWriteDestination ? '✅' : '❌'}`);
  if (result.checks.networkPermissions.error) {
    lines.push(`   Error: ${result.checks.networkPermissions.error}`);
  }

  // Gas Cost Estimation
  lines.push('\n5. Gas Cost Estimation:');
  lines.push(`   Status: ${result.checks.gasCostEstimation.passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (result.checks.gasCostEstimation.estimatedCost) {
    lines.push(`   Estimated Cost: ${result.checks.gasCostEstimation.estimatedCost}`);
  }
  if (result.checks.gasCostEstimation.error) {
    lines.push(`   Error: ${result.checks.gasCostEstimation.error}`);
  }

  // Blockers
  if (result.blockers.length > 0) {
    lines.push('\n═══ BLOCKERS (Must Fix) ═══');
    result.blockers.forEach((blocker, i) => {
      lines.push(`${i + 1}. ❌ ${blocker}`);
    });
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('\n═══ Warnings ═══');
    result.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. ⚠️  ${warning}`);
    });
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push('\n═══ Recommendations ═══');
    result.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. 💡 ${rec}`);
    });
  }

  if (result.passed) {
    lines.push('\n✅ All pre-flight checks passed! Migration can proceed.');
  } else {
    lines.push('\n❌ Pre-flight checks failed. Please address blockers before migrating.');
  }

  return lines.join('\n');
}
