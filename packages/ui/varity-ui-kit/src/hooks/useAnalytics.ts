/**
 * useAnalytics - Analytics data fetching and tracking hook
 *
 * Provides easy access to analytics data with automatic caching and refresh.
 */

import { useState, useEffect, useCallback } from 'react'
import { useVarityAPI } from './useVarityAPI'
import type { KPIResult, TrendResponse, AnalyticsPeriod } from '../types/api-extensions'

export interface KPIData {
  /** KPI identifier */
  id: string
  /** KPI label */
  label: string
  /** KPI value */
  value: number | string
  /** Value unit */
  unit?: string
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral'
  /** Trend percentage */
  trendValue?: number
  /** Comparison period */
  comparisonPeriod?: string
}

export interface AnalyticsData {
  /** Key performance indicators */
  kpis: KPIData[]
  /** Time series data */
  timeSeries?: Array<{ date: string; value: number }>
  /** Additional metrics */
  metrics?: Record<string, any>
}

export interface UseAnalyticsOptions {
  /** Time period for analytics */
  period?: AnalyticsPeriod
  /** Start date for custom period */
  startDate?: string
  /** End date for custom period */
  endDate?: string
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number
  /** Enable caching */
  cache?: boolean
}

export interface UseAnalyticsReturn {
  /** Analytics data */
  data: AnalyticsData | null
  /** Loading state */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Refetch data */
  refetch: () => Promise<void>
  /** Track custom event */
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>
}

/**
 * useAnalytics Hook
 *
 * Fetch and track analytics data.
 *
 * @example
 * ```tsx
 * const { data, loading, trackEvent } = useAnalytics({
 *   period: 'current_month',
 *   refreshInterval: 30000
 * })
 *
 * // Track custom event
 * await trackEvent('button_clicked', { buttonId: 'export' })
 * ```
 */
export const useAnalytics = (options: UseAnalyticsOptions = {}): UseAnalyticsReturn => {
  const { client } = useVarityAPI()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { period = 'current_month', refreshInterval, cache = true } = options

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch KPIs
      const kpisResponse = await (client as any).analytics.getKPIs({ period }) as KPIResult

      // Fetch trends if available
      let timeSeries
      if (options.startDate && options.endDate) {
        const trendsResponse = await (client as any).analytics.getTrends({
          startDate: options.startDate,
          endDate: options.endDate
        }) as TrendResponse
        timeSeries = trendsResponse.data
      }

      setData({
        kpis: kpisResponse.kpis || [],
        timeSeries,
        metrics: kpisResponse.metrics
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch analytics')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [client, period, options.startDate, options.endDate])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh if interval is set
  useEffect(() => {
    if (!refreshInterval) return

    const interval = setInterval(() => {
      fetchAnalytics()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, fetchAnalytics])

  const trackEvent = useCallback(async (eventName: string, properties?: Record<string, any>) => {
    try {
      // Track event via analytics API
      await (client as any).analytics.trackEvent({
        event: eventName,
        properties: properties || {},
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to track event:', err)
    }
  }, [client])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
    trackEvent
  }
}

/**
 * useKPI Hook
 *
 * Fetch a single KPI with real-time updates.
 *
 * @example
 * ```tsx
 * const { value, trend, loading } = useKPI('total_revenue', { period: 'current_month' })
 * ```
 */
export const useKPI = (kpiId: string, options: UseAnalyticsOptions = {}) => {
  const { data, loading, error, refetch } = useAnalytics(options)

  const kpi = data?.kpis?.find((k) => k.id === kpiId) || null

  return {
    value: kpi?.value || null,
    unit: kpi?.unit,
    trend: kpi?.trend,
    trendValue: kpi?.trendValue,
    loading,
    error,
    refetch
  }
}
