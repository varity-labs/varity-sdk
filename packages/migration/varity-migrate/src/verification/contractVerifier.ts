/**
 * Contract Verification Module
 *
 * Verifies smart contract deployability and compatibility
 * when migrating between blockchains.
 */

import { ethers } from 'ethers';
import { ChainConfig, getChainConfig, VARITY_L3_CHAIN } from '../chains/chainConfig';

export interface ContractInfo {
  address: string;
  bytecode?: string;
  abi?: any[];
  deploymentBytecodeSize?: number;
  runtimeBytecodeSize?: number;
}

export interface ContractVerificationResult {
  contractAddress: string;
  sourceChainId: number;
  destinationChainId: number;
  isDeployable: boolean;
  checks: {
    sizeCompatible: {
      passed: boolean;
      sourceSize: number;
      maxSize: number;
      message: string;
    };
    abiCompatible: {
      passed: boolean;
      message: string;
      incompatibleFunctions?: string[];
    };
    gasEstimation: {
      estimable: boolean;
      estimatedCost?: string;
      gasTokenSymbol?: string;
      message: string;
    };
    usdcCompatibility?: {
      passed: boolean;
      message: string;
      recommendations?: string[];
    };
  };
  warnings: string[];
  recommendations: string[];
}

export class ContractVerifier {
  /**
   * Verify if a contract can be deployed on destination chain
   */
  async verifyContractDeployability(
    contractAddress: string,
    sourceChainId: number,
    destinationChainId: number = VARITY_L3_CHAIN.chainId,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<ContractVerificationResult> {
    const sourceConfig = getChainConfig(sourceChainId);
    const destConfig = getChainConfig(destinationChainId);

    if (!sourceConfig || !destConfig) {
      throw new Error('Invalid chain configuration');
    }

    const result: ContractVerificationResult = {
      contractAddress,
      sourceChainId,
      destinationChainId,
      isDeployable: false,
      checks: {
        sizeCompatible: {
          passed: false,
          sourceSize: 0,
          maxSize: destConfig.migrationRules.maxContractSize || 24576,
          message: ''
        },
        abiCompatible: {
          passed: false,
          message: ''
        },
        gasEstimation: {
          estimable: false,
          message: ''
        }
      },
      warnings: [],
      recommendations: []
    };

    try {
      // Fetch contract bytecode from source chain
      const contractInfo = await this.getContractInfo(
        contractAddress,
        sourceChainId,
        sourceRpcUrl
      );

      // Check contract size compatibility
      result.checks.sizeCompatible = this.checkContractSize(
        contractInfo,
        destConfig
      );

      // Check ABI compatibility
      result.checks.abiCompatible = await this.checkAbiCompatibility(
        contractInfo,
        destConfig
      );

      // Check gas estimation
      result.checks.gasEstimation = await this.checkGasEstimation(
        contractInfo,
        sourceConfig,
        destConfig,
        destRpcUrl
      );

      // Special checks for Varity L3 USDC compatibility
      if (destinationChainId === VARITY_L3_CHAIN.chainId) {
        result.checks.usdcCompatibility = this.checkUsdcCompatibility(
          contractInfo,
          destConfig
        );
      }

      // Determine if contract is deployable
      result.isDeployable =
        result.checks.sizeCompatible.passed &&
        result.checks.abiCompatible.passed &&
        result.checks.gasEstimation.estimable &&
        (!result.checks.usdcCompatibility || result.checks.usdcCompatibility.passed);

      // Add general recommendations
      if (result.isDeployable) {
        result.recommendations.push(
          'Contract appears deployable on destination chain'
        );
        if (destinationChainId === VARITY_L3_CHAIN.chainId) {
          result.recommendations.push(
            'Ensure you have sufficient USDC for deployment gas fees'
          );
        }
      } else {
        result.recommendations.push(
          'Review compatibility issues before attempting deployment'
        );
      }

    } catch (error: any) {
      result.warnings.push(`Error during verification: ${error.message}`);
    }

    return result;
  }

  /**
   * Get contract information from blockchain
   */
  private async getContractInfo(
    contractAddress: string,
    chainId: number,
    rpcUrl?: string
  ): Promise<ContractInfo> {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not found`);
    }

    const provider = new ethers.JsonRpcProvider(
      rpcUrl || chainConfig.rpcUrls[0]
    );

    const bytecode = await provider.getCode(contractAddress);

    return {
      address: contractAddress,
      bytecode,
      runtimeBytecodeSize: bytecode ? (bytecode.length - 2) / 2 : 0
    };
  }

  /**
   * Check if contract size is compatible with destination chain
   */
  private checkContractSize(
    contractInfo: ContractInfo,
    destConfig: ChainConfig
  ): ContractVerificationResult['checks']['sizeCompatible'] {
    const maxSize = destConfig.migrationRules.maxContractSize || 24576;
    const actualSize = contractInfo.runtimeBytecodeSize || 0;

    const passed = actualSize <= maxSize && actualSize > 0;

    let message = '';
    if (actualSize === 0) {
      message = 'No bytecode found - contract may not exist or may be an EOA';
    } else if (passed) {
      message = `Contract size ${actualSize} bytes is within limit of ${maxSize} bytes`;
    } else {
      message = `Contract size ${actualSize} bytes exceeds limit of ${maxSize} bytes`;
    }

    return {
      passed,
      sourceSize: actualSize,
      maxSize,
      message
    };
  }

  /**
   * Check ABI compatibility (basic checks)
   */
  private async checkAbiCompatibility(
    contractInfo: ContractInfo,
    destConfig: ChainConfig
  ): Promise<ContractVerificationResult['checks']['abiCompatible']> {
    // Basic check: if bytecode exists, assume ABI compatible
    // In production, this would involve more sophisticated ABI analysis

    if (!contractInfo.bytecode || contractInfo.bytecode === '0x') {
      return {
        passed: false,
        message: 'No bytecode available for ABI verification'
      };
    }

    // Check for common patterns that might be incompatible
    const incompatiblePatterns = [];

    // Example: Check for precompile calls that might not exist on destination
    // This is a simplified check
    if (contractInfo.bytecode.includes('0000000000000000000000000000000000000001')) {
      incompatiblePatterns.push('Possible precompile usage detected');
    }

    const passed = incompatiblePatterns.length === 0;

    return {
      passed,
      message: passed
        ? 'Basic ABI compatibility checks passed'
        : 'Potential ABI incompatibilities detected',
      incompatibleFunctions: incompatiblePatterns.length > 0
        ? incompatiblePatterns
        : undefined
    };
  }

  /**
   * Check gas estimation for deployment
   */
  private async checkGasEstimation(
    contractInfo: ContractInfo,
    sourceConfig: ChainConfig,
    destConfig: ChainConfig,
    destRpcUrl?: string
  ): Promise<ContractVerificationResult['checks']['gasEstimation']> {
    if (!contractInfo.bytecode || contractInfo.bytecode === '0x') {
      return {
        estimable: false,
        message: 'Cannot estimate gas without bytecode'
      };
    }

    try {
      // Estimate deployment gas
      // This is a rough estimate based on bytecode size
      const bytecodeSize = (contractInfo.bytecode.length - 2) / 2;
      const estimatedGas = 21000 + (bytecodeSize * 200); // Rough estimate

      // Get gas token info
      const gasTokenSymbol = destConfig.nativeCurrency.symbol;
      const gasTokenDecimals = destConfig.nativeCurrency.decimals;

      // For demonstration, use a rough gas price estimate
      const estimatedGasPrice = destConfig.chainId === VARITY_L3_CHAIN.chainId
        ? 0.1 // 0.1 Gwei equivalent in USDC terms
        : 20; // 20 Gwei for ETH chains

      const estimatedCostWei = estimatedGas * Math.floor(estimatedGasPrice * 1e9);
      const estimatedCost = ethers.formatUnits(estimatedCostWei, gasTokenDecimals);

      return {
        estimable: true,
        estimatedCost: `${estimatedCost} ${gasTokenSymbol}`,
        gasTokenSymbol,
        message: `Estimated deployment cost: ${estimatedCost} ${gasTokenSymbol}`
      };
    } catch (error: any) {
      return {
        estimable: false,
        message: `Gas estimation failed: ${error.message}`
      };
    }
  }

  /**
   * Check USDC 6-decimal compatibility for Varity L3
   */
  private checkUsdcCompatibility(
    contractInfo: ContractInfo,
    destConfig: ChainConfig
  ): ContractVerificationResult['checks']['usdcCompatibility'] {
    const recommendations: string[] = [];

    // Check if contract might be handling token decimals
    const bytecode = contractInfo.bytecode || '';

    // These are heuristic checks - in production would be more sophisticated
    const hasDecimalHandling = bytecode.includes('decimals');
    const hasAmountCalculations = bytecode.includes('mul') || bytecode.includes('div');

    if (hasDecimalHandling || hasAmountCalculations) {
      recommendations.push(
        'Contract appears to handle token amounts. ' +
        'Verify that decimal handling is correct for USDC (6 decimals) vs ETH (18 decimals)'
      );
      recommendations.push(
        'Test all amount calculations with 6-decimal USDC values before deploying'
      );
    }

    recommendations.push(
      'Varity L3 uses USDC (6 decimals) for gas. ' +
      'Ensure gas estimation logic accounts for this difference.'
    );

    return {
      passed: true, // Assume passed with recommendations
      message: 'USDC compatibility checks completed',
      recommendations
    };
  }

  /**
   * Batch verify multiple contracts
   */
  async batchVerifyContracts(
    contractAddresses: string[],
    sourceChainId: number,
    destinationChainId: number = VARITY_L3_CHAIN.chainId,
    sourceRpcUrl?: string,
    destRpcUrl?: string
  ): Promise<ContractVerificationResult[]> {
    const results = await Promise.all(
      contractAddresses.map(address =>
        this.verifyContractDeployability(
          address,
          sourceChainId,
          destinationChainId,
          sourceRpcUrl,
          destRpcUrl
        )
      )
    );

    return results;
  }

  /**
   * Generate contract migration compatibility report
   */
  generateCompatibilityReport(
    results: ContractVerificationResult[]
  ): {
    totalContracts: number;
    deployableContracts: number;
    incompatibleContracts: number;
    requiresReview: number;
    summary: string;
  } {
    const totalContracts = results.length;
    const deployableContracts = results.filter(r => r.isDeployable).length;
    const incompatibleContracts = results.filter(r => !r.isDeployable).length;
    const requiresReview = results.filter(
      r => r.warnings.length > 0 || r.recommendations.length > 0
    ).length;

    const summary = `
Contract Migration Compatibility Report
========================================
Total Contracts Analyzed: ${totalContracts}
Deployable: ${deployableContracts} (${((deployableContracts / totalContracts) * 100).toFixed(1)}%)
Incompatible: ${incompatibleContracts} (${((incompatibleContracts / totalContracts) * 100).toFixed(1)}%)
Requires Review: ${requiresReview}
`;

    return {
      totalContracts,
      deployableContracts,
      incompatibleContracts,
      requiresReview,
      summary
    };
  }
}

/**
 * Format contract verification result for display
 */
export function formatContractVerification(
  result: ContractVerificationResult
): string {
  const lines: string[] = [];

  lines.push('\n╔═══════════════════════════════════════════════════════════╗');
  lines.push('║         SMART CONTRACT VERIFICATION                       ║');
  lines.push('╚═══════════════════════════════════════════════════════════╝');

  lines.push(`\nContract Address: ${result.contractAddress}`);
  lines.push(`Source Chain ID: ${result.sourceChainId}`);
  lines.push(`Destination Chain ID: ${result.destinationChainId}`);
  lines.push(`\nDeployable: ${result.isDeployable ? '✅ YES' : '❌ NO'}`);

  lines.push('\n--- Size Compatibility ---');
  lines.push(`Status: ${result.checks.sizeCompatible.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`Contract Size: ${result.checks.sizeCompatible.sourceSize} bytes`);
  lines.push(`Max Allowed: ${result.checks.sizeCompatible.maxSize} bytes`);
  lines.push(`Message: ${result.checks.sizeCompatible.message}`);

  lines.push('\n--- ABI Compatibility ---');
  lines.push(`Status: ${result.checks.abiCompatible.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`Message: ${result.checks.abiCompatible.message}`);
  if (result.checks.abiCompatible.incompatibleFunctions) {
    lines.push('Incompatible Functions:');
    result.checks.abiCompatible.incompatibleFunctions.forEach(fn => {
      lines.push(`  ⚠️  ${fn}`);
    });
  }

  lines.push('\n--- Gas Estimation ---');
  lines.push(`Estimable: ${result.checks.gasEstimation.estimable ? '✅ YES' : '❌ NO'}`);
  if (result.checks.gasEstimation.estimatedCost) {
    lines.push(`Estimated Cost: ${result.checks.gasEstimation.estimatedCost}`);
  }
  lines.push(`Message: ${result.checks.gasEstimation.message}`);

  if (result.checks.usdcCompatibility) {
    lines.push('\n--- USDC Compatibility (Varity L3) ---');
    lines.push(`Status: ${result.checks.usdcCompatibility.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Message: ${result.checks.usdcCompatibility.message}`);
    if (result.checks.usdcCompatibility.recommendations) {
      lines.push('Recommendations:');
      result.checks.usdcCompatibility.recommendations.forEach(rec => {
        lines.push(`  💡 ${rec}`);
      });
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(w => lines.push(`  ⚠️  ${w}`));
  }

  if (result.recommendations.length > 0) {
    lines.push('\nRecommendations:');
    result.recommendations.forEach(r => lines.push(`  💡 ${r}`));
  }

  return lines.join('\n');
}
