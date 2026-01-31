/**
 * thirdweb x402 Payment Protocol Client
 *
 * Monetize APIs with blockchain micropayments
 * Implements HTTP 402 (Payment Required) with crypto payments
 *
 * Features:
 * - Pay-per-call API monetization
 * - Automatic revenue splitting (70/30 model)
 * - Usage tracking and analytics
 * - Subscription-based access
 * - Metered billing
 * - Multi-chain support
 */
import type { ThirdwebClient, Chain } from 'thirdweb';
/**
 * x402 configuration
 */
export interface x402Config {
    /**
     * thirdweb client instance
     */
    client: ThirdwebClient;
    /**
     * Revenue split recipients (addresses and percentages)
     */
    revenueSplit?: {
        recipient: string;
        percentage: number;
    }[];
    /**
     * Default chain for payments
     */
    defaultChain?: Chain;
}
/**
 * Payment endpoint configuration
 */
export interface PaymentEndpointConfig {
    /**
     * API endpoint URL to monetize
     */
    url: string;
    /**
     * Price per API call (in tokens)
     */
    pricePerCall: string;
    /**
     * Payment token contract address
     */
    paymentToken: string;
    /**
     * Chain for payments
     */
    chain: Chain;
    /**
     * Revenue split configuration (overrides default)
     */
    revenueSplit?: {
        recipient: string;
        percentage: number;
    }[];
    /**
     * Rate limit per user
     */
    rateLimit?: {
        calls: number;
        periodSeconds: number;
    };
    /**
     * Free tier allowance
     */
    freeTier?: {
        callsPerDay: number;
    };
}
/**
 * Payment stats for an endpoint
 */
export interface PaymentStats {
    /**
     * Endpoint URL
     */
    url: string;
    /**
     * Total calls
     */
    totalCalls: number;
    /**
     * Total revenue earned (in tokens)
     */
    totalRevenue: string;
    /**
     * Unique payers
     */
    uniquePayers: number;
    /**
     * Average revenue per call
     */
    averageRevenuePerCall: string;
    /**
     * Revenue breakdown by recipient
     */
    revenueByRecipient: {
        recipient: string;
        amount: string;
        percentage: number;
    }[];
    /**
     * Time period
     */
    period: {
        start: Date;
        end: Date;
    };
}
/**
 * Usage record for tracking API consumption
 */
export interface UsageRecord {
    /**
     * User/wallet address
     */
    user: string;
    /**
     * Endpoint URL
     */
    endpoint: string;
    /**
     * Timestamp
     */
    timestamp: Date;
    /**
     * Cost for this call
     */
    cost: string;
    /**
     * Payment transaction hash
     */
    txHash: string;
    /**
     * Request metadata
     */
    metadata?: {
        method: string;
        responseTime: number;
        statusCode: number;
    };
}
/**
 * Subscription plan
 */
export interface SubscriptionPlan {
    /**
     * Plan ID
     */
    id: string;
    /**
     * Plan name
     */
    name: string;
    /**
     * Price per period
     */
    price: string;
    /**
     * Payment token
     */
    paymentToken: string;
    /**
     * Billing period in days
     */
    periodDays: number;
    /**
     * Included API calls per period
     */
    includedCalls: number;
    /**
     * Price per additional call (beyond included)
     */
    overagePrice?: string;
    /**
     * Accessible endpoints
     */
    endpoints: string[];
}
/**
 * Active subscription
 */
export interface Subscription {
    /**
     * Subscription ID
     */
    id: string;
    /**
     * User address
     */
    user: string;
    /**
     * Plan
     */
    plan: SubscriptionPlan;
    /**
     * Current period start
     */
    periodStart: Date;
    /**
     * Current period end
     */
    periodEnd: Date;
    /**
     * Calls used in current period
     */
    callsUsed: number;
    /**
     * Status
     */
    status: 'active' | 'cancelled' | 'expired';
    /**
     * Next renewal date
     */
    nextRenewal: Date;
}
/**
 * thirdweb x402 Payment Protocol Client
 *
 * Monetize your APIs with blockchain micropayments
 */
export declare class x402Client {
    private client;
    private revenueSplit;
    private defaultChain?;
    private baseUrl;
    constructor(config: x402Config);
    /**
     * Create a payment-required endpoint
     */
    createPaymentEndpoint(config: PaymentEndpointConfig): Promise<{
        endpointId: string;
        paymentUrl: string;
    }>;
    /**
     * Track API usage
     */
    trackUsage(usage: Omit<UsageRecord, 'timestamp'>): Promise<void>;
    /**
     * Get payment stats for an endpoint
     */
    getPaymentStats(endpointUrl: string, period?: {
        start: Date;
        end: Date;
    }): Promise<PaymentStats>;
    /**
     * Create a subscription plan
     */
    createSubscription(plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan>;
    /**
     * Subscribe a user to a plan
     */
    subscribe(user: string, planId: string): Promise<Subscription>;
    /**
     * Get active subscriptions for a user
     */
    getSubscriptions(user: string): Promise<Subscription[]>;
    /**
     * Cancel a subscription
     */
    cancelSubscription(subscriptionId: string): Promise<void>;
    /**
     * Withdraw earned revenue
     */
    withdrawRevenue(recipient: string, amount: string, chain: Chain): Promise<{
        txHash: string;
        amount: string;
    }>;
    /**
     * Get usage history for a user
     */
    getUsageHistory(user: string, options?: {
        endpoint?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<UsageRecord[]>;
    /**
     * Verify payment for a request
     */
    verifyPayment(txHash: string, expectedAmount: string): Promise<{
        valid: boolean;
        amount: string;
        from: string;
    }>;
    /**
     * Update revenue split configuration
     */
    updateRevenueSplit(endpointId: string, revenueSplit: {
        recipient: string;
        percentage: number;
    }[]): Promise<void>;
    /**
     * Get total earnings for a recipient
     */
    getTotalEarnings(recipient: string, chain?: Chain): Promise<{
        total: string;
        byToken: {
            token: string;
            amount: string;
        }[];
    }>;
}
/**
 * Create x402 client instance
 */
export declare function createx402Client(config: x402Config): x402Client;
/**
 * Middleware for Express/Fastify to enforce x402 payments
 */
export declare function x402Middleware(client: x402Client, endpointConfig: PaymentEndpointConfig): (req: any, res: any, next: any) => Promise<void>;
//# sourceMappingURL=x402Client.d.ts.map