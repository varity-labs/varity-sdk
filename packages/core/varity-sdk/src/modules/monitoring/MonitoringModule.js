/**
 * MonitoringModule - Universal monitoring and observability
 *
 * Provides comprehensive monitoring capabilities including health checks,
 * metrics collection, distributed tracing, and error tracking.
 * Works across all templates for production observability.
 */
export class MonitoringModule {
    sdk;
    constructor(sdk) {
        this.sdk = sdk;
    }
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
    async getHealthStatus() {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get health status: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async recordMetric(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to record metric: ${response.statusText}`);
        }
    }
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
    async queryMetrics(options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/metrics/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(options)
        });
        if (!response.ok) {
            throw new Error(`Failed to query metrics: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async startTrace(name, tags) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/traces`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({ name, tags, startTime: new Date().toISOString() })
        });
        if (!response.ok) {
            throw new Error(`Failed to start trace: ${response.statusText}`);
        }
        const trace = await response.json();
        return new TraceContext(trace.id, name, this.sdk, apiEndpoint, apiKey);
    }
    /**
     * Get trace by ID
     *
     * Universal method - retrieves trace details.
     */
    async getTrace(traceId) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/traces/${traceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get trace: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async reportError(error, options) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const errorMessage = typeof error === 'string' ? error : error.message;
        const stackTrace = error instanceof Error ? error.stack : undefined;
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/errors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({
                error: errorMessage,
                stackTrace,
                context: options?.context,
                tags: options?.tags,
                timestamp: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to report error: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get error reports
     *
     * Universal method - retrieves error tracking data.
     */
    async getErrors(options = {}) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const queryParams = new URLSearchParams();
        if (options.startTime)
            queryParams.append('startTime', options.startTime);
        if (options.endTime)
            queryParams.append('endTime', options.endTime);
        if (options.limit)
            queryParams.append('limit', options.limit.toString());
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/errors?${queryParams}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({ tags: options.tags })
        });
        if (!response.ok) {
            throw new Error(`Failed to get errors: ${response.statusText}`);
        }
        return await response.json();
    }
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
    async getPerformanceMetrics() {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/performance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get performance metrics: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get active alerts
     *
     * Universal method - retrieves currently active alerts.
     */
    async getActiveAlerts() {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/alerts?status=active`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to get active alerts: ${response.statusText}`);
        }
        return await response.json();
    }
    /**
     * Get system uptime
     *
     * Universal method - retrieves system uptime in seconds.
     */
    async getUptime() {
        const health = await this.getHealthStatus();
        return health.uptime;
    }
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
    async recordEvent(name, data) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify({
                name,
                data,
                timestamp: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to record event: ${response.statusText}`);
        }
    }
    /**
     * Create custom dashboard
     *
     * Universal method - creates a custom monitoring dashboard.
     */
    async createDashboard(dashboard) {
        const apiEndpoint = this.sdk.getAPIEndpoint();
        const apiKey = this.sdk.getAPIKey();
        const response = await fetch(`${apiEndpoint}/api/v1/monitoring/dashboards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
            },
            body: JSON.stringify(dashboard)
        });
        if (!response.ok) {
            throw new Error(`Failed to create dashboard: ${response.statusText}`);
        }
        return await response.json();
    }
}
/**
 * TraceContext - Helper class for managing distributed traces
 */
export class TraceContext {
    id;
    name;
    sdk;
    apiEndpoint;
    apiKey;
    spans = [];
    constructor(id, name, sdk, apiEndpoint, apiKey) {
        this.id = id;
        this.name = name;
        this.sdk = sdk;
        this.apiEndpoint = apiEndpoint;
        this.apiKey = apiKey;
    }
    /**
     * Start a new span within this trace
     */
    async startSpan(name, tags) {
        const response = await fetch(`${this.apiEndpoint}/api/v1/monitoring/traces/${this.id}/spans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                name,
                tags,
                startTime: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to start span: ${response.statusText}`);
        }
        const span = await response.json();
        return new SpanContext(span.id, this.id, name, this.apiEndpoint, this.apiKey);
    }
    /**
     * End the trace successfully
     */
    async end() {
        await fetch(`${this.apiEndpoint}/api/v1/monitoring/traces/${this.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                endTime: new Date().toISOString(),
                status: 'completed'
            })
        });
    }
    /**
     * End the trace with an error
     */
    async error(error) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        await fetch(`${this.apiEndpoint}/api/v1/monitoring/traces/${this.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                endTime: new Date().toISOString(),
                status: 'error',
                error: errorMessage
            })
        });
    }
}
/**
 * SpanContext - Helper class for managing trace spans
 */
export class SpanContext {
    id;
    traceId;
    name;
    apiEndpoint;
    apiKey;
    constructor(id, traceId, name, apiEndpoint, apiKey) {
        this.id = id;
        this.traceId = traceId;
        this.name = name;
        this.apiEndpoint = apiEndpoint;
        this.apiKey = apiKey;
    }
    /**
     * Add log entry to span
     */
    async log(level, message, metadata) {
        await fetch(`${this.apiEndpoint}/api/v1/monitoring/spans/${this.id}/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                level,
                message,
                metadata,
                timestamp: new Date().toISOString()
            })
        });
    }
    /**
     * End the span successfully
     */
    async end() {
        await fetch(`${this.apiEndpoint}/api/v1/monitoring/spans/${this.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                endTime: new Date().toISOString(),
                status: 'completed'
            })
        });
    }
    /**
     * End the span with an error
     */
    async error(error) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        await fetch(`${this.apiEndpoint}/api/v1/monitoring/spans/${this.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
            },
            body: JSON.stringify({
                endTime: new Date().toISOString(),
                status: 'error',
                error: errorMessage
            })
        });
    }
}
//# sourceMappingURL=MonitoringModule.js.map