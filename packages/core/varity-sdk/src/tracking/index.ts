/**
 * Gas Tracking Module
 *
 * Tracks gas usage for per-app billing in Varity SDK.
 *
 * @module tracking
 */

export {
  trackGasUsage,
  trackTransactionGasUsage,
  waitForTransactionReceipt,
  calculateGasInUSDC,
  createGasTracker,
  type GasUsageEvent,
  type GasTransactionReceipt,
  type GasTrackerConfig,
} from './gasTracker';

export type {
  BillingStatus,
  AppIdentifier,
  GasUsageRecord,
  AppUsageSummary,
  BillingCycle,
  GasTrackingStats,
  GasUsageQueryOptions,
  GasUsageQueryResult,
  BillingAlert,
  GasExportFormat,
  GasExportOptions,
} from './types';
