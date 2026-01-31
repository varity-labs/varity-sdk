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
/**
 * thirdweb x402 Payment Protocol Client
 *
 * Monetize your APIs with blockchain micropayments
 */
export class x402Client {
    client;
    revenueSplit;
    defaultChain;
    baseUrl = 'https://x402.thirdweb.com/api';
    constructor(config) {
        this.client = config.client;
        this.revenueSplit = config.revenueSplit || [
            { recipient: '0x0', percentage: 70 }, // Creator gets 70%
            { recipient: 'thirdweb', percentage: 30 }, // thirdweb gets 30%
        ];
        this.defaultChain = config.defaultChain;
    }
    /**
     * Create a payment-required endpoint
     */
    async createPaymentEndpoint(config) {
        console.warn('x402 API is placeholder - actual implementation pending');
        // Generate unique endpoint ID
        const endpointId = `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Mock implementation
        return {
            endpointId,
            paymentUrl: `${this.baseUrl}/pay/${endpointId}`,
        };
    }
    /**
     * Track API usage
     */
    async trackUsage(usage) {
        console.warn('x402 API is placeholder - actual implementation pending');
        // Mock usage tracking
        console.log('Usage tracked:', {
            ...usage,
            timestamp: new Date(),
        });
    }
    /**
     * Get payment stats for an endpoint
     */
    async getPaymentStats(endpointUrl, period) {
        console.warn('x402 API is placeholder - actual implementation pending');
        // Mock stats
        return {
            url: endpointUrl,
            totalCalls: 1000,
            totalRevenue: '1000.0',
            uniquePayers: 50,
            averageRevenuePerCall: '1.0',
            revenueByRecipient: this.revenueSplit.map(split => ({
                recipient: split.recipient,
                amount: ((1000 * split.percentage) / 100).toString(),
                percentage: split.percentage,
            })),
            period: period || {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date(),
            },
        };
    }
    /**
     * Create a subscription plan
     */
    async createSubscription(plan) {
        console.warn('x402 API is placeholder - actual implementation pending');
        return {
            id: `plan_${Date.now()}`,
            ...plan,
        };
    }
    /**
     * Subscribe a user to a plan
     */
    async subscribe(user, planId) {
        console.warn('x402 API is placeholder - actual implementation pending');
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return {
            id: `sub_${Date.now()}`,
            user,
            plan: {
                id: planId,
                name: 'Basic Plan',
                price: '10.0',
                paymentToken: '0x0',
                periodDays: 30,
                includedCalls: 1000,
                endpoints: [],
            },
            periodStart: now,
            periodEnd,
            callsUsed: 0,
            status: 'active',
            nextRenewal: periodEnd,
        };
    }
    /**
     * Get active subscriptions for a user
     */
    async getSubscriptions(user) {
        console.warn('x402 API is placeholder - actual implementation pending');
        return [];
    }
    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId) {
        console.warn('x402 API is placeholder - actual implementation pending');
        console.log(`Subscription ${subscriptionId} cancelled`);
    }
    /**
     * Withdraw earned revenue
     */
    async withdrawRevenue(recipient, amount, chain) {
        console.warn('x402 API is placeholder - actual implementation pending');
        return {
            txHash: `0x${Math.random().toString(16).substr(2)}`,
            amount,
        };
    }
    /**
     * Get usage history for a user
     */
    async getUsageHistory(user, options) {
        console.warn('x402 API is placeholder - actual implementation pending');
        return [];
    }
    /**
     * Verify payment for a request
     */
    async verifyPayment(txHash, expectedAmount) {
        console.warn('x402 API is placeholder - actual implementation pending');
        return {
            valid: true,
            amount: expectedAmount,
            from: '0x0',
        };
    }
    /**
     * Update revenue split configuration
     */
    async updateRevenueSplit(endpointId, revenueSplit) {
        // Validate splits add up to 100%
        const total = revenueSplit.reduce((sum, split) => sum + split.percentage, 0);
        if (total !== 100) {
            throw new Error('Revenue split percentages must add up to 100%');
        }
        console.warn('x402 API is placeholder - actual implementation pending');
    }
    /**
     * Get total earnings for a recipient
     */
    async getTotalEarnings(recipient, chain) {
        console.warn('x402 API is placeholder - actual implementation pending');
        return {
            total: '0',
            byToken: [],
        };
    }
}
/**
 * Create x402 client instance
 */
export function createx402Client(config) {
    return new x402Client(config);
}
/**
 * Middleware for Express/Fastify to enforce x402 payments
 */
export function x402Middleware(client, endpointConfig) {
    return async (req, res, next) => {
        // Check for payment proof in headers
        const paymentProof = req.headers['x-payment-proof'];
        if (!paymentProof) {
            res.status(402).json({
                error: 'Payment Required',
                message: 'This API requires payment',
                price: endpointConfig.pricePerCall,
                paymentToken: endpointConfig.paymentToken,
                chain: endpointConfig.chain.id,
            });
            return;
        }
        try {
            // Verify payment
            const payment = await client.verifyPayment(paymentProof, endpointConfig.pricePerCall);
            if (!payment.valid) {
                throw new Error('Invalid payment');
            }
            // Track usage
            await client.trackUsage({
                user: payment.from,
                endpoint: endpointConfig.url,
                cost: payment.amount,
                txHash: paymentProof,
            });
            // Allow request to proceed
            next();
        }
        catch (error) {
            res.status(402).json({
                error: 'Payment Verification Failed',
                message: error.message,
            });
        }
    };
}
//# sourceMappingURL=x402Client.js.map