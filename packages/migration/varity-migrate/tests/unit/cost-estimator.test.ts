import { CostEstimator } from '../../src/utils/cost-estimator';

describe('CostEstimator', () => {
  let estimator: CostEstimator;

  beforeEach(() => {
    estimator = new CostEstimator();
  });

  describe('estimateS3Cost', () => {
    it('should estimate costs for small storage', () => {
      const estimate = estimator.estimateS3Cost(10); // 10 GB

      expect(estimate.storageGB).toBe(10);
      expect(estimate.currentMonthly).toBeGreaterThan(0);
      expect(estimate.varityMonthly).toBeGreaterThan(0);
      expect(estimate.savings).toBeGreaterThan(0);
      expect(estimate.savingsPercent).toBeGreaterThan(0);
    });

    it('should estimate costs for large storage', () => {
      const estimate = estimator.estimateS3Cost(1000); // 1 TB

      expect(estimate.storageGB).toBe(1000);
      expect(estimate.currentMonthly).toBeGreaterThan(20); // Adjusted expectation
      expect(estimate.savings).toBeGreaterThan(20);
    });

    it('should show significant savings for Varity', () => {
      const estimate = estimator.estimateS3Cost(100);

      expect(estimate.savingsPercent).toBeGreaterThan(80); // Should be ~90%
      expect(estimate.varityMonthly).toBeLessThan(estimate.currentMonthly);
    });

    it('should include operations costs', () => {
      const estimate1 = estimator.estimateS3Cost(10, 1000, 100);
      const estimate2 = estimator.estimateS3Cost(10, 10000, 1000);

      expect(estimate2.currentMonthly).toBeGreaterThan(estimate1.currentMonthly);
    });
  });

  describe('estimateGCSCost', () => {
    it('should estimate costs for GCS storage', () => {
      const estimate = estimator.estimateGCSCost(10);

      expect(estimate.storageGB).toBe(10);
      expect(estimate.currentMonthly).toBeGreaterThan(0);
      expect(estimate.varityMonthly).toBeGreaterThan(0);
      expect(estimate.savings).toBeGreaterThan(0);
    });

    it('should show significant savings for Varity', () => {
      const estimate = estimator.estimateGCSCost(100);

      expect(estimate.savingsPercent).toBeGreaterThan(80);
      expect(estimate.varityMonthly).toBeLessThan(estimate.currentMonthly);
    });

    it('should handle different operation counts', () => {
      const estimate1 = estimator.estimateGCSCost(10, 100, 1000);
      const estimate2 = estimator.estimateGCSCost(10, 1000, 10000);

      expect(estimate2.currentMonthly).toBeGreaterThan(estimate1.currentMonthly);
    });
  });

  describe('generateCostReport', () => {
    it('should generate formatted report', () => {
      const estimate = estimator.estimateS3Cost(100);
      const report = estimator.generateCostReport(estimate);

      expect(report).toContain('Cost Estimate Report');
      expect(report).toContain('Storage Size');
      expect(report).toContain('Current Monthly Cost');
      expect(report).toContain('Varity Monthly Cost');
      expect(report).toContain('Monthly Savings');
      expect(report).toContain('Annual Savings');
      expect(report).toContain('3-Year Savings');
    });

    it('should include storage size in report', () => {
      const estimate = estimator.estimateS3Cost(250);
      const report = estimator.generateCostReport(estimate);

      expect(report).toContain('250.00 GB');
    });

    it('should calculate annual and 3-year savings', () => {
      const estimate = estimator.estimateS3Cost(100);
      const report = estimator.generateCostReport(estimate);

      const annualSavings = estimate.savings * 12;
      const threeYearSavings = estimate.savings * 36;

      expect(report).toContain(annualSavings.toFixed(2));
      expect(report).toContain(threeYearSavings.toFixed(2));
    });
  });
});
