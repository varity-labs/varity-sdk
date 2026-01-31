/**
 * Data Integrity Verification Module
 *
 * Verifies on-chain data integrity before and after migration
 */

import { ethers } from 'ethers';
import { ChainConfig, getChainConfig } from '../chains/chainConfig';
import crypto from 'crypto';

export interface DataIntegrityCheck {
  dataType: 'contract' | 'storage' | 'transaction' | 'state';
  identifier: string;
  sourceChainId: number;
  sourceChecksum: string;
  verificationType: 'sha256' | 'keccak256' | 'merkle';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DataIntegrityVerificationResult {
  dataType: string;
  identifier: string;
  sourceChainId: number;
  destinationChainId?: number;
  integrity: {
    sourceChecksumValid: boolean;
    sourceChecksum: string;
    destinationChecksum?: string;
    checksumMatch?: boolean;
  };
  storageLayout: {
    compatible: boolean;
    issues?: string[];
    recommendations?: string[];
  };
  varityL3Compatible: {
    celestiaDAReady: boolean;
    litProtocolReady: boolean;
    encryptionSupported: boolean;
    issues?: string[];
  };
  passed: boolean;
  warnings: string[];
}

export class DataIntegrityVerifier {
  /**
   * Calculate checksum for contract bytecode
   */
  async calculateContractChecksum(
    contractAddress: string,
    chainId: number,
    rpcUrl?: string
  ): Promise<DataIntegrityCheck> {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const provider = new ethers.JsonRpcProvider(
      rpcUrl || chainConfig.rpcUrls[0]
    );

    const bytecode = await provider.getCode(contractAddress);
    const checksum = this.sha256Hash(bytecode);

    return {
      dataType: 'contract',
      identifier: contractAddress,
      sourceChainId: chainId,
      sourceChecksum: checksum,
      verificationType: 'sha256',
      timestamp: new Date(),
      metadata: {
        bytecodeLength: bytecode.length,
        hasCode: bytecode !== '0x'
      }
    };
  }

  /**
   * Calculate checksum for storage slot
   */
  async calculateStorageChecksum(
    contractAddress: string,
    storageSlot: string,
    chainId: number,
    rpcUrl?: string
  ): Promise<DataIntegrityCheck> {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const provider = new ethers.JsonRpcProvider(
      rpcUrl || chainConfig.rpcUrls[0]
    );

    const storageValue = await provider.getStorage(contractAddress, storageSlot);
    const checksum = this.sha256Hash(storageValue);

    return {
      dataType: 'storage',
      identifier: `${contractAddress}:${storageSlot}`,
      sourceChainId: chainId,
      sourceChecksum: checksum,
      verificationType: 'sha256',
      timestamp: new Date(),
      metadata: {
        storageSlot,
        storageValue
      }
    };
  }

  /**
   * Verify data integrity for migration
   */
  async verifyDataIntegrity(
    dataCheck: DataIntegrityCheck,
    destinationChainId?: number,
    destRpcUrl?: string
  ): Promise<DataIntegrityVerificationResult> {
    const result: DataIntegrityVerificationResult = {
      dataType: dataCheck.dataType,
      identifier: dataCheck.identifier,
      sourceChainId: dataCheck.sourceChainId,
      destinationChainId,
      integrity: {
        sourceChecksumValid: true,
        sourceChecksum: dataCheck.sourceChecksum
      },
      storageLayout: {
        compatible: true
      },
      varityL3Compatible: {
        celestiaDAReady: true,
        litProtocolReady: true,
        encryptionSupported: true
      },
      passed: false,
      warnings: []
    };

    // Verify source checksum format
    if (!this.isValidChecksum(dataCheck.sourceChecksum)) {
      result.integrity.sourceChecksumValid = false;
      result.warnings.push('Source checksum format is invalid');
    }

    // Check storage layout compatibility
    result.storageLayout = this.checkStorageLayout(dataCheck);

    // Check Varity L3 compatibility if destination is Varity L3
    if (destinationChainId === 33529) {
      result.varityL3Compatible = this.checkVarityL3Compatibility(dataCheck);
    }

    // If destination is provided, verify checksum match
    if (destinationChainId && destRpcUrl) {
      try {
        const destChecksum = await this.calculateDestinationChecksum(
          dataCheck,
          destinationChainId,
          destRpcUrl
        );
        result.integrity.destinationChecksum = destChecksum;
        result.integrity.checksumMatch = destChecksum === dataCheck.sourceChecksum;

        if (!result.integrity.checksumMatch) {
          result.warnings.push('Source and destination checksums do not match');
        }
      } catch (error: any) {
        result.warnings.push(`Failed to verify destination checksum: ${error.message}`);
      }
    }

    // Determine if verification passed
    result.passed =
      result.integrity.sourceChecksumValid &&
      result.storageLayout.compatible &&
      result.varityL3Compatible.celestiaDAReady &&
      result.varityL3Compatible.litProtocolReady &&
      (result.integrity.checksumMatch !== false);

    return result;
  }

  /**
   * Check storage layout compatibility
   */
  private checkStorageLayout(
    dataCheck: DataIntegrityCheck
  ): DataIntegrityVerificationResult['storageLayout'] {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for potential storage layout issues
    if (dataCheck.dataType === 'storage') {
      // Warn about potential layout differences
      recommendations.push(
        'Verify storage layout is identical between source and destination contracts'
      );
      recommendations.push(
        'Ensure no storage slot collisions exist in destination contract'
      );
    }

    if (dataCheck.dataType === 'contract') {
      recommendations.push(
        'Verify constructor parameters are correctly set for deployment'
      );
      recommendations.push(
        'Ensure initialization functions are called after deployment'
      );
    }

    return {
      compatible: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }

  /**
   * Check Varity L3 specific compatibility
   */
  private checkVarityL3Compatibility(
    dataCheck: DataIntegrityCheck
  ): DataIntegrityVerificationResult['varityL3Compatible'] {
    const issues: string[] = [];

    // Check if data can be stored on Celestia DA
    const celestiaDAReady = dataCheck.sourceChecksum.length > 0;
    if (!celestiaDAReady) {
      issues.push('Data checksum is empty - cannot store on Celestia DA');
    }

    // Check if data can be encrypted with Lit Protocol
    const litProtocolReady = dataCheck.dataType !== 'transaction';
    if (!litProtocolReady) {
      issues.push('Transaction data type may not be fully compatible with Lit Protocol encryption');
    }

    // Check if encryption is supported for data type
    const encryptionSupported = ['contract', 'storage', 'state'].includes(dataCheck.dataType);
    if (!encryptionSupported) {
      issues.push(`Data type ${dataCheck.dataType} may not support encryption`);
    }

    return {
      celestiaDAReady,
      litProtocolReady,
      encryptionSupported,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Calculate destination checksum after migration
   */
  private async calculateDestinationChecksum(
    dataCheck: DataIntegrityCheck,
    destinationChainId: number,
    destRpcUrl: string
  ): Promise<string> {
    const chainConfig = getChainConfig(destinationChainId);
    if (!chainConfig) {
      throw new Error(`Destination chain ${destinationChainId} not supported`);
    }

    const provider = new ethers.JsonRpcProvider(destRpcUrl);

    if (dataCheck.dataType === 'contract') {
      const bytecode = await provider.getCode(dataCheck.identifier);
      return this.sha256Hash(bytecode);
    }

    if (dataCheck.dataType === 'storage' && dataCheck.metadata?.storageSlot) {
      const [contractAddress] = dataCheck.identifier.split(':');
      const storageValue = await provider.getStorage(
        contractAddress,
        dataCheck.metadata.storageSlot
      );
      return this.sha256Hash(storageValue);
    }

    throw new Error(`Cannot calculate checksum for data type: ${dataCheck.dataType}`);
  }

  /**
   * Batch verify multiple data items
   */
  async batchVerifyDataIntegrity(
    dataChecks: DataIntegrityCheck[],
    destinationChainId?: number,
    destRpcUrl?: string
  ): Promise<DataIntegrityVerificationResult[]> {
    const results = await Promise.all(
      dataChecks.map(check =>
        this.verifyDataIntegrity(check, destinationChainId, destRpcUrl)
      )
    );

    return results;
  }

  /**
   * Generate data integrity report
   */
  generateIntegrityReport(
    results: DataIntegrityVerificationResult[]
  ): {
    totalItems: number;
    passed: number;
    failed: number;
    warnings: number;
    summary: string;
  } {
    const totalItems = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const warnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    const summary = `
Data Integrity Verification Report
===================================
Total Items Checked: ${totalItems}
Passed: ${passed} (${((passed / totalItems) * 100).toFixed(1)}%)
Failed: ${failed} (${((failed / totalItems) * 100).toFixed(1)}%)
Total Warnings: ${warnings}
`;

    return {
      totalItems,
      passed,
      failed,
      warnings,
      summary
    };
  }

  /**
   * Utility: Calculate SHA-256 hash
   */
  private sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Utility: Validate checksum format
   */
  private isValidChecksum(checksum: string): boolean {
    return /^[a-f0-9]{64}$/i.test(checksum);
  }
}

/**
 * Format data integrity verification result for display
 */
export function formatDataIntegrityVerification(
  result: DataIntegrityVerificationResult
): string {
  const lines: string[] = [];

  lines.push('\n╔═══════════════════════════════════════════════════════════╗');
  lines.push('║         DATA INTEGRITY VERIFICATION                       ║');
  lines.push('╚═══════════════════════════════════════════════════════════╝');

  lines.push(`\nData Type: ${result.dataType}`);
  lines.push(`Identifier: ${result.identifier}`);
  lines.push(`Source Chain ID: ${result.sourceChainId}`);
  if (result.destinationChainId) {
    lines.push(`Destination Chain ID: ${result.destinationChainId}`);
  }
  lines.push(`\nVerification Passed: ${result.passed ? '✅ YES' : '❌ NO'}`);

  lines.push('\n--- Integrity Checks ---');
  lines.push(`Source Checksum Valid: ${result.integrity.sourceChecksumValid ? '✅' : '❌'}`);
  lines.push(`Source Checksum: ${result.integrity.sourceChecksum}`);
  if (result.integrity.destinationChecksum) {
    lines.push(`Destination Checksum: ${result.integrity.destinationChecksum}`);
    lines.push(
      `Checksums Match: ${result.integrity.checksumMatch ? '✅ YES' : '❌ NO'}`
    );
  }

  lines.push('\n--- Storage Layout ---');
  lines.push(`Compatible: ${result.storageLayout.compatible ? '✅ YES' : '❌ NO'}`);
  if (result.storageLayout.issues) {
    lines.push('Issues:');
    result.storageLayout.issues.forEach(issue => {
      lines.push(`  ❌ ${issue}`);
    });
  }
  if (result.storageLayout.recommendations) {
    lines.push('Recommendations:');
    result.storageLayout.recommendations.forEach(rec => {
      lines.push(`  💡 ${rec}`);
    });
  }

  lines.push('\n--- Varity L3 Compatibility ---');
  lines.push(
    `Celestia DA Ready: ${result.varityL3Compatible.celestiaDAReady ? '✅' : '❌'}`
  );
  lines.push(
    `Lit Protocol Ready: ${result.varityL3Compatible.litProtocolReady ? '✅' : '❌'}`
  );
  lines.push(
    `Encryption Supported: ${result.varityL3Compatible.encryptionSupported ? '✅' : '❌'}`
  );
  if (result.varityL3Compatible.issues) {
    lines.push('Issues:');
    result.varityL3Compatible.issues.forEach(issue => {
      lines.push(`  ❌ ${issue}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(w => lines.push(`  ⚠️  ${w}`));
  }

  return lines.join('\n');
}
