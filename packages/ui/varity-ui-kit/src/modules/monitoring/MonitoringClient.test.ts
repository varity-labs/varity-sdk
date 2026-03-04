/**
 * Unit tests for MonitoringClient
 */

import {
  MonitoringClient,
  HealthStatus,
  Metric,
  LogEntry,
  ErrorReport
} from './MonitoringClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('MonitoringClient', () => {
  let mockHttp: MockHTTPClient
  let monitoringClient: MonitoringClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    monitoringClient = new MonitoringClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('health', () => {
    it('should get system health status', async () => {
      const mockHealth: HealthStatus = {
        status: 'healthy',
        services: {
          database: 'up',
          redis: 'up',
          api: 'up'
        },
        timestamp: Date.now()
      }

      mockHttp.mockGet('/monitoring/health', mockHealth)

      const result = await monitoringClient.health()

      expect(result).toEqual(mockHealth)
      expect(result.status).toBe('healthy')
      expect(result.services.database).toBe('up')
    })
  })

  describe('metrics', () => {
    it('should get metrics', async () => {
      const mockMetrics: Metric[] = [
        { name: 'cpu_usage', value: 0.45, timestamp: Date.now(), labels: { host: 'server1' } },
        { name: 'memory_usage', value: 0.68, timestamp: Date.now(), labels: { host: 'server1' } }
      ]

      mockHttp.mockGet('/monitoring/metrics', mockMetrics)

      const result = await monitoringClient.metrics('cpu_usage')

      expect(result).toEqual(mockMetrics)
      expect(result).toHaveLength(2)
      expect(result[0].value).toBe(0.45)
    })
  })

  describe('queryMetrics', () => {
    it('should query metrics with PromQL', async () => {
      const mockResult = {
        status: 'success',
        data: { resultType: 'vector', result: [] }
      }

      mockHttp.mockPost('/monitoring/metrics/query', mockResult)

      const promQL = 'rate(http_requests_total[5m])'

      const result = await monitoringClient.queryMetrics(promQL)

      expect(result).toEqual(mockResult)
    })
  })

  describe('traces', () => {
    it('should get traces', async () => {
      const mockTraces = {
        traceId: 'trace-123',
        spans: [{ spanId: 'span-1', duration: 100 }]
      }

      mockHttp.mockGet('/monitoring/traces', mockTraces)

      const result = await monitoringClient.traces('trace-123')

      expect(result).toEqual(mockTraces)
    })
  })

  describe('logs', () => {
    it('should get logs', async () => {
      const mockLogs: LogEntry[] = [
        { level: 'info', message: 'Server started', timestamp: Date.now() },
        { level: 'warn', message: 'High memory usage', timestamp: Date.now() }
      ]

      mockHttp.mockGet('/monitoring/logs', mockLogs)

      const result = await monitoringClient.logs({ level: 'info', limit: 100 })

      expect(result).toEqual(mockLogs)
      expect(result).toHaveLength(2)
      expect(result[0].level).toBe('info')
    })
  })

  describe('errors', () => {
    it('should get errors', async () => {
      const mockErrors: ErrorReport[] = [
        {
          id: 'error-1',
          message: 'Database connection failed',
          stack: 'Error: ...',
          timestamp: Date.now(),
          severity: 'critical'
        }
      ]

      mockHttp.mockGet('/monitoring/errors', mockErrors)

      const result = await monitoringClient.errors({ severity: 'critical', limit: 10 })

      expect(result).toEqual(mockErrors)
      expect(result[0].severity).toBe('critical')
    })
  })
})
