/**
 * AnalyticsModule - Universal analytics and reporting
 *
 * Provides KPIs, trends, leaderboards, growth metrics, and time-series analysis.
 * Works across all templates (ISO, Healthcare, Finance, Retail, etc.)
 * by reading template configuration to determine data sources.
 */
export class AnalyticsModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
    /**
     * Get KPI summary for a given period
     *
     * Universal method - works for any template.
     * Template configuration determines which KPIs to calculate.
     *
     * @example ISO Dashboard
     * ```typescript
     * const kpis = await sdk.analytics.getKPIs({ period: 'current_month' })
     * // Returns: total_volume, active_merchants, gross_residuals, etc.
     * ```
     *
     * @example Healthcare Dashboard
     * ```typescript
     * const kpis = await sdk.analytics.getKPIs({ period: 'current_month' })
     * // Returns: total_patients, active_appointments, provider_utilization, etc.
     * ```
     */
    async getKPIs(options = {}) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/kpis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get trend data for a specific metric
     *
     * Universal method - analyzes trends for any metric across any template.
     *
     * @example ISO Dashboard
     * ```typescript
     * const trends = await sdk.analytics.getTrends({
     *   metric: 'residuals',
     *   period: '30d',
     *   comparison: 'mom'
     * })
     * ```
     *
     * @example Healthcare Dashboard
     * ```typescript
     * const trends = await sdk.analytics.getTrends({
     *   metric: 'appointments',
     *   period: '90d',
     *   granularity: 'week'
     * })
     * ```
     */
    async getTrends(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/trends`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch trends: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get leaderboard for a specific metric
     *
     * Universal method - ranks entities by any performance metric.
     *
     * @example ISO Dashboard
     * ```typescript
     * const leaderboard = await sdk.analytics.getLeaderboard({
     *   metric: 'residuals',
     *   entity: 'reps',
     *   limit: 10,
     *   period: 'month'
     * })
     * // Returns: top 10 reps by residuals
     * ```
     *
     * @example Healthcare Dashboard
     * ```typescript
     * const leaderboard = await sdk.analytics.getLeaderboard({
     *   metric: 'patient_satisfaction',
     *   entity: 'providers',
     *   limit: 20
     * })
     * // Returns: top 20 providers by patient satisfaction
     * ```
     */
    async getLeaderboard(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/leaderboard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get growth metrics comparing current vs previous periods
     *
     * Universal method - calculates growth across any metrics and periods.
     *
     * @example ISO Dashboard
     * ```typescript
     * const growth = await sdk.analytics.getGrowthMetrics({
     *   metrics: ['volume', 'residuals', 'active_merchants'],
     *   comparison: 'mom'
     * })
     * ```
     *
     * @example Finance Dashboard
     * ```typescript
     * const growth = await sdk.analytics.getGrowthMetrics({
     *   metrics: ['aum', 'trades', 'revenue'],
     *   comparison: 'qoq',
     *   period: 'quarter'
     * })
     * ```
     */
    async getGrowthMetrics(options = {}) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/growth-metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch growth metrics: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Query time-series data for a metric
     *
     * Universal method - retrieves granular time-series data for any metric.
     * Supports flexible aggregation and filtering.
     *
     * @example ISO Dashboard
     * ```typescript
     * const timeSeries = await sdk.analytics.queryTimeSeries({
     *   metric: 'daily_volume',
     *   startDate: '2025-01-01',
     *   endDate: '2025-01-31',
     *   granularity: 'day',
     *   aggregation: 'sum'
     * })
     * ```
     *
     * @example Healthcare Dashboard
     * ```typescript
     * const timeSeries = await sdk.analytics.queryTimeSeries({
     *   metric: 'patient_visits',
     *   startDate: '2025-01-01',
     *   endDate: '2025-03-31',
     *   granularity: 'week',
     *   aggregation: 'count',
     *   filters: { department: 'cardiology' }
     * })
     * ```
     */
    async queryTimeSeries(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/time-series`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to query time-series: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Perform comparative analysis across multiple metrics and periods
     *
     * Universal method - compares any metrics across any time periods.
     * Useful for period-over-period analysis and identifying patterns.
     *
     * @example ISO Dashboard
     * ```typescript
     * const comparison = await sdk.analytics.compareMetrics({
     *   metrics: ['volume', 'residuals'],
     *   periods: [
     *     { start: '2024-01-01', end: '2024-03-31', label: 'Q1 2024' },
     *     { start: '2024-04-01', end: '2024-06-30', label: 'Q2 2024' },
     *     { start: '2024-07-01', end: '2024-09-30', label: 'Q3 2024' }
     *   ],
     *   breakdownBy: 'merchant_status'
     * })
     * ```
     */
    async compareMetrics(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/comparative`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to perform comparative analysis: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get real-time analytics snapshot
     *
     * Universal method - provides current real-time metrics.
     * Useful for live dashboards and monitoring.
     *
     * @example
     * ```typescript
     * const snapshot = await sdk.analytics.getRealTimeSnapshot({
     *   metrics: ['active_users', 'pending_transactions', 'system_load']
     * })
     * ```
     */
    async getRealTimeSnapshot(options = {}) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/analytics/realtime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch real-time snapshot: ${response.statusText}`);
        }
        return await response.json();
    }
}
//# sourceMappingURL=AnalyticsModule.js.map