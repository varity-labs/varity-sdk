import type { VaritySDK } from '../../core/VaritySDK';
/**
 * Monitoring Module
 *
 * Universal health checks, metrics, tracing, and observability across all templates.
 * Provides production-ready monitoring capabilities.
 * Works identically for ISO, Healthcare, Finance, Retail, etc.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
export interface HealthCheckResult {
    status: HealthStatus;
    timestamp: string;
    checks: {
        [component: string]: {
            status: HealthStatus;
            message?: string;
            responseTime?: number;
            lastCheck?: string;
        };
    };
    uptime: number;
    version: string;
}
export interface Metric {
    name: string;
    type: MetricType;
    value: number;
    timestamp?: string;
    tags?: Record<string, string>;
    unit?: string;
}
export interface RecordMetricOptions {
    name: string;
    value: number;
    type?: MetricType;
    tags?: Record<string, string>;
    unit?: string;
    timestamp?: string;
}
export interface QueryMetricsOptions {
    name: string;
    startTime?: string;
    endTime?: string;
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99';
    interval?: string;
    tags?: Record<string, string>;
}
export interface MetricSeries {
    name: string;
    dataPoints: Array<{
        timestamp: string;
        value: number;
    }>;
    aggregation?: string;
    tags?: Record<string, string>;
}
export interface Trace {
    id: string;
    name: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: 'running' | 'completed' | 'error';
    spans: Span[];
    tags?: Record<string, string>;
    error?: string;
}
export interface Span {
    id: string;
    traceId: string;
    name: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    parentSpanId?: string;
    status: 'running' | 'completed' | 'error';
    tags?: Record<string, string>;
    logs?: LogEntry[];
    error?: string;
}
export interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, any>;
}
export interface ErrorReport {
    id: string;
    error: string;
    stackTrace?: string;
    context?: Record<string, any>;
    timestamp: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    tags?: Record<string, string>;
}
export interface PerformanceMetrics {
    apiLatency: {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
    throughput: {
        requestsPerSecond: number;
        requestsPerMinute: number;
    };
    errorRate: number;
    uptime: number;
    resourceUsage: {
        cpu?: number;
        memory?: number;
        storage?: number;
    };
}
export interface Alert {
    id: string;
    name: string;
    condition: string;
    status: 'active' | 'resolved';
    severity: 'low' | 'medium' | 'high' | 'critical';
    triggeredAt: string;
    resolvedAt?: string;
    message: string;
    metadata?: Record<string, any>;
}
/**
 * MonitoringModule - Universal monitoring and observability
 *
 * Provides comprehensive monitoring capabilities including health checks,
 * metrics collection, distributed tracing, and error tracking.
 * Works across all templates for production observability.
 */
export declare class MonitoringModule {
    private sdk;
    constructor(sdk: VaritySDK);
    /**
     * Get system health status
     *
     * Universal method - checks health of all system components.
     *
     * @example
     * ```typescript
     * const health = await sdk.monitoring.getHealthStatus()
     * if (health.status !== 'healthy') {
     *   console.error('System unhealthy:', health.checks)
     * }
     * ```
     */
    getHealthStatus(): Promise<HealthCheckResult>;
    /**
     * Record metric
     *
     * Universal method - records a metric value for monitoring.
     *
     * @example ISO Dashboard
     * ```typescript
     * await sdk.monitoring.recordMetric({
     *   name: 'merchant.registration.duration',
     *   value: 245,
     *   type: 'histogram',
     *   unit: 'ms',
     *   tags: { status: 'success' }
     * })
     * ```
     *
     * @example Healthcare Dashboard
     * ```typescript
     * await sdk.monitoring.recordMetric({
     *   name: 'appointment.booking.duration',
     *   value: 320,
     *   type: 'histogram',
     *   unit: 'ms',
     *   tags: { department: 'cardiology' }
     * })
     * ```
     */
    recordMetric(options: RecordMetricOptions): Promise<void>;
    /**
     * Query metrics
     *
     * Universal method - retrieves metric data with aggregation.
     *
     * @example
     * ```typescript
     * const latency = await sdk.monitoring.queryMetrics({
     *   name: 'api.latency',
     *   startTime: '2025-01-01T00:00:00Z',
     *   endTime: '2025-01-31T23:59:59Z',
     *   aggregation: 'p95',
     *   interval: '1h'
     * })
     * ```
     */
    queryMetrics(options: QueryMetricsOptions): Promise<MetricSeries>;
    /**
     * Start distributed trace
     *
     * Universal method - begins a new distributed trace.
     *
     * @example
     * ```typescript
     * const trace = await sdk.monitoring.startTrace('merchant.registration', {
     *   userId: '123',
     *   merchantId: 'M456'
     * })
     *
     * try {
     *   // ... perform operations ...
     *   await trace.end()
     * } catch (error) {
     *   await trace.error(error)
     * }
     * ```
     */
    startTrace(name: string, tags?: Record<string, string>): Promise<TraceContext>;
    /**
     * Get trace by ID
     *
     * Universal method - retrieves trace details.
     */
    getTrace(traceId: string): Promise<Trace>;
    /**
     * Report error
     *
     * Universal method - reports an error for tracking.
     *
     * @example
     * ```typescript
     * try {
     *   await somethingRisky()
     * } catch (error) {
     *   await sdk.monitoring.reportError(error, {
     *     context: { userId: '123', action: 'registration' },
     *     tags: { severity: 'high' }
     *   })
     * }
     * ```
     */
    reportError(error: Error | string, options?: {
        context?: Record<string, any>;
        tags?: Record<string, string>;
    }): Promise<ErrorReport>;
    /**
     * Get error reports
     *
     * Universal method - retrieves error tracking data.
     */
    getErrors(options?: {
        startTime?: string;
        endTime?: string;
        tags?: Record<string, string>;
        limit?: number;
    }): Promise<ErrorReport[]>;
    /**
     * Get performance metrics
     *
     * Universal method - retrieves system performance metrics.
     *
     * @example
     * ```typescript
     * const perf = await sdk.monitoring.getPerformanceMetrics()
     * console.log(`API p95 latency: ${perf.apiLatency.p95}ms`)
     * console.log(`Error rate: ${perf.errorRate}%`)
     * ```
     */
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    /**
     * Get active alerts
     *
     * Universal method - retrieves currently active alerts.
     */
    getActiveAlerts(): Promise<Alert[]>;
    /**
     * Get system uptime
     *
     * Universal method - retrieves system uptime in seconds.
     */
    getUptime(): Promise<number>;
    /**
     * Record custom event
     *
     * Universal method - records a custom event for tracking.
     *
     * @example
     * ```typescript
     * await sdk.monitoring.recordEvent('merchant.tier.upgraded', {
     *   merchantId: 'M123',
     *   oldTier: 'silver',
     *   newTier: 'gold'
     * })
     * ```
     */
    recordEvent(name: string, data?: Record<string, any>): Promise<void>;
    /**
     * Create custom dashboard
     *
     * Universal method - creates a custom monitoring dashboard.
     */
    createDashboard(dashboard: {
        name: string;
        description?: string;
        metrics: string[];
        layout?: any;
    }): Promise<{
        id: string;
        url: string;
    }>;
}
/**
 * TraceContext - Helper class for managing distributed traces
 */
export declare class TraceContext {
    readonly id: string;
    readonly name: string;
    private sdk;
    private apiEndpoint;
    private apiKey?;
    private spans;
    constructor(id: string, name: string, sdk: VaritySDK, apiEndpoint: string, apiKey?: string | undefined);
    /**
     * Start a new span within this trace
     */
    startSpan(name: string, tags?: Record<string, string>): Promise<SpanContext>;
    /**
     * End the trace successfully
     */
    end(): Promise<void>;
    /**
     * End the trace with an error
     */
    error(error: Error | string): Promise<void>;
}
/**
 * SpanContext - Helper class for managing trace spans
 */
export declare class SpanContext {
    readonly id: string;
    readonly traceId: string;
    readonly name: string;
    private apiEndpoint;
    private apiKey?;
    constructor(id: string, traceId: string, name: string, apiEndpoint: string, apiKey?: string | undefined);
    /**
     * Add log entry to span
     */
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * End the span successfully
     */
    end(): Promise<void>;
    /**
     * End the span with an error
     */
    error(error: Error | string): Promise<void>;
}
//# sourceMappingURL=MonitoringModule.d.ts.map