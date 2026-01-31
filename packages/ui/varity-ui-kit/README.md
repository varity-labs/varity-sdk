# @varity/ui-kit v2.0.0

**Public Frontend SDK for Varity - Industry-Specific AI Dashboard Deployment**

Complete toolkit for deploying industry-specific AI dashboards to Varity L3 blockchain with template deployment, storage layers, and compliance features.

## Installation

```bash
npm install @varity/ui-kit
# or
pnpm add @varity/ui-kit
# or
yarn add @varity/ui-kit
```

## 🎯 Which Provider Should I Use?

**90% of apps**: Use `PrivyStack` (zero-config auth + wallet + blockchain)

```tsx
import { PrivyStack } from '@varity/ui-kit';

<PrivyStack>
  <YourApp />
</PrivyStack>
```

**Need gasless transactions?** Add `SmartWalletProvider`

```tsx
import { PrivyStack, SmartWalletProvider } from '@varity/ui-kit';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity/sdk';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!
});

<PrivyStack>
  <SmartWalletProvider
    config={{
      client,
      chain: varityL3Testnet,
      gasless: { enabled: true }
    }}
  >
    <YourApp />
  </SmartWalletProvider>
</PrivyStack>
```

**Building dashboards?** Use `VarityDashboardProvider` (includes Wagmi + React Query)

```tsx
import { VarityDashboardProvider } from '@varity/ui-kit';

<VarityDashboardProvider
  privyAppId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
>
  <Dashboard />
</VarityDashboardProvider>
```

📚 See [Provider Guide](./docs/PROVIDERS.md) for complete decision tree and migration paths.

## Quick Start

```typescript
import { VarityClient } from '@varity/ui-kit'

// Initialize client
const client = new VarityClient({
  apiEndpoint: 'https://api.varity.io',  // or staging/development
  apiKey: 'your-api-key'
})

// Deploy industry-specific dashboard
const deployment = await client.templates.deployTemplate({
  industry: 'finance',
  templateId: 'finance-basic',
  customization: {
    branding: {
      companyName: 'Acme Finance',
      primaryColor: '#1E40AF',
      darkMode: true
    }
  },
  storageLayer: 'layer3',
  deploymentType: 'production'
})

// Use any module
const kpis = await client.analytics.getKPIs({ period: 'current_month' })
const aiResponse = await client.compute.query('Analyze my financial data')
```

## Features

### 🔌 Web3 Provider Stack (NEW in v2.0)
Zero-config React providers for Web3 apps:

- **PrivyStack** - Auth (email/social/wallet) + thirdweb integration
- **SmartWalletProvider** - Gasless transactions (ERC-4337)
- **VarityDashboardProvider** - Full-featured dashboards (Wagmi + React Query)
- **WalletSyncProvider** - Seamless Privy ↔ thirdweb wallet sync

### 🎯 Template Deployment System
Deploy pre-configured industry-specific dashboards to Varity L3:

- **Finance** - Banking, compliance, transactions, risk management
- **Healthcare** - HIPAA compliance, patient data, medical operations
- **Retail** - E-commerce, inventory, supply chain
- **ISO Merchant** - Payment processing, PCI compliance

### 🔐 3-Layer Encrypted Storage Architecture
- **Layer 1** - Varity internal documentation (Varity admins only)
- **Layer 2** - Industry RAG knowledge base (shared across industry)
- **Layer 3** - Customer-specific data (private, customer-only access)
- **ALL layers encrypted with Lit Protocol**

### 🔌 13 Module Clients
All operations via secure REST API:

- **auth** - SIWE authentication
- **storage** - Filecoin/IPFS file storage
- **compute** - AI/LLM on Akash Network
- **zk** - Zero-knowledge ML proofs
- **analytics** - Business analytics
- **notifications** - Email/SMS/push notifications
- **export** - CSV/JSON/PDF data export
- **cache** - Redis caching
- **monitoring** - System health & metrics
- **forecasting** - Predictive analytics
- **webhooks** - Webhook management
- **oracle** - Oracle data feeds
- **templates** - Industry dashboard deployment (NEW)

### 🎨 React Industry Templates
- `<FinanceDashboard />` - Financial services dashboard
- `<HealthcareDashboard />` - Healthcare operations dashboard
- `<RetailDashboard />` - Retail & e-commerce dashboard
- `<ISODashboard />` - ISO merchant services dashboard

## API Reference

### Authentication

```typescript
// Login with SIWE
const { token } = await client.auth.login(message, signature)

// Get user profile
const user = await client.auth.me()
```

### Storage

```typescript
// Upload file
const { cid } = await client.storage.uploadFile(file)

// Pin content
await client.storage.pinCID(cid)
```

### AI Compute

```typescript
// Simple query
const response = await client.compute.query('What are the trends?')

// RAG query
const response = await client.compute.queryRAG({
  query: 'Analyze customer behavior',
  knowledgeBase: 'my-knowledge-base'
})
```

### Analytics

```typescript
// Get KPIs
const kpis = await client.analytics.getKPIs({
  period: 'current_month'
})

// Get trends
const trends = await client.analytics.getTrends({
  startDate: '2025-01-01',
  endDate: '2025-01-31'
})
```

## Documentation

### Provider Guides
- **[Provider Decision Tree](./docs/PROVIDERS.md)** - Which provider should you use? (COMPREHENSIVE)
- **[Provider Hierarchy](./docs/PROVIDER_HIERARCHY.md)** - Visual architecture diagrams
- **[Credentials Guide](./docs/CREDENTIALS_GUIDE.md)** - Get Privy App ID & thirdweb Client ID

### Integration Guides
- **[Privy Integration](./docs/PRIVY_INTEGRATION.md)** - Email/social/wallet authentication
- **[thirdweb Quickstart](./docs/THIRDWEB_QUICKSTART.md)** - Blockchain operations
- **[Installation Guide](./docs/INSTALLATION_GUIDE.md)** - Setup and configuration

### Component Reference
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Web3 Components](./docs/WEB3_COMPONENTS_REPORT.md)** - Wallet, balance, address components

## Security

This SDK is PUBLIC and safe to distribute. It contains:

- ✅ React components
- ✅ API client (HTTP only)
- ✅ TypeScript types
- ❌ NO smart contract logic
- ❌ NO DePIN orchestration
- ❌ NO encryption keys
- ❌ NO business logic

All sensitive operations are handled by the Varity API Server.

## License

MIT License - Safe for commercial use and redistribution

## Support

- Documentation: https://docs.varity.com
- Discord: https://discord.gg/varity
- Email: support@varity.com

---

**Powered by Varity** 🚀
