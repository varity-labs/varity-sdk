/**
 * Analytics Client - Analytics and reporting
 *
 * Handles analytics data retrieval via API server
 */

import { HTTPClient } from '../../utils/http'

export interface KPIOptions {
  period?: 'current_day' | 'current_week' | 'current_month' | 'current_year'
  metric?: string
}

export interface KPIResult {
  totalMerchants: number
  activeMerchants: number
  totalVolume: number
  totalResiduals: number
  avgResidualPerMerchant: number
  timestamp: number
}

export interface TrendOptions {
  startDate: string
  endDate: string
  interval?: 'day' | 'week' | 'month'
}

export interface TrendDataPoint {
  date: string
  volume: number
  residuals: number
  transactionCount: number
}

export interface LeaderboardOptions {
  metric: 'volume' | 'residuals' | 'transactions'
  limit?: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  value: number
  rank: number
}

export class AnalyticsClient {
  constructor(private http: HTTPClient) {}

  /**
   * Get KPI summary
   */
  async getKPIs(options?: KPIOptions): Promise<KPIResult> {
    return this.http.get<KPIResult>('/analytics/kpis', { params: options })
  }

  /**
   * Get trend data
   */
  async getTrends(options: TrendOptions): Promise<TrendDataPoint[]> {
    return this.http.get<TrendDataPoint[]>('/analytics/trends', { params: options })
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(options: LeaderboardOptions): Promise<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>('/analytics/leaderboard', { params: options })
  }

  /**
   * Get growth metrics
   */
  async getGrowthMetrics(period: string): Promise<any> {
    return this.http.get<any>('/analytics/growth-metrics', { params: { period } })
  }

  /**
   * Get time series data
   */
  async getTimeSeries(metric: string, options: TrendOptions): Promise<any> {
    return this.http.get<any>('/analytics/time-series', {
      params: { metric, ...options }
    })
  }

  /**
   * Get comparative analysis
   */
  async getComparative(metrics: string[], options: TrendOptions): Promise<any> {
    return this.http.post<any>('/analytics/comparative', { metrics, ...options })
  }

  /**
   * Get realtime metrics
   */
  async getRealtime(): Promise<any> {
    return this.http.get<any>('/analytics/realtime')
  }
}
