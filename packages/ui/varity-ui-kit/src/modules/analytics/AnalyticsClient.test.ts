/**
 * Unit tests for AnalyticsClient
 */

import {
  AnalyticsClient,
  KPIResult,
  TrendDataPoint,
  LeaderboardEntry
} from './AnalyticsClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('AnalyticsClient', () => {
  let mockHttp: MockHTTPClient
  let analyticsClient: AnalyticsClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    analyticsClient = new AnalyticsClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('getKPIs', () => {
    it('should get KPI summary', async () => {
      const mockKPIs: KPIResult = {
        totalMerchants: 100,
        activeMerchants: 85,
        totalVolume: 1500000,
        totalResiduals: 15000,
        avgResidualPerMerchant: 176.47,
        timestamp: Date.now()
      }

      mockHttp.mockGet('/analytics/kpis', mockKPIs)

      const result = await analyticsClient.getKPIs({ period: 'current_month' })

      expect(result).toEqual(mockKPIs)
      expect(result.totalMerchants).toBe(100)
      expect(result.activeMerchants).toBe(85)
      expect(result.totalVolume).toBe(1500000)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0].method).toBe('GET')
      expect(history[0].path).toBe('/analytics/kpis')
    })

    it('should get KPIs without options', async () => {
      const mockKPIs: KPIResult = {
        totalMerchants: 50,
        activeMerchants: 40,
        totalVolume: 750000,
        totalResiduals: 7500,
        avgResidualPerMerchant: 150.0,
        timestamp: Date.now()
      }

      mockHttp.mockGet('/analytics/kpis', mockKPIs)

      const result = await analyticsClient.getKPIs()

      expect(result).toEqual(mockKPIs)
    })
  })

  describe('getTrends', () => {
    it('should get trend data', async () => {
      const mockTrends: TrendDataPoint[] = [
        { date: '2025-01-01', volume: 50000, residuals: 500, transactionCount: 100 },
        { date: '2025-01-02', volume: 55000, residuals: 550, transactionCount: 110 },
        { date: '2025-01-03', volume: 60000, residuals: 600, transactionCount: 120 }
      ]

      mockHttp.mockGet('/analytics/trends', mockTrends)

      const result = await analyticsClient.getTrends({
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        interval: 'day'
      })

      expect(result).toEqual(mockTrends)
      expect(result).toHaveLength(3)
      expect(result[0].volume).toBe(50000)
      expect(result[1].volume).toBe(55000)
      expect(result[2].volume).toBe(60000)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0].method).toBe('GET')
      expect(history[0].path).toBe('/analytics/trends')
    })
  })

  describe('getLeaderboard', () => {
    it('should get leaderboard data', async () => {
      const mockLeaderboard: LeaderboardEntry[] = [
        { id: '1', name: 'Merchant A', value: 100000, rank: 1 },
        { id: '2', name: 'Merchant B', value: 95000, rank: 2 },
        { id: '3', name: 'Merchant C', value: 90000, rank: 3 }
      ]

      mockHttp.mockGet('/analytics/leaderboard', mockLeaderboard)

      const result = await analyticsClient.getLeaderboard({
        metric: 'volume',
        limit: 10
      })

      expect(result).toEqual(mockLeaderboard)
      expect(result).toHaveLength(3)
      expect(result[0].rank).toBe(1)
      expect(result[0].value).toBe(100000)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0].method).toBe('GET')
      expect(history[0].path).toBe('/analytics/leaderboard')
    })
  })

  describe('getGrowthMetrics', () => {
    it('should get growth metrics', async () => {
      const mockGrowth = {
        merchantGrowth: 15.5,
        volumeGrowth: 22.3,
        residualGrowth: 18.7
      }

      mockHttp.mockGet('/analytics/growth-metrics', mockGrowth)

      const result = await analyticsClient.getGrowthMetrics('current_month')

      expect(result).toEqual(mockGrowth)
      expect(result.merchantGrowth).toBe(15.5)
      expect(result.volumeGrowth).toBe(22.3)
    })
  })

  describe('getTimeSeries', () => {
    it('should get time series data', async () => {
      const mockTimeSeries = {
        metric: 'volume',
        data: [
          { timestamp: 1704067200000, value: 50000 },
          { timestamp: 1704153600000, value: 55000 }
        ]
      }

      mockHttp.mockGet('/analytics/time-series', mockTimeSeries)

      const result = await analyticsClient.getTimeSeries('volume', {
        startDate: '2025-01-01',
        endDate: '2025-01-02'
      })

      expect(result).toEqual(mockTimeSeries)
      expect(result.metric).toBe('volume')
      expect(result.data).toHaveLength(2)
    })
  })

  describe('getComparative', () => {
    it('should get comparative analysis', async () => {
      const mockComparative = {
        metrics: ['volume', 'residuals'],
        comparison: {
          volume: { current: 100000, previous: 90000, change: 11.11 },
          residuals: { current: 1000, previous: 900, change: 11.11 }
        }
      }

      mockHttp.mockPost('/analytics/comparative', mockComparative)

      const result = await analyticsClient.getComparative(['volume', 'residuals'], {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      })

      expect(result).toEqual(mockComparative)
      expect(result.metrics).toHaveLength(2)
    })
  })

  describe('getRealtime', () => {
    it('should get realtime metrics', async () => {
      const mockRealtime = {
        activeUsers: 42,
        activeTransactions: 15,
        systemLoad: 0.65,
        timestamp: Date.now()
      }

      mockHttp.mockGet('/analytics/realtime', mockRealtime)

      const result = await analyticsClient.getRealtime()

      expect(result).toEqual(mockRealtime)
      expect(result.activeUsers).toBe(42)
      expect(result.systemLoad).toBe(0.65)
    })
  })
})
