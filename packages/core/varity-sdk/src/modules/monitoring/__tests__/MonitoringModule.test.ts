/**
 * MonitoringModule Tests
 */

import { MonitoringModule, TraceContext, SpanContext } from '../MonitoringModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('MonitoringModule', () => {
  let monitoringModule: MonitoringModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    monitoringModule = new MonitoringModule(mockSDK)
  })

  describe('getHealthStatus', () => {
    it('should get health status', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'healthy' as const, responseTime: 10 },
          api: { status: 'healthy' as const, responseTime: 5 }
        },
        uptime: 86400,
        version: '1.0.0'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      })

      const result = await monitoringModule.getHealthStatus()

      expect(result.status).toBe('healthy')
      expect(result.uptime).toBe(86400)
    })
  })

  describe('recordMetric', () => {
    it('should record metric', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(monitoringModule.recordMetric({
        name: 'api.latency',
        value: 150,
        type: 'histogram',
        unit: 'ms'
      })).resolves.not.toThrow()
    })
  })

  describe('queryMetrics', () => {
    it('should query metrics', async () => {
      const mockSeries = {
        name: 'api.latency',
        dataPoints: [
          { timestamp: '2025-01-01T00:00:00Z', value: 150 }
        ],
        aggregation: 'p95'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeries
      })

      const result = await monitoringModule.queryMetrics({
        name: 'api.latency',
        aggregation: 'p95'
      })

      expect(result.dataPoints).toHaveLength(1)
    })
  })

  describe('startTrace', () => {
    it('should start a trace', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'trace-123', name: 'test-trace' })
      })

      const trace = await monitoringModule.startTrace('test-trace', { userId: '123' })

      expect(trace).toBeInstanceOf(TraceContext)
      expect(trace.id).toBe('trace-123')
    })
  })

  describe('getTrace', () => {
    it('should get trace by ID', async () => {
      const mockTrace = {
        id: 'trace-123',
        name: 'test-trace',
        startTime: new Date().toISOString(),
        status: 'completed' as const,
        spans: []
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrace
      })

      const result = await monitoringModule.getTrace('trace-123')

      expect(result.id).toBe('trace-123')
    })
  })

  describe('reportError', () => {
    it('should report error', async () => {
      const mockReport = {
        id: 'error-123',
        error: 'Test error',
        timestamp: new Date().toISOString(),
        count: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport
      })

      const result = await monitoringModule.reportError(new Error('Test error'))

      expect(result.error).toBe('Test error')
    })

    it('should report string error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'error-123',
          error: 'String error',
          timestamp: new Date().toISOString(),
          count: 1,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        })
      })

      const result = await monitoringModule.reportError('String error')

      expect(result.error).toBe('String error')
    })
  })

  describe('getErrors', () => {
    it('should get errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'error-1', error: 'Error 1', count: 5 }
        ]
      })

      const result = await monitoringModule.getErrors({ limit: 10 })

      expect(result).toHaveLength(1)
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should get performance metrics', async () => {
      const mockPerf = {
        apiLatency: { avg: 100, p50: 90, p95: 150, p99: 200 },
        throughput: { requestsPerSecond: 100, requestsPerMinute: 6000 },
        errorRate: 0.1,
        uptime: 99.9,
        resourceUsage: { cpu: 45, memory: 60 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerf
      })

      const result = await monitoringModule.getPerformanceMetrics()

      expect(result.apiLatency.p95).toBe(150)
      expect(result.errorRate).toBe(0.1)
    })
  })

  describe('getActiveAlerts', () => {
    it('should get active alerts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'alert-1',
            name: 'High CPU',
            status: 'active',
            severity: 'high',
            triggeredAt: new Date().toISOString(),
            message: 'CPU usage above 80%'
          }
        ]
      })

      const result = await monitoringModule.getActiveAlerts()

      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe('high')
    })
  })

  describe('getUptime', () => {
    it('should get uptime', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          checks: {},
          uptime: 86400,
          version: '1.0.0'
        })
      })

      const uptime = await monitoringModule.getUptime()

      expect(uptime).toBe(86400)
    })
  })

  describe('recordEvent', () => {
    it('should record event', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(monitoringModule.recordEvent('user.login', {
        userId: '123'
      })).resolves.not.toThrow()
    })
  })

  describe('createDashboard', () => {
    it('should create dashboard', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'dashboard-123',
          url: 'https://monitor.varity.test/dashboard-123'
        })
      })

      const result = await monitoringModule.createDashboard({
        name: 'My Dashboard',
        metrics: ['api.latency', 'error.rate']
      })

      expect(result.id).toBe('dashboard-123')
    })
  })
})

describe('TraceContext', () => {
  let traceContext: TraceContext
  const mockSDK = {} as VaritySDK
  const apiEndpoint = 'https://api.varity.test'
  const apiKey = 'test-key'

  beforeEach(() => {
    jest.clearAllMocks()
    traceContext = new TraceContext('trace-123', 'test-trace', mockSDK, apiEndpoint, apiKey)
  })

  describe('startSpan', () => {
    it('should start span', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'span-123', name: 'test-span' })
      })

      const span = await traceContext.startSpan('test-span')

      expect(span).toBeInstanceOf(SpanContext)
    })
  })

  describe('end', () => {
    it('should end trace', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(traceContext.end()).resolves.not.toThrow()
    })
  })

  describe('error', () => {
    it('should end trace with error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(traceContext.error(new Error('Test'))).resolves.not.toThrow()
    })
  })
})

describe('SpanContext', () => {
  let spanContext: SpanContext

  beforeEach(() => {
    jest.clearAllMocks()
    spanContext = new SpanContext('span-123', 'trace-123', 'test-span', 'https://api.test', 'key')
  })

  describe('log', () => {
    it('should add log entry', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(spanContext.log('info', 'Test message')).resolves.not.toThrow()
    })
  })

  describe('end', () => {
    it('should end span', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(spanContext.end()).resolves.not.toThrow()
    })
  })

  describe('error', () => {
    it('should end span with error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(spanContext.error('Error')).resolves.not.toThrow()
    })
  })
})
