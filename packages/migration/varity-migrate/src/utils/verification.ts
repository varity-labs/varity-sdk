import { createHash } from 'crypto';
import { MigrationResult } from '../types';

export class Verifier {
  calculateHash(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  async verifyIntegrity(
    sourceHash: string,
    targetHash: string,
    objectKey: string
  ): Promise<{ valid: boolean; error?: string }> {
    if (sourceHash === targetHash) {
      return { valid: true };
    }

    return {
      valid: false,
      error: `Hash mismatch for ${objectKey}: source=${sourceHash}, target=${targetHash}`
    };
  }

  async verifyBatch(results: MigrationResult[]): Promise<{
    totalVerified: number;
    successful: number;
    failed: number;
    errors: Array<{ key: string; error: string }>;
  }> {
    const errors: Array<{ key: string; error: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const result of results) {
      if (!result.success) {
        failed++;
        if (result.error) {
          errors.push({ key: result.key, error: result.error });
        }
        continue;
      }

      if (result.sourceHash && result.targetHash) {
        const verification = await this.verifyIntegrity(
          result.sourceHash,
          result.targetHash,
          result.key
        );

        if (verification.valid) {
          successful++;
        } else {
          failed++;
          if (verification.error) {
            errors.push({ key: result.key, error: verification.error });
          }
        }
      } else {
        successful++;
      }
    }

    return {
      totalVerified: results.length,
      successful,
      failed,
      errors
    };
  }

  generateVerificationReport(results: MigrationResult[]): string {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const successRate = ((successful / total) * 100).toFixed(2);

    let report = `\n=== Verification Report ===\n`;
    report += `Total Objects: ${total}\n`;
    report += `Successful: ${successful} (${successRate}%)\n`;
    report += `Failed: ${failed}\n`;

    if (failed > 0) {
      report += `\nFailed Objects:\n`;
      results
        .filter(r => !r.success)
        .forEach(r => {
          report += `  - ${r.key}: ${r.error || 'Unknown error'}\n`;
        });
    }

    return report;
  }
}
