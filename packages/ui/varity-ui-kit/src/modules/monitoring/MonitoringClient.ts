/**
 * Monitoring Client - System monitoring and metrics
 *
 * Handles monitoring operations via API server (Prometheus/Grafana backend)
 */

import { HTTPClient } from '../../utils/http'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  services: Record<string, 'up' | 'down'>
  timestamp: number
}

export interface Metric {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
  context?: Record<string, any>
}

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class MonitoringClient {
  constructor(private http: HTTPClient) {}

  /**
   * Get system health status
   */
  async health(): Promise<HealthStatus> {
    return this.http.get<HealthStatus>('/monitoring/health')
  }

  /**
   * Get metrics
   */
  async metrics(query?: string): Promise<Metric[]> {
    return this.http.get<Metric[]>('/monitoring/metrics', { params: { query } })
  }

  /**
   * Query metrics with PromQL
   */
  async queryMetrics(promQL: string): Promise<any> {
    return this.http.post<any>('/monitoring/metrics/query', { query: promQL })
  }

  /**
   * Get traces
   */
  async traces(traceId?: string): Promise<any> {
    return this.http.get<any>('/monitoring/traces', { params: { traceId } })
  }

  /**
   * Get logs
   */
  async logs(options?: {
    level?: string
    limit?: number
    startTime?: string
    endTime?: string
  }): Promise<LogEntry[]> {
    return this.http.get<LogEntry[]>('/monitoring/logs', { params: options })
  }

  /**
   * Get errors
   */
  async errors(options?: { severity?: string; limit?: number }): Promise<ErrorReport[]> {
    return this.http.get<ErrorReport[]>('/monitoring/errors', { params: options })
  }
}
