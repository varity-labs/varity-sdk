/**
 * Varity UI Kit - Configuration
 *
 * Configuration for the public frontend SDK.
 * All blockchain/crypto operations are handled by the API server.
 */

/**
 * Default API endpoint for development
 */
export const DEFAULT_API_ENDPOINT = 'http://localhost:3009'

/**
 * API base path
 */
export const API_BASE_PATH = '/api/v1'

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh'
  },

  // Storage
  storage: {
    pin: '/storage/pin',
    uploadFile: '/storage/upload-file',
    retrieve: '/storage/retrieve',
    pinCID: '/storage/pin',
    unpinCID: '/storage/unpin',
    listPins: '/storage/pins'
  },

  // Celestia
  celestia: {
    submit: '/celestia/submit',
    retrieve: '/celestia/retrieve'
  },

  // Compute (LLM)
  llm: {
    compute: '/llm/compute',
    computeStatus: '/llm/compute',
    computeResult: '/llm/compute',
    computeCancel: '/llm/compute',
    query: '/llm/query',
    queryRAG: '/llm/query-rag',
    queryTEE: '/llm/query-tee'
  },

  // RAG
  rag: {
    ingest: '/rag/ingest',
    search: '/rag/search'
  },

  // TEE (Trusted Execution Environment)
  tee: {
    attestation: '/tee/attestation',
    verifyAttestation: '/tee/verify-attestation',
    query: '/tee/query'
  },

  // ZKML (Zero-Knowledge Machine Learning)
  zkml: {
    prove: '/zkml/prove',
    verify: '/zkml/verify',
    stats: '/zkml/stats',
    circuits: '/zkml/circuits'
  },

  // ZK (Zero-Knowledge)
  zk: {
    generate: '/zk/generate',
    verify: '/zk/verify'
  },

  // Analytics
  analytics: {
    kpis: '/analytics/kpis',
    trends: '/analytics/trends',
    leaderboard: '/analytics/leaderboard',
    growthMetrics: '/analytics/growth-metrics',
    timeSeries: '/analytics/time-series',
    comparative: '/analytics/comparative',
    realtime: '/analytics/realtime'
  },

  // Notifications
  notifications: {
    send: '/notifications/send',
    schedule: '/notifications/schedule',
    history: '/notifications/history',
    preferences: '/notifications/preferences',
    alerts: '/notifications/alerts'
  },

  // Export
  export: {
    data: '/export/data',
    report: '/export/report',
    download: '/export/download',
    bulk: '/export/bulk',
    schedule: '/export/schedule'
  },

  // Cache
  cache: {
    get: '/cache',
    set: '/cache',
    delete: '/cache',
    batch: '/cache/batch',
    invalidate: '/cache/invalidate',
    stats: '/cache/stats'
  },

  // Monitoring
  monitoring: {
    health: '/monitoring/health',
    metrics: '/monitoring/metrics',
    metricsQuery: '/monitoring/metrics/query',
    traces: '/monitoring/traces',
    logs: '/monitoring/logs',
    errors: '/monitoring/errors'
  },

  // Forecasting
  forecasting: {
    predict: '/forecasting/predict',
    detectAnomalies: '/forecasting/detect-anomalies',
    analyzeTrend: '/forecasting/analyze-trend',
    simulate: '/forecasting/simulate',
    train: '/forecasting/train',
    evaluate: '/forecasting/evaluate'
  },

  // Webhooks
  webhooks: {
    register: '/webhooks/register',
    list: '/webhooks/list',
    update: '/webhooks',
    delete: '/webhooks',
    test: '/webhooks',
    logs: '/webhooks',
    deliver: '/webhooks/deliver',
    events: '/webhooks/events',
    stats: '/webhooks/stats'
  },

  // Oracle
  oracle: {
    query: '/oracle/query',
    priceHistory: '/oracle/price-history'
  }
}

/**
 * Get the full API endpoint URL
 */
export function getAPIEndpoint(endpoint?: string): string {
  return endpoint || DEFAULT_API_ENDPOINT
}

/**
 * Get the full API URL for a specific endpoint
 */
export function getFullAPIURL(baseEndpoint: string, path: string): string {
  return `${baseEndpoint}${API_BASE_PATH}${path}`
}
