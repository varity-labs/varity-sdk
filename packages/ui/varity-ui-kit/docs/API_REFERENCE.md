# @varity/ui-kit v2.0 - API Quick Reference

Quick reference guide for all SDK methods and types.

---

## Installation

```bash
npm install @varity/ui-kit
```

---

## Initialization

```typescript
import { VarityClient } from '@varity/ui-kit'

const client = new VarityClient({
  apiEndpoint: 'https://api.varity.so',  // Required
  apiKey: 'your-api-key',                // Required
  timeout: 30000                          // Optional (default: 30000ms)
})
```

---

## Template Deployment Module

### Deploy Template

```typescript
const deployment = await client.templates.deployTemplate({
  industry: 'finance' | 'healthcare' | 'retail' | 'iso',
  templateId: 'template-id',               // Optional
  customization: {
    branding: {
      companyName: string,
      logo?: string,
      primaryColor?: string,
      secondaryColor?: string,
      darkMode?: boolean
    },
    modules?: {
      enabled: string[],
      disabled: string[]
    },
    integrations?: Array<{
      name: string,
      config: Record<string, any>
    }>,
    dataRetention?: {
      period: number,
      unit: 'days' | 'months' | 'years'
    }
  },
  storageLayer: 'layer2' | 'layer3',
  deploymentType: 'test' | 'production'
})

// Returns: DeploymentResponse
{
  deploymentId: string,
  customerId: string,
  dashboardUrl: string,
  contractAddress?: string,
  l3ChainId: number,
  storageConfig: {
    layer2Namespace: string,
    layer3Namespace: string,
    litProtocolEncrypted: boolean
  },
  status: 'pending' | 'deploying' | 'active' | 'failed',
  timestamp: string
}
```

### List Templates

```typescript
const templates = await client.templates.listTemplates('finance')

// Returns: TemplateMetadata[]
```

### Get Deployment Status

```typescript
const status = await client.templates.getDeploymentStatus(deploymentId)

// Returns: DeploymentStatus
{
  deploymentId: string,
  status: 'pending' | 'deploying' | 'active' | 'failed',
  progress: number,
  currentStep: string,
  steps: Array<{
    name: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    timestamp?: string
  }>,
  logs: string[]
}
```

### Get Deployed Dashboard

```typescript
const dashboard = await client.templates.getDeployedDashboard('customer-id')

// Returns: DeployedDashboard
```

### Industry Best Practices

```typescript
const practices = await client.templates.getIndustryBestPractices('finance')

// Returns: Industry knowledge from Layer 2 RAG
```

---

## Authentication Module

```typescript
// Login
const auth = await client.auth.login(message, signature)
// Returns: { token, address, expiresIn }

// Get Profile
const user = await client.auth.me()

// Logout
await client.auth.logout()

// Refresh Token
const newAuth = await client.auth.refresh()
```

---

## Storage Module

```typescript
// Upload File
const result = await client.storage.uploadFile(file, metadata)
// Returns: { cid, gatewayUrl, size, timestamp }

// Pin Content
await client.storage.pinCID(cid)

// List Pins
const pins = await client.storage.listPins()

// Retrieve Content
const content = await client.storage.retrieve(cid, { decrypt: true })
```

---

## AI Compute Module

```typescript
// Simple Query
const response = await client.compute.query('What are trends?')

// RAG Query
const ragResponse = await client.compute.queryRAG({
  query: 'Analyze customer behavior',
  knowledgeBase: 'my-kb',
  topK: 5
})

// TEE Query (Secure)
const teeResponse = await client.compute.queryTEE('Sensitive query', true)
```

---

## Analytics Module

```typescript
// Get KPIs
const kpis = await client.analytics.getKPIs({
  period: 'current_month'
})

// Get Trends
const trends = await client.analytics.getTrends({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  interval: 'day'
})

// Get Leaderboard
const leaderboard = await client.analytics.getLeaderboard({
  metric: 'volume',
  limit: 10
})

// Real-time Metrics
const realtime = await client.analytics.getRealtime()
```

---

## ZK Module

```typescript
// Generate Proof
const proof = await client.zk.prove({
  modelId: 'model-123',
  input: { data: [1, 2, 3] },
  output: { prediction: 0.95 },
  submitOnChain: false
})

// Verify Proof
const verification = await client.zk.verify({
  proofId: 'proof-123',
  proof: { pi_a, pi_b, pi_c },
  publicSignals: ['signal1', 'signal2']
})

// Get Stats
const stats = await client.zk.stats()
```

---

## Notifications Module

```typescript
// Send Notification
await client.notifications.send({
  type: 'email',
  to: 'user@example.com',
  subject: 'Subject',
  body: 'Content',
  priority: 'high'
})

// Schedule Notification
await client.notifications.schedule({
  type: 'email',
  to: 'user@example.com',
  body: 'Scheduled content',
  scheduledAt: '2025-11-01T10:00:00Z'
})

// Get/Update Preferences
const prefs = await client.notifications.getPreferences()
await client.notifications.updatePreferences({ email: true })
```

---

## Export Module

```typescript
// Export Data
const exportResult = await client.export.exportData({
  format: 'csv',
  filters: { startDate: '2025-01-01' },
  fields: ['id', 'name', 'value']
})

// Generate Report
const report = await client.export.generateReport({
  reportType: 'summary',
  period: { startDate: '2025-01-01', endDate: '2025-01-31' },
  format: 'pdf'
})

// Download
const file = await client.export.download(exportId)
```

---

## Cache Module

```typescript
// Get/Set
const value = await client.cache.get('key')
await client.cache.set('key', value, { ttl: 3600 })

// Batch Get
const batch = await client.cache.batch(['key1', 'key2'])

// Invalidate
await client.cache.invalidate('user:*')

// Stats
const stats = await client.cache.stats()
```

---

## Monitoring Module

```typescript
// Health Check
const health = await client.monitoring.health()

// Get Metrics
const metrics = await client.monitoring.metrics('cpu_usage')

// Query with PromQL
const result = await client.monitoring.queryMetrics(
  'rate(http_requests_total[5m])'
)

// Get Logs
const logs = await client.monitoring.logs({
  level: 'error',
  limit: 100
})

// Get Errors
const errors = await client.monitoring.errors({
  severity: 'critical'
})
```

---

## Forecasting Module

```typescript
// Predict Future Values
const forecast = await client.forecasting.predict({
  metric: 'revenue',
  periods: 30,
  confidence: 0.95,
  model: 'prophet'
})

// Detect Anomalies
const anomalies = await client.forecasting.detectAnomalies({
  metric: 'transactions',
  data: [{ timestamp: '...', value: 100 }],
  sensitivity: 'medium'
})

// Analyze Trend
const trend = await client.forecasting.analyzeTrend('sales')
```

---

## Webhooks Module

```typescript
// Register Webhook
const webhook = await client.webhooks.register({
  url: 'https://example.com/webhook',
  events: ['user.created', 'payment.received'],
  secret: 'secret123'
})

// List Webhooks
const webhooks = await client.webhooks.list()

// Update Webhook
await client.webhooks.update(webhookId, { events: ['user.created'] })

// Delete Webhook
await client.webhooks.delete(webhookId)

// Get Delivery Logs
const logs = await client.webhooks.logs(webhookId, 50)
```

---

## Oracle Module

```typescript
// Get Price Data
const price = await client.oracle.getPrice('BTC', 'USD')

// Get Price History
const history = await client.oracle.getPriceHistory('ETH', {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  interval: 'day'
})

// Custom Oracle Query
const result = await client.oracle.query({
  dataType: 'price',
  params: { asset: 'BTC', currency: 'USD' }
})
```

---

## React Components

### Industry Templates

```tsx
import {
  FinanceDashboard,
  HealthcareDashboard,
  RetailDashboard,
  ISODashboard
} from '@varity/ui-kit'

// Finance Dashboard
<FinanceDashboard
  dashboard={deployedDashboard}
  onCustomize={(updates) => handleCustomize(updates)}
  className="custom-class"
/>

// Healthcare Dashboard
<HealthcareDashboard
  dashboard={deployedDashboard}
  onCustomize={(updates) => handleCustomize(updates)}
/>

// Retail Dashboard
<RetailDashboard dashboard={deployedDashboard} />

// ISO Merchant Dashboard
<ISODashboard dashboard={deployedDashboard} />
```

### Dashboard Components

```tsx
import {
  DashboardLayout,
  DashboardHeader,
  DashboardSidebar,
  DashboardFooter
} from '@varity/ui-kit'

<DashboardLayout>
  <DashboardHeader />
  <DashboardSidebar />
  {/* Content */}
  <DashboardFooter />
</DashboardLayout>
```

---

## React Hooks

```tsx
import {
  useVarityAPI,
  useAuth,
  useAnalytics,
  useDashboard
} from '@varity/ui-kit'

// API Hook
const { data, loading, error } = useVarityAPI('/endpoint')

// Auth Hook
const { user, login, logout, isAuthenticated } = useAuth()

// Analytics Hook
const { kpis, trends, leaderboard } = useAnalytics()

// Dashboard Hook
const { dashboard, refresh } = useDashboard('customer-id')
```

---

## TypeScript Types

All types are exported from the main package:

```typescript
import type {
  // Template Types
  IndustryType,
  TemplateMetadata,
  TemplateCustomization,
  DeploymentRequest,
  DeploymentResponse,
  DeployedDashboard,

  // Client Types
  AuthClient,
  StorageClient,
  ComputeClient,
  ZKClient,
  TemplateDeploymentClient,

  // Response Types
  LoginResponse,
  StorageResult,
  ComputeResponse,
  ZKProofResponse,

  // HTTP Types
  HTTPClient,
  HTTPResponse
} from '@varity/ui-kit'
```

---

## Error Handling

```typescript
try {
  const deployment = await client.templates.deployTemplate(request)
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Validation error:', error.response.data)
  } else if (error.response?.status === 401) {
    console.error('Authentication error')
  } else {
    console.error('Deployment failed:', error.message)
  }
}
```

---

## Environment Variables

```bash
# .env file
VARITY_API_ENDPOINT=https://api.varity.so
VARITY_API_KEY=your-api-key
```

```typescript
const client = new VarityClient({
  apiEndpoint: process.env.VARITY_API_ENDPOINT,
  apiKey: process.env.VARITY_API_KEY
})
```

---

## Support

- **Documentation**: https://docs.varity.so
- **Discord**: https://discord.gg/varity
- **Email**: support@varity.so
- **GitHub**: https://github.com/varity/ui-kit

---

**Version**: 2.0.0
**License**: MIT
**Powered by Varity**
