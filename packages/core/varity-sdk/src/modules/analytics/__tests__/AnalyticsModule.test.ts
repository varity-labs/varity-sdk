/**
 * AnalyticsModule Tests
 */

import { AnalyticsModule } from '../AnalyticsModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('AnalyticsModule', () => {
  let analyticsModule: AnalyticsModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    analyticsModule = new AnalyticsModule(mockSDK)
  })

  describe('getKPIs', () => {
    it('should get KPI summary', async () => {
      const mockKPIs = {
        period: { start: '2025-01-01', end: '2025-01-31', type: 'month' },
        kpis: [
          { name: 'revenue', value: 10000, change: 15, changeDirection: 'up' as const }
        ],
        summary: { totalEntities: 100, totalVolume: 50000, totalRevenue: 10000 },
        timestamp: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKPIs
      })

      const result = await analyticsModule.getKPIs({ period: 'current_month' })

      expect(result.kpis).toHaveLength(1)
      expect(result.summary.totalRevenue).toBe(10000)
    })
  })

  describe('getTrends', () => {
    it('should get trend data', async () => {
      const mockTrends = {
        metric: 'revenue',
        period: '30d',
        data: [{ timestamp: '2025-01-01', value: 1000 }],
        statistics: { min: 900, max: 1100, avg: 1000, median: 1000, total: 30000 },
        trend: 'increasing' as const,
        growthRate: 5
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrends
      })

      const result = await analyticsModule.getTrends({ metric: 'revenue', period: '30d' })

      expect(result.trend).toBe('increasing')
      expect(result.growthRate).toBe(5)
    })
  })

  describe('getLeaderboard', () => {
    it('should get leaderboard', async () => {
      const mockLeaderboard = {
        metric: 'sales',
        period: 'month',
        entity: 'reps',
        entries: [
          { rank: 1, entityId: 'rep-1', value: 100000, change: 10 }
        ],
        totalEntries: 10,
        timestamp: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard
      })

      const result = await analyticsModule.getLeaderboard({
        metric: 'sales',
        entity: 'reps'
      })

      expect(result.entries).toHaveLength(1)
      expect(result.entries[0].rank).toBe(1)
    })
  })

  describe('getGrowthMetrics', () => {
    it('should get growth metrics', async () => {
      const mockGrowth = {
        period: {
          current: { start: '2025-01-01', end: '2025-01-31' },
          previous: { start: '2024-12-01', end: '2024-12-31' }
        },
        metrics: [
          { metric: 'revenue', current: 10000, previous: 8000, change: 2000, changePercent: 25, trend: 'increasing' as const }
        ],
        overallGrowth: 20,
        timestamp: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGrowth
      })

      const result = await analyticsModule.getGrowthMetrics({ comparison: 'mom' })

      expect(result.metrics[0].changePercent).toBe(25)
    })
  })

  describe('queryTimeSeries', () => {
    it('should query time series data', async () => {
      const mockSeries = {
        metric: 'daily_sales',
        granularity: 'day',
        aggregation: 'sum',
        data: [{ timestamp: '2025-01-01', value: 1000 }],
        statistics: { min: 900, max: 1100, avg: 1000, median: 1000, total: 30000 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeries
      })

      const result = await analyticsModule.queryTimeSeries({
        metric: 'daily_sales',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        granularity: 'day'
      })

      expect(result.data).toHaveLength(1)
    })
  })

  describe('compareMetrics', () => {
    it('should compare metrics across periods', async () => {
      const mockComparison = [{
        metric: 'revenue',
        periods: [
          { label: 'Q1', value: 10000 },
          { label: 'Q2', value: 12000 }
        ],
        comparison: { maxPeriod: 'Q2', minPeriod: 'Q1', maxValue: 12000, minValue: 10000, variance: 2000 }
      }]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparison
      })

      const result = await analyticsModule.compareMetrics({
        metrics: ['revenue'],
        periods: [
          { start: '2025-01-01', end: '2025-03-31', label: 'Q1' },
          { start: '2025-04-01', end: '2025-06-30', label: 'Q2' }
        ]
      })

      expect(result).toHaveLength(1)
      expect(result[0].comparison.variance).toBe(2000)
    })
  })

  describe('getRealTimeSnapshot', () => {
    it('should get real-time snapshot', async () => {
      const mockSnapshot = {
        metrics: [
          { name: 'active_users', value: 150, unit: 'users' }
        ],
        timestamp: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSnapshot
      })

      const result = await analyticsModule.getRealTimeSnapshot()

      expect(result.metrics).toHaveLength(1)
    })
  })
})
