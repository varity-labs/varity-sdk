import { CostEstimate } from '../types';

export class CostEstimator {
  // AWS S3 pricing (us-east-1)
  private static S3_STORAGE_PER_GB = 0.023; // Standard storage
  private static S3_REQUEST_PUT_PER_1000 = 0.005;
  private static S3_REQUEST_GET_PER_1000 = 0.0004;
  private static S3_DATA_TRANSFER_OUT_PER_GB = 0.09;

  // Google Cloud Storage pricing
  private static GCS_STORAGE_PER_GB = 0.020; // Standard storage
  private static GCS_OPERATIONS_CLASS_A_PER_10000 = 0.05;
  private static GCS_OPERATIONS_CLASS_B_PER_10000 = 0.004;
  private static GCS_NETWORK_EGRESS_PER_GB = 0.12;

  // Varity pricing (Filecoin + IPFS)
  private static VARITY_STORAGE_PER_GB = 0.0025; // ~90% cheaper
  private static VARITY_BANDWIDTH_PER_GB = 0.01;
  private static VARITY_OPERATIONS_PER_1000 = 0.0001;

  estimateS3Cost(storageGB: number, monthlyGets: number = 10000, monthlyPuts: number = 1000): CostEstimate {
    const storage = storageGB * CostEstimator.S3_STORAGE_PER_GB;
    const gets = (monthlyGets / 1000) * CostEstimator.S3_REQUEST_GET_PER_1000;
    const puts = (monthlyPuts / 1000) * CostEstimator.S3_REQUEST_PUT_PER_1000;
    const transfer = (storageGB * 0.1) * CostEstimator.S3_DATA_TRANSFER_OUT_PER_GB; // Assume 10% monthly transfer

    const currentMonthly = storage + gets + puts + transfer;
    const varityMonthly = this.estimateVarityCost(storageGB, monthlyGets, monthlyPuts);

    return {
      currentMonthly: parseFloat(currentMonthly.toFixed(2)),
      varityMonthly: parseFloat(varityMonthly.toFixed(2)),
      savings: parseFloat((currentMonthly - varityMonthly).toFixed(2)),
      savingsPercent: parseFloat(((1 - varityMonthly / currentMonthly) * 100).toFixed(2)),
      storageGB
    };
  }

  estimateGCSCost(storageGB: number, monthlyClassA: number = 1000, monthlyClassB: number = 10000): CostEstimate {
    const storage = storageGB * CostEstimator.GCS_STORAGE_PER_GB;
    const classA = (monthlyClassA / 10000) * CostEstimator.GCS_OPERATIONS_CLASS_A_PER_10000;
    const classB = (monthlyClassB / 10000) * CostEstimator.GCS_OPERATIONS_CLASS_B_PER_10000;
    const transfer = (storageGB * 0.1) * CostEstimator.GCS_NETWORK_EGRESS_PER_GB;

    const currentMonthly = storage + classA + classB + transfer;
    const varityMonthly = this.estimateVarityCost(storageGB, monthlyClassB, monthlyClassA);

    return {
      currentMonthly: parseFloat(currentMonthly.toFixed(2)),
      varityMonthly: parseFloat(varityMonthly.toFixed(2)),
      savings: parseFloat((currentMonthly - varityMonthly).toFixed(2)),
      savingsPercent: parseFloat(((1 - varityMonthly / currentMonthly) * 100).toFixed(2)),
      storageGB
    };
  }

  private estimateVarityCost(storageGB: number, monthlyReads: number, monthlyWrites: number): number {
    const storage = storageGB * CostEstimator.VARITY_STORAGE_PER_GB;
    const bandwidth = (storageGB * 0.1) * CostEstimator.VARITY_BANDWIDTH_PER_GB;
    const operations = ((monthlyReads + monthlyWrites) / 1000) * CostEstimator.VARITY_OPERATIONS_PER_1000;

    return storage + bandwidth + operations;
  }

  generateCostReport(estimate: CostEstimate): string {
    let report = `\n=== Cost Estimate Report ===\n`;
    report += `Storage Size: ${estimate.storageGB.toFixed(2)} GB\n\n`;
    report += `Current Monthly Cost: $${estimate.currentMonthly.toFixed(2)}\n`;
    report += `Varity Monthly Cost:  $${estimate.varityMonthly.toFixed(2)}\n`;
    report += `Monthly Savings:      $${estimate.savings.toFixed(2)} (${estimate.savingsPercent.toFixed(2)}%)\n\n`;
    report += `Annual Savings:       $${(estimate.savings * 12).toFixed(2)}\n`;
    report += `3-Year Savings:       $${(estimate.savings * 36).toFixed(2)}\n`;

    return report;
  }
}
