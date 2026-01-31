/**
 * Varity SDK - Oracle Module
 *
 * Universal oracle data fetching.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
/**
 * OracleModule - Universal oracle data fetching
 *
 * @example
 * ```typescript
 * // Get oracle data
 * const data = await sdk.oracle.getData({
 *   source: 'chainlink',
 *   parameters: { asset: 'ETH/USD' }
 * })
 *
 * // Get price feed
 * const price = await sdk.oracle.getPrice('ETH')
 *
 * // Subscribe to updates
 * const sub = await sdk.oracle.subscribe(
 *   { source: 'chainlink', parameters: { asset: 'ETH/USD' } },
 *   (data) => console.log('New price:', data.value)
 * )
 * ```
 */
export class OracleModule {
    sdk;
    subscriptions = new Map();
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Get data from oracle
     *
     * @param query - Oracle query
     * @returns Oracle data
     */
    async getData(query) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/oracle/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(query)
        });
        if (!response.ok) {
            throw new Error(`Oracle query failed: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Subscribe to oracle data updates
     *
     * @param query - Oracle query
     * @param callback - Data callback
     * @returns Subscription
     */
    async subscribe(query, callback) {
        const subscriptionId = `${query.source}:${JSON.stringify(query.parameters)}`;
        // For v1, we use polling. Future versions could use WebSocket
        const pollInterval = setInterval(async () => {
            try {
                const data = await this.getData(query);
                callback(data);
            }
            catch (error) {
                console.error('Oracle subscription error:', error);
            }
        }, 5000); // Poll every 5 seconds
        this.subscriptions.set(subscriptionId, pollInterval);
        return {
            id: subscriptionId,
            unsubscribe: async () => {
                await this.unsubscribe(subscriptionId);
            }
        };
    }
    /**
     * Unsubscribe from oracle data
     *
     * @param subscriptionId - Subscription identifier
     */
    async unsubscribe(subscriptionId) {
        const interval = this.subscriptions.get(subscriptionId);
        if (interval) {
            clearInterval(interval);
            this.subscriptions.delete(subscriptionId);
            console.log(`✅ Unsubscribed from ${subscriptionId}`);
        }
    }
    /**
     * Get current price for an asset
     *
     * @param asset - Asset symbol (e.g., 'ETH', 'BTC')
     * @returns Price data
     */
    async getPrice(asset) {
        const data = await this.getData({
            source: 'chainlink',
            parameters: { asset: `${asset}/USD` }
        });
        return {
            asset,
            price: data.value,
            currency: 'USD',
            timestamp: data.timestamp,
            source: data.source
        };
    }
    /**
     * Get price history for an asset
     *
     * @param asset - Asset symbol
     * @param range - Time range
     * @returns Price history
     */
    async getPriceHistory(asset, range) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/oracle/price-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({
                asset,
                start: range.start.toISOString(),
                end: range.end.toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Price history failed: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Remove all subscriptions
     */
    async removeAllSubscriptions() {
        for (const [id, interval] of this.subscriptions.entries()) {
            clearInterval(interval);
        }
        this.subscriptions.clear();
        console.log('✅ All oracle subscriptions removed');
    }
}
//# sourceMappingURL=OracleModule.js.map