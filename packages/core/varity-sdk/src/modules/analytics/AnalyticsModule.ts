import type { VaritySDK } from '../../core/VaritySDK'

/**
 * Analytics Module
 *
 * Universal analytics, reporting, KPIs, and metrics across all templates.
 * Works identically for ISO, Healthcare, Finance, Retail, etc.
 * Template configuration determines data sources and entities.
 */

export interface KPIOptions {
  period?: 'current_month' | 'current_quarter' | 'current_year' | 'custom'
  startDate?: string
  endDate?: string
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  entities?: string[] // e.g., ['merchants', 'transactions'] for ISO
}

export interface KPIResult {
  name: string
  value: number
  change?: number // % change vs previous period
  changeDirection?: 'up' | 'down' | 'stable'
  unit?: string
  metadata?: Record<string, any>
}

export interface KPISummary {
  period: {
    start: string
    end: string
    type: string
  }
  kpis: KPIResult[]
  summary: {
    totalEntities: number
    totalVolume: number
    totalRevenue?: number
    growthRate?: number
  }
  timestamp: string
}

export interface TrendOptions {
  metric: string // e.g., 'volume', 'residuals', 'appointments'
  period: string // e.g., '30d', '90d', '1y'
  granularity?: 'hour' | 'day' | 'week' | 'month'
  comparison?: 'mom' | 'yoy' | 'qoq' // month-over-month, year-over-year, etc.
  entity?: string // Optional: filter by specific entity
}

export interface TrendDataPoint {
  timestamp: string
  value: number
  label?: string
  metadata?: Record<string, any>
}

export interface TrendResult {
  metric: string
  period: string
  data: TrendDataPoint[]
  statistics: {
    min: number
    max: number
    avg: number
    median: number
    total: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
  growthRate?: number
  comparison?: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
}

export interface LeaderboardOptions {
  metric: string // e.g., 'residuals', 'patient_satisfaction', 'sales_volume'
  limit?: number // Default: 10
  period?: string // e.g., 'month', 'quarter', 'year'
  entity?: string // e.g., 'reps', 'providers', 'employees'
  startDate?: string
  endDate?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LeaderboardEntry {
  rank: number
  entityId: string
  entityName?: string
  value: number
  change?: number
  changePercent?: number
  metadata?: Record<string, any>
}

export interface LeaderboardResult {
  metric: string
  period: string
  entity: string
  entries: LeaderboardEntry[]
  totalEntries: number
  timestamp: string
}

export interface GrowthMetricsOptions {
  metrics?: string[] // Specific metrics to calculate
  period?: string // e.g., '30d', 'quarter', 'year'
  comparison?: 'mom' | 'yoy' | 'qoq' | 'wow' // week-over-week
  entities?: string[]
}

export interface GrowthMetric {
  metric: string
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'increasing' | 'decreasing' | 'stable'
  cagr?: number // Compound Annual Growth Rate (if applicable)
}

export interface GrowthMetricsResult {
  period: {
    current: { start: string; end: string }
    previous: { start: string; end: string }
  }
  metrics: GrowthMetric[]
  overallGrowth: number
  timestamp: string
}

export interface TimeSeriesOptions {
  metric: string
  startDate: string
  endDate: string
  granularity: 'hour' | 'day' | 'week' | 'month'
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  filters?: Record<string, any>
  entity?: string
}

export interface TimeSeriesResult {
  metric: string
  granularity: string
  aggregation: string
  data: TrendDataPoint[]
  statistics: {
    min: number
    max: number
    avg: number
    median: number
    total: number
    stdDev?: number
  }
}

export interface ComparativeAnalysisOptions {
  metrics: string[]
  periods: Array<{ start: string; end: string; label?: string }>
  entities?: string[]
  breakdownBy?: string // e.g., 'status', 'category', 'region'
}

export interface ComparativeResult {
  metric: string
  periods: Array<{
    label: string
    value: number
    breakdown?: Record<string, number>
  }>
  comparison: {
    maxPeriod: string
    minPeriod: string
    maxValue: number
    minValue: number
    variance: number
  }
}

/**
 * AnalyticsModule - Universal analytics and reporting
 *
 * Provides KPIs, trends, leaderboards, growth metrics, and time-series analysis.
 * Works across all templates (ISO, Healthcare, Finance, Retail, etc.)
 * by reading template configuration to determine data sources.
 */
export class AnalyticsModule {
  constructor(private sdk: VaritySDK) {}

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
  async getKPIs(options: KPIOptions = {}): Promise<KPISummary> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch KPIs: ${response.statusText}`)
    }

    return await response.json()
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
  async getTrends(options: TrendOptions): Promise<TrendResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/trends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch trends: ${response.statusText}`)
    }

    return await response.json()
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
  async getLeaderboard(options: LeaderboardOptions): Promise<LeaderboardResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
    }

    return await response.json()
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
  async getGrowthMetrics(options: GrowthMetricsOptions = {}): Promise<GrowthMetricsResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/growth-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch growth metrics: ${response.statusText}`)
    }

    return await response.json()
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
  async queryTimeSeries(options: TimeSeriesOptions): Promise<TimeSeriesResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/time-series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to query time-series: ${response.statusText}`)
    }

    return await response.json()
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
  async compareMetrics(options: ComparativeAnalysisOptions): Promise<ComparativeResult[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/comparative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to perform comparative analysis: ${response.statusText}`)
    }

    return await response.json()
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
  async getRealTimeSnapshot(options: { metrics?: string[] } = {}): Promise<{
    metrics: KPIResult[]
    timestamp: string
  }> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/analytics/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch real-time snapshot: ${response.statusText}`)
    }

    return await response.json()
  }
}
