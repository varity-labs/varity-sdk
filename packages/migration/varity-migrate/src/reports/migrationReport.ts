/**
 * Migration Report Generator
 *
 * Generates comprehensive migration reports including compatibility,
 * cost estimates, and recommendations.
 */

import { MigrationChainVerification } from '../verification/chainVerifier';
import { ContractVerificationResult } from '../verification/contractVerifier';
import { DataIntegrityVerificationResult } from '../verification/dataIntegrity';
import { PreFlightCheckResult } from '../preflight/checks';
import { getChainConfig, ChainConfig, VARITY_L3_CHAIN } from '../chains/chainConfig';

export interface MigrationReport {
  reportId: string;
  timestamp: Date;
  sourceChainId: number;
  destinationChainId: number;
  summary: {
    migrationAllowed: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: string;
    estimatedCost: string;
  };
  chainVerification: MigrationChainVerification;
  contractVerification?: {
    totalContracts: number;
    deployable: number;
    incompatible: number;
    results: ContractVerificationResult[];
  };
  dataIntegrity?: {
    totalItems: number;
    passed: number;
    failed: number;
    results: DataIntegrityVerificationResult[];
  };
  preFlightChecks?: PreFlightCheckResult;
  costAnalysis: {
    deploymentCosts: string;
    storageCosts: string;
    totalEstimate: string;
    comparisonWithCloud?: {
      cloudCost: string;
      varietyCost: string;
      savings: string;
      savingsPercent: number;
    };
  };
  recommendations: string[];
  warnings: string[];
  blockers: string[];
  nextSteps: string[];
}

export class MigrationReportGenerator {
  /**
   * Generate comprehensive migration report
   */
  async generateReport(
    sourceChainId: number,
    destinationChainId: number,
    chainVerification: MigrationChainVerification,
    contractResults?: ContractVerificationResult[],
    dataIntegrityResults?: DataIntegrityVerificationResult[],
    preFlightResult?: PreFlightCheckResult
  ): Promise<MigrationReport> {
    const reportId = this.generateReportId();
    const sourceConfig = getChainConfig(sourceChainId);
    const destConfig = getChainConfig(destinationChainId);

    if (!sourceConfig || !destConfig) {
      throw new Error('Invalid chain configuration');
    }

    const report: MigrationReport = {
      reportId,
      timestamp: new Date(),
      sourceChainId,
      destinationChainId,
      summary: {
        migrationAllowed: false,
        riskLevel: 'low',
        estimatedDuration: '0 minutes',
        estimatedCost: '0'
      },
      chainVerification,
      contractVerification: contractResults ? {
        totalContracts: contractResults.length,
        deployable: contractResults.filter(r => r.isDeployable).length,
        incompatible: contractResults.filter(r => !r.isDeployable).length,
        results: contractResults
      } : undefined,
      dataIntegrity: dataIntegrityResults ? {
        totalItems: dataIntegrityResults.length,
        passed: dataIntegrityResults.filter(r => r.passed).length,
        failed: dataIntegrityResults.filter(r => !r.passed).length,
        results: dataIntegrityResults
      } : undefined,
      preFlightChecks: preFlightResult,
      costAnalysis: {
        deploymentCosts: '0',
        storageCosts: '0',
        totalEstimate: '0'
      },
      recommendations: [],
      warnings: [],
      blockers: [],
      nextSteps: []
    };

    // Calculate summary
    report.summary = this.calculateSummary(
      chainVerification,
      contractResults,
      dataIntegrityResults,
      preFlightResult
    );

    // Calculate cost analysis
    report.costAnalysis = this.calculateCostAnalysis(
      sourceConfig,
      destConfig,
      contractResults?.length || 0,
      dataIntegrityResults?.length || 0
    );

    // Collect recommendations, warnings, and blockers
    this.collectFeedback(report, chainVerification, preFlightResult);

    // Generate next steps
    report.nextSteps = this.generateNextSteps(report);

    return report;
  }

  /**
   * Calculate migration summary
   */
  private calculateSummary(
    chainVerification: MigrationChainVerification,
    contractResults?: ContractVerificationResult[],
    dataIntegrityResults?: DataIntegrityVerificationResult[],
    preFlightResult?: PreFlightCheckResult
  ): MigrationReport['summary'] {
    let migrationAllowed = chainVerification.migrationAllowed;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check contract compatibility
    if (contractResults) {
      const incompatible = contractResults.filter(r => !r.isDeployable).length;
      const incompatiblePercent = (incompatible / contractResults.length) * 100;

      if (incompatiblePercent > 50) {
        riskLevel = 'critical';
        migrationAllowed = false;
      } else if (incompatiblePercent > 25) {
        riskLevel = 'high';
      } else if (incompatiblePercent > 10) {
        riskLevel = 'medium';
      }
    }

    // Check data integrity
    if (dataIntegrityResults) {
      const failed = dataIntegrityResults.filter(r => !r.passed).length;
      const failedPercent = (failed / dataIntegrityResults.length) * 100;

      if (failedPercent > 10) {
        riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
      }
    }

    // Check pre-flight results
    if (preFlightResult && !preFlightResult.passed) {
      migrationAllowed = false;
      riskLevel = 'critical';
    }

    // Estimate duration
    const numContracts = contractResults?.length || 0;
    const numDataItems = dataIntegrityResults?.length || 0;
    const estimatedMinutes = (numContracts * 2) + (numDataItems * 0.5) + 5;
    const estimatedDuration = estimatedMinutes < 60
      ? `${Math.ceil(estimatedMinutes)} minutes`
      : `${(estimatedMinutes / 60).toFixed(1)} hours`;

    // Estimate cost (simplified)
    const estimatedCost = this.estimateTotalCost(numContracts, numDataItems);

    return {
      migrationAllowed,
      riskLevel,
      estimatedDuration,
      estimatedCost
    };
  }

  /**
   * Calculate cost analysis
   */
  private calculateCostAnalysis(
    sourceConfig: ChainConfig,
    destConfig: ChainConfig,
    numContracts: number,
    numDataItems: number
  ): MigrationReport['costAnalysis'] {
    // Deployment costs (per contract)
    const deploymentGasPerContract = 3000000;
    const deploymentGasPrice = destConfig.chainId === VARITY_L3_CHAIN.chainId ? 0.1 : 20;
    const deploymentCostPerContract =
      (deploymentGasPerContract * deploymentGasPrice * 1e9) /
      Math.pow(10, destConfig.nativeCurrency.decimals);

    const totalDeploymentCost = deploymentCostPerContract * numContracts;
    const deploymentCosts = `${totalDeploymentCost.toFixed(4)} ${destConfig.nativeCurrency.symbol}`;

    // Storage costs (per data item per month)
    const storageCostPerItem = destConfig.chainId === VARITY_L3_CHAIN.chainId
      ? 0.01 // $0.01 per item per month on Varity L3
      : 0.10; // $0.10 per item per month on other chains

    const totalStorageCost = storageCostPerItem * numDataItems;
    const storageCosts = `$${totalStorageCost.toFixed(2)} per month`;

    // Total estimate
    const totalEstimate = `${deploymentCosts} + ${storageCosts}`;

    // Comparison with cloud (if destination is Varity L3)
    let comparisonWithCloud;
    if (destConfig.chainId === VARITY_L3_CHAIN.chainId) {
      const cloudMonthlyCost = numDataItems * 0.10; // Traditional cloud cost
      const varietyMonthlyCost = totalStorageCost;
      const savings = cloudMonthlyCost - varietyMonthlyCost;
      const savingsPercent = (savings / cloudMonthlyCost) * 100;

      comparisonWithCloud = {
        cloudCost: `$${cloudMonthlyCost.toFixed(2)}/month`,
        varietyCost: `$${varietyMonthlyCost.toFixed(2)}/month`,
        savings: `$${savings.toFixed(2)}/month`,
        savingsPercent: Math.round(savingsPercent)
      };
    }

    return {
      deploymentCosts,
      storageCosts,
      totalEstimate,
      comparisonWithCloud
    };
  }

  /**
   * Estimate total cost
   */
  private estimateTotalCost(numContracts: number, numDataItems: number): string {
    const contractCost = numContracts * 0.5; // $0.50 per contract (rough estimate)
    const dataCost = numDataItems * 0.01; // $0.01 per data item
    const total = contractCost + dataCost;
    return `$${total.toFixed(2)}`;
  }

  /**
   * Collect recommendations, warnings, and blockers
   */
  private collectFeedback(
    report: MigrationReport,
    chainVerification: MigrationChainVerification,
    preFlightResult?: PreFlightCheckResult
  ): void {
    // Chain verification feedback
    report.recommendations.push(...chainVerification.recommendations);
    report.blockers.push(...chainVerification.compatibilityIssues);

    // Pre-flight feedback
    if (preFlightResult) {
      report.recommendations.push(...preFlightResult.recommendations);
      report.warnings.push(...preFlightResult.warnings);
      report.blockers.push(...preFlightResult.blockers);
    }

    // Varity L3 specific recommendations
    if (report.destinationChainId === VARITY_L3_CHAIN.chainId) {
      report.recommendations.push(
        'Varity L3 Benefits:',
        '  • 90% cost savings compared to traditional cloud',
        '  • Lit Protocol encryption for maximum security',
        '  • Celestia DA for data availability',
        '  • Decentralized infrastructure (no single point of failure)',
        '  • Settlement to Arbitrum One for security'
      );

      report.recommendations.push(
        'Before Migration:',
        '  • Ensure you have sufficient USDC for gas fees',
        '  • Verify all decimal conversions (USDC uses 6 decimals)',
        '  • Test contract deployments on testnet first',
        '  • Backup all data before starting migration'
      );
    }
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(report: MigrationReport): string[] {
    const steps: string[] = [];

    if (!report.summary.migrationAllowed) {
      steps.push('❌ MIGRATION BLOCKED - Address the following issues:');
      report.blockers.forEach((blocker, i) => {
        steps.push(`   ${i + 1}. ${blocker}`);
      });
      return steps;
    }

    if (report.summary.riskLevel === 'critical' || report.summary.riskLevel === 'high') {
      steps.push('⚠️  HIGH RISK - Carefully review all warnings before proceeding');
    }

    steps.push('✅ Migration can proceed. Recommended steps:');
    steps.push('   1. Review this report thoroughly');
    steps.push('   2. Run pre-flight checks: varity migrate preflight --source-chain <id>');
    steps.push('   3. Test on testnet first (if available)');
    steps.push('   4. Backup all source data');
    steps.push('   5. Execute migration: varity migrate s3/gcs --verify');
    steps.push('   6. Verify data integrity after migration');
    steps.push('   7. Monitor for 24-48 hours after migration');

    return steps;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `MR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export report as JSON
   */
  exportAsJson(report: MigrationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as markdown
   */
  exportAsMarkdown(report: MigrationReport): string {
    const lines: string[] = [];

    lines.push('# Migration Report');
    lines.push('');
    lines.push(`**Report ID:** ${report.reportId}`);
    lines.push(`**Generated:** ${report.timestamp.toISOString()}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    const sourceConfig = getChainConfig(report.sourceChainId);
    const destConfig = getChainConfig(report.destinationChainId);
    lines.push(`- **Source Chain:** ${sourceConfig?.name} (${report.sourceChainId})`);
    lines.push(`- **Destination Chain:** ${destConfig?.name} (${report.destinationChainId})`);
    lines.push(`- **Migration Allowed:** ${report.summary.migrationAllowed ? '✅ Yes' : '❌ No'}`);
    lines.push(`- **Risk Level:** ${report.summary.riskLevel.toUpperCase()}`);
    lines.push(`- **Estimated Duration:** ${report.summary.estimatedDuration}`);
    lines.push(`- **Estimated Cost:** ${report.summary.estimatedCost}`);
    lines.push('');

    if (report.contractVerification) {
      lines.push('## Contract Verification');
      lines.push('');
      lines.push(`- **Total Contracts:** ${report.contractVerification.totalContracts}`);
      lines.push(`- **Deployable:** ${report.contractVerification.deployable}`);
      lines.push(`- **Incompatible:** ${report.contractVerification.incompatible}`);
      lines.push('');
    }

    if (report.dataIntegrity) {
      lines.push('## Data Integrity');
      lines.push('');
      lines.push(`- **Total Items:** ${report.dataIntegrity.totalItems}`);
      lines.push(`- **Passed:** ${report.dataIntegrity.passed}`);
      lines.push(`- **Failed:** ${report.dataIntegrity.failed}`);
      lines.push('');
    }

    lines.push('## Cost Analysis');
    lines.push('');
    lines.push(`- **Deployment Costs:** ${report.costAnalysis.deploymentCosts}`);
    lines.push(`- **Storage Costs:** ${report.costAnalysis.storageCosts}`);
    lines.push(`- **Total Estimate:** ${report.costAnalysis.totalEstimate}`);
    if (report.costAnalysis.comparisonWithCloud) {
      lines.push('');
      lines.push('### Cloud Cost Comparison');
      lines.push(`- **Traditional Cloud:** ${report.costAnalysis.comparisonWithCloud.cloudCost}`);
      lines.push(`- **Varity L3:** ${report.costAnalysis.comparisonWithCloud.varietyCost}`);
      lines.push(`- **Monthly Savings:** ${report.costAnalysis.comparisonWithCloud.savings} (${report.costAnalysis.comparisonWithCloud.savingsPercent}%)`);
    }
    lines.push('');

    if (report.blockers.length > 0) {
      lines.push('## ❌ Blockers (Must Fix)');
      lines.push('');
      report.blockers.forEach((blocker, i) => {
        lines.push(`${i + 1}. ${blocker}`);
      });
      lines.push('');
    }

    if (report.warnings.length > 0) {
      lines.push('## ⚠️  Warnings');
      lines.push('');
      report.warnings.forEach((warning, i) => {
        lines.push(`${i + 1}. ${warning}`);
      });
      lines.push('');
    }

    if (report.recommendations.length > 0) {
      lines.push('## 💡 Recommendations');
      lines.push('');
      report.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. ${rec}`);
      });
      lines.push('');
    }

    lines.push('## Next Steps');
    lines.push('');
    report.nextSteps.forEach((step) => {
      lines.push(step);
    });

    return lines.join('\n');
  }
}

/**
 * Format migration report for console display
 */
export function formatMigrationReport(report: MigrationReport): string {
  const lines: string[] = [];

  lines.push('\n╔═══════════════════════════════════════════════════════════╗');
  lines.push('║         BLOCKCHAIN MIGRATION REPORT                        ║');
  lines.push('╚═══════════════════════════════════════════════════════════╝');

  lines.push(`\nReport ID: ${report.reportId}`);
  lines.push(`Generated: ${report.timestamp.toISOString()}\n`);

  const sourceConfig = getChainConfig(report.sourceChainId);
  const destConfig = getChainConfig(report.destinationChainId);

  lines.push('═══ SUMMARY ═══');
  lines.push(`Source Chain: ${sourceConfig?.name} (${report.sourceChainId})`);
  lines.push(`Destination Chain: ${destConfig?.name} (${report.destinationChainId})`);
  lines.push(`Migration Allowed: ${report.summary.migrationAllowed ? '✅ YES' : '❌ NO'}`);
  lines.push(`Risk Level: ${report.summary.riskLevel.toUpperCase()}`);
  lines.push(`Estimated Duration: ${report.summary.estimatedDuration}`);
  lines.push(`Estimated Cost: ${report.summary.estimatedCost}\n`);

  if (report.contractVerification) {
    lines.push('═══ CONTRACT VERIFICATION ═══');
    lines.push(`Total Contracts: ${report.contractVerification.totalContracts}`);
    lines.push(`Deployable: ${report.contractVerification.deployable}`);
    lines.push(`Incompatible: ${report.contractVerification.incompatible}\n`);
  }

  if (report.dataIntegrity) {
    lines.push('═══ DATA INTEGRITY ═══');
    lines.push(`Total Items: ${report.dataIntegrity.totalItems}`);
    lines.push(`Passed: ${report.dataIntegrity.passed}`);
    lines.push(`Failed: ${report.dataIntegrity.failed}\n`);
  }

  lines.push('═══ COST ANALYSIS ═══');
  lines.push(`Deployment Costs: ${report.costAnalysis.deploymentCosts}`);
  lines.push(`Storage Costs: ${report.costAnalysis.storageCosts}`);
  lines.push(`Total Estimate: ${report.costAnalysis.totalEstimate}`);
  if (report.costAnalysis.comparisonWithCloud) {
    lines.push('\nCloud Cost Comparison:');
    lines.push(`  Traditional Cloud: ${report.costAnalysis.comparisonWithCloud.cloudCost}`);
    lines.push(`  Varity L3: ${report.costAnalysis.comparisonWithCloud.varietyCost}`);
    lines.push(`  Monthly Savings: ${report.costAnalysis.comparisonWithCloud.savings} (${report.costAnalysis.comparisonWithCloud.savingsPercent}%)`);
  }
  lines.push('');

  if (report.blockers.length > 0) {
    lines.push('═══ BLOCKERS (Must Fix) ═══');
    report.blockers.forEach((blocker, i) => {
      lines.push(`${i + 1}. ❌ ${blocker}`);
    });
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('═══ WARNINGS ═══');
    report.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. ⚠️  ${warning}`);
    });
    lines.push('');
  }

  if (report.recommendations.length > 0) {
    lines.push('═══ RECOMMENDATIONS ═══');
    report.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. 💡 ${rec}`);
    });
    lines.push('');
  }

  lines.push('═══ NEXT STEPS ═══');
  report.nextSteps.forEach(step => {
    lines.push(step);
  });

  return lines.join('\n');
}
