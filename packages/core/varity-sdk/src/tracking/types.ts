/**
 * Gas Tracking Types
 *
 * Type definitions for gas usage tracking and billing.
 *
 * @module tracking/types
 */

/**
 * Billing status for gas usage records
 */
export type BillingStatus = 'pending' | 'billed' | 'paid';

/**
 * App identifier for gas tracking
 *
 * Used to associate gas usage with specific apps for billing.
 */
export interface AppIdentifier {
  /**
   * Unique app ID from Varity App Store
   */
  appId: string;

  /**
   * Developer's wallet address for billing
   */
  developerWallet: string;

  /**
   * App name (optional, for display purposes)
   */
  appName?: string;
}

/**
 * Gas usage record in database
 */
export interface GasUsageRecord {
  /**
   * Unique app identifier
   */
  appId: string;

  /**
   * Developer's wallet address
   */
  developerWallet: string;

  /**
   * Transaction hash on-chain
   */
  transactionHash: string;

  /**
   * Gas cost in USDC (6 decimal precision)
   */
  gasSponsoredUsdc: string;

  /**
   * Unix timestamp in milliseconds
   */
  timestamp: number;

  /**
   * Chain ID (33529 for Varity L3)
   */
  chainId: number;

  /**
   * End user's wallet address
   */
  userWallet: string;

  /**
   * Billing status
   */
  billingStatus: BillingStatus;

  /**
   * Billing month (YYYY-MM format)
   */
  billingMonth: string;

  /**
   * Record creation timestamp
   */
  createdAt: Date;

  /**
   * When invoice was generated (if billed)
   */
  billedAt?: Date;

  /**
   * When payment was received (if paid)
   */
  paidAt?: Date;
}

/**
 * App usage summary for billing
 */
export interface AppUsageSummary {
  /**
   * App identifier
   */
  appId: string;

  /**
   * App name (optional)
   */
  appName?: string;

  /**
   * Total gas used in USDC
   */
  gasUsedUsdc: string;

  /**
   * Number of transactions
   */
  transactions: number;
}

/**
 * Billing cycle record
 */
export interface BillingCycle {
  /**
   * Developer's wallet address
   */
  developerWallet: string;

  /**
   * Billing month (YYYY-MM format)
   */
  billingMonth: string;

  /**
   * List of apps and their usage
   */
  apps: AppUsageSummary[];

  /**
   * Total gas across all apps
   */
  totalGasUsdc: string;

  /**
   * Total transaction count
   */
  totalTransactions: number;

  /**
   * Billing status
   */
  billingStatus: BillingStatus;

  /**
   * Invoice ID (when billed)
   */
  invoiceId?: string;

  /**
   * Invoice amount in USD
   */
  invoiceAmountUsd?: string;

  /**
   * Payment transaction hash
   */
  paymentTxHash?: string;

  /**
   * Cycle creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * When invoice was generated
   */
  billedAt?: Date;

  /**
   * When payment was received
   */
  paidAt?: Date;

  /**
   * Payment due date
   */
  dueDate?: Date;
}

/**
 * Gas tracking statistics
 */
export interface GasTrackingStats {
  /**
   * Total gas tracked in USDC
   */
  totalGasUsdc: string;

  /**
   * Total transactions tracked
   */
  totalTransactions: number;

  /**
   * Average gas per transaction
   */
  averageGasPerTx: string;

  /**
   * Number of active apps
   */
  activeApps: number;

  /**
   * Number of active developers
   */
  activeDevelopers: number;

  /**
   * Tracking success rate (0-1)
   */
  successRate: number;
}

/**
 * Gas usage query options
 */
export interface GasUsageQueryOptions {
  /**
   * Filter by app ID
   */
  appId?: string;

  /**
   * Filter by developer wallet
   */
  developerWallet?: string;

  /**
   * Filter by billing month (YYYY-MM)
   */
  billingMonth?: string;

  /**
   * Filter by billing status
   */
  billingStatus?: BillingStatus;

  /**
   * Filter by chain ID
   */
  chainId?: number;

  /**
   * Start timestamp (inclusive)
   */
  startTimestamp?: number;

  /**
   * End timestamp (exclusive)
   */
  endTimestamp?: number;

  /**
   * Pagination: skip records
   */
  skip?: number;

  /**
   * Pagination: limit records
   */
  limit?: number;

  /**
   * Sort field
   */
  sortBy?: 'timestamp' | 'gasSponsored' | 'createdAt';

  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Gas usage query result
 */
export interface GasUsageQueryResult {
  /**
   * Gas usage records
   */
  records: GasUsageRecord[];

  /**
   * Total records matching query
   */
  total: number;

  /**
   * Number of records skipped
   */
  skip: number;

  /**
   * Number of records returned
   */
  limit: number;

  /**
   * Has more records
   */
  hasMore: boolean;
}

/**
 * Billing alert configuration
 */
export interface BillingAlert {
  /**
   * Alert ID
   */
  id: string;

  /**
   * Developer wallet
   */
  developerWallet: string;

  /**
   * Alert type
   */
  type: 'threshold' | 'anomaly' | 'overdue';

  /**
   * Threshold amount in USDC (for threshold alerts)
   */
  thresholdUsdc?: string;

  /**
   * Alert enabled
   */
  enabled: boolean;

  /**
   * Notification channels
   */
  channels: ('email' | 'sms' | 'webhook')[];

  /**
   * Webhook URL (if webhook channel enabled)
   */
  webhookUrl?: string;
}

/**
 * Export format for gas usage data
 */
export type GasExportFormat = 'csv' | 'json' | 'xlsx';

/**
 * Export options for gas usage data
 */
export interface GasExportOptions {
  /**
   * Export format
   */
  format: GasExportFormat;

  /**
   * Query options to filter data
   */
  query?: GasUsageQueryOptions;

  /**
   * Include headers in CSV/XLSX
   */
  includeHeaders?: boolean;

  /**
   * Timezone for timestamps
   */
  timezone?: string;
}
