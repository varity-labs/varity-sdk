/**
 * Varity SDK - Oracle Module
 *
 * Universal oracle data fetching.
 * Works across all templates (ISO, Healthcare, Retail, etc.)
 */
import type { VaritySDK } from '../../core/VaritySDK';
export interface OracleQuery {
    source: string;
    parameters: Record<string, any>;
}
export interface OracleData {
    value: any;
    timestamp: number;
    source: string;
    confidence?: number;
}
export interface DataCallback {
    (data: OracleData): void;
}
export interface Subscription {
    id: string;
    unsubscribe: () => Promise<void>;
}
export interface PriceData {
    asset: string;
    price: number;
    currency: string;
    timestamp: number;
    source: string;
}
export interface TimeRange {
    start: Date;
    end: Date;
}
export interface PriceHistory {
    asset: string;
    prices: Array<{
        price: number;
        timestamp: number;
    }>;
    range: TimeRange;
}
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
export declare class OracleModule {
    private sdk;
    private subscriptions;
    constructor(sdk: VaritySDK);
    /**
     * Get data from oracle
     *
     * @param query - Oracle query
     * @returns Oracle data
     */
    getData(query: OracleQuery): Promise<OracleData>;
    /**
     * Subscribe to oracle data updates
     *
     * @param query - Oracle query
     * @param callback - Data callback
     * @returns Subscription
     */
    subscribe(query: OracleQuery, callback: DataCallback): Promise<Subscription>;
    /**
     * Unsubscribe from oracle data
     *
     * @param subscriptionId - Subscription identifier
     */
    unsubscribe(subscriptionId: string): Promise<void>;
    /**
     * Get current price for an asset
     *
     * @param asset - Asset symbol (e.g., 'ETH', 'BTC')
     * @returns Price data
     */
    getPrice(asset: string): Promise<PriceData>;
    /**
     * Get price history for an asset
     *
     * @param asset - Asset symbol
     * @param range - Time range
     * @returns Price history
     */
    getPriceHistory(asset: string, range: TimeRange): Promise<PriceHistory>;
    /**
     * Remove all subscriptions
     */
    removeAllSubscriptions(): Promise<void>;
}
//# sourceMappingURL=OracleModule.d.ts.map