# Varity SDK - Intelligent Tiering Module

Advanced multi-tier storage optimization system for cost-effective data management.

## Overview

The Tiering Module provides intelligent storage tier management with automatic cost optimization, access pattern analytics, and predictive recommendations. It enables significant cost savings (up to 90% compared to traditional cloud storage) while maintaining performance.

## Components

### 1. TieringEngine

The core tiering engine evaluates objects and makes tier placement decisions based on configurable rules and policies.

**Features:**
- Rule-based tier evaluation
- Multiple tiering policies (cost-optimized, access-based, time-based, size-based)
- Background tiering cycles
- Chain-of-thought decision making
- Confidence scoring

**Example:**
```typescript
import { TieringEngine, TieringPolicy, StorageTier } from '@varity/sdk/storage/tiering'

const engine = new TieringEngine({
  policy: TieringPolicy.COST_OPTIMIZED,
  rules: [
    {
      name: 'archive-old-files',
      condition: {
        type: 'age',
        operator: 'gt',
        value: 90,
        unit: 'days'
      },
      action: {
        moveTo: StorageTier.GLACIER
      },
      priority: 1
    }
  ],
  tierCosts: {
    [StorageTier.HOT]: 0.002,
    [StorageTier.COLD]: 0.001,
    [StorageTier.GLACIER]: 0.0005
  }
})

// Evaluate a single object
const decision = await engine.evaluateObject('obj-123', metadata)
if (decision.shouldChange) {
  console.log(`Move to ${decision.targetTier}: ${decision.reason}`)
  console.log(`Savings: $${decision.costImpact}/month`)
}

// Run full tiering cycle
const result = await engine.runTieringCycle(allMetadata, (current, total) => {
  console.log(`Progress: ${current}/${total}`)
})

console.log(`Evaluated: ${result.objectsEvaluated}`)
console.log(`Promoted: ${result.objectsPromoted}`)
console.log(`Demoted: ${result.objectsDemoted}`)
console.log(`Monthly savings: $${result.estimatedMonthlySavings}`)
```

### 2. AccessAnalyzer

Tracks and analyzes access patterns to enable intelligent tiering decisions.

**Features:**
- Real-time access tracking
- Pattern prediction
- Hot spot detection
- Cold object identification
- Trend analysis

**Example:**
```typescript
import { AccessAnalyzer } from '@varity/sdk/storage/tiering'

const analyzer = new AccessAnalyzer({
  maxRecordsPerObject: 1000,
  recentAccessWindow: 24,
  enablePrediction: true
})

// Record an access
analyzer.recordAccess({
  identifier: 'obj-123',
  timestamp: new Date(),
  type: 'read',
  bytesTransferred: 1024 * 1024,
  durationMs: 50
})

// Get statistics
const stats = analyzer.getAccessStats('obj-123')
console.log(`Total accesses: ${stats.totalAccesses}`)
console.log(`Trend: ${stats.trend}`)

// Predict future access
const prediction = analyzer.predictAccessProbability('obj-123', 7)
console.log(`Predicted probability: ${prediction.probability}`)
console.log(`Recommended tier: ${prediction.recommendedTier}`)

// Find hot spots
const hotSpots = analyzer.getHotSpots(10, 24)
console.log(`Top 10 hot objects:`, hotSpots)

// Find cold objects
const coldObjects = analyzer.getColdObjects(10, 168)
console.log(`Top 10 cold objects:`, coldObjects)
```

### 3. CostOptimizer

Calculates optimal tier placement based on cost models and access patterns.

**Features:**
- Multi-factor cost calculation
- What-if scenario analysis
- Savings estimation
- DePin vs. AWS/GCP cost comparison
- Batch optimization

**Example:**
```typescript
import {
  CostOptimizer,
  DEFAULT_DEPIN_COST_MODELS,
  AWS_S3_COST_MODELS
} from '@varity/sdk/storage/tiering'

const optimizer = new CostOptimizer({
  tierCosts: DEFAULT_DEPIN_COST_MODELS,
  optimizationThreshold: 0.5 // Minimum $0.50/month savings
})

// Calculate optimal tier
const result = optimizer.calculateOptimalTier(
  'obj-123',
  100 * 1024 * 1024, // 100 MB
  accessPattern
)

console.log(`Current tier: ${result.currentTier}`)
console.log(`Optimal tier: ${result.optimalTier}`)
console.log(`Monthly savings: $${result.monthlySavings}`)
console.log(`Annual savings: $${result.annualSavings}`)

// What-if scenario
const whatIf = optimizer.runWhatIfScenario({
  size: 1024 * 1024 * 1024, // 1 GB
  accessesPerMonth: 10,
  avgTransferPerAccess: 1024 * 1024, // 1 MB per access
  durationMonths: 12
})

console.log(`Best tier: ${whatIf.bestTier}`)
console.log('Cost comparison:', whatIf.costComparisons)

// Batch optimization
const totalCost = optimizer.calculateTotalCost(objects)
console.log(`Total monthly cost: $${totalCost.totalMonthlyCost}`)
console.log(`Optimization opportunities:`, totalCost.optimizationOpportunities)
```

### 4. MetadataStore

Persistent storage for tiering metadata with multiple backend support.

**Features:**
- Multiple storage backends (memory, file, IPFS, SQL)
- Atomic updates
- Batch operations
- Historical tracking
- Efficient querying
- Automatic backups

**Example:**
```typescript
import { MetadataStore, MetadataBackend } from '@varity/sdk/storage/tiering'

const store = new MetadataStore({
  backend: MetadataBackend.FILE,
  backendOptions: {
    filePath: './tiering-metadata.json'
  },
  enableBackups: true,
  backupIntervalMinutes: 60
})

await store.initialize()

// Save metadata
await store.save('obj-123', {
  identifier: 'obj-123',
  tier: StorageTier.HOT,
  layer: StorageLayer.CUSTOMER_DATA,
  size: 1024 * 1024,
  createdAt: new Date(),
  lastAccessed: new Date(),
  accessCount: 1
})

// Load metadata
const metadata = await store.load('obj-123')

// Query metadata
const hotObjects = await store.query({
  tier: StorageTier.HOT,
  minSize: 1024 * 1024, // 1 MB
  limit: 100,
  sortBy: 'size',
  sortOrder: 'desc'
})

// Record tier transition
await store.recordTierTransition(
  'obj-123',
  StorageTier.HOT,
  StorageTier.COLD,
  'Cost optimization',
  2.50 // $2.50/month savings
)

// Get statistics
const stats = await store.getStats()
console.log(`Total entries: ${stats.totalEntries}`)
console.log('By tier:', stats.byTier)
console.log('By layer:', stats.byLayer)
```

## Complete Integration Example

```typescript
import { VaritySDK } from '@varity/sdk'
import {
  TieringEngine,
  AccessAnalyzer,
  CostOptimizer,
  MetadataStore,
  DEFAULT_DEPIN_COST_MODELS,
  MetadataBackend,
  TieringPolicy,
  StorageTier
} from '@varity/sdk/storage/tiering'

// Initialize SDK
const sdk = new VaritySDK({
  wallet: myWallet,
  network: 'mainnet'
})

// Initialize tiering components
const metadataStore = new MetadataStore({
  backend: MetadataBackend.FILE,
  backendOptions: { filePath: './metadata.json' },
  enableBackups: true
})

await metadataStore.initialize()

const accessAnalyzer = new AccessAnalyzer({
  maxRecordsPerObject: 1000,
  enablePrediction: true
})

const costOptimizer = new CostOptimizer({
  tierCosts: DEFAULT_DEPIN_COST_MODELS,
  optimizationThreshold: 0.5
})

const tieringEngine = new TieringEngine({
  policy: TieringPolicy.COST_OPTIMIZED,
  rules: [
    {
      name: 'demote-inactive',
      condition: { type: 'last_accessed', operator: 'gt', value: 30, unit: 'days' },
      action: { moveTo: StorageTier.COLD },
      priority: 1
    },
    {
      name: 'archive-old',
      condition: { type: 'age', operator: 'gt', value: 180, unit: 'days' },
      action: { moveTo: StorageTier.GLACIER },
      priority: 2
    }
  ],
  tierCosts: {
    [StorageTier.HOT]: 0.002,
    [StorageTier.WARM]: 0.0015,
    [StorageTier.COLD]: 0.001,
    [StorageTier.GLACIER]: 0.0005
  }
})

// Use storage with tiering
const storage = sdk.storage.createMultiTierAdapter({
  hotTier: { backend: 'filecoin-ipfs', replication: 3 },
  coldTier: { backend: 'filecoin-ipfs', replication: 2 },
  autoTiering: { enabled: true, policy: TieringPolicy.COST_OPTIMIZED, checkInterval: 24 }
})

// Upload with automatic tiering
const result = await storage.upload(data, {
  layer: StorageLayer.CUSTOMER_DATA,
  tier: StorageTier.HOT // Initial tier
})

// Track access
accessAnalyzer.recordAccess({
  identifier: result.identifier,
  timestamp: new Date(),
  type: 'read',
  bytesTransferred: result.size,
  durationMs: 50
})

// Save metadata
await metadataStore.save(result.identifier, {
  identifier: result.identifier,
  tier: result.tier!,
  layer: StorageLayer.CUSTOMER_DATA,
  size: result.size,
  createdAt: new Date(),
  lastAccessed: new Date(),
  accessCount: 1
})

// Run periodic tiering cycle
setInterval(async () => {
  const allMetadata = Array.from((await metadataStore.listAll()).values())

  const cycleResult = await tieringEngine.runTieringCycle(allMetadata)

  console.log('Tiering cycle completed:', {
    evaluated: cycleResult.objectsEvaluated,
    promoted: cycleResult.objectsPromoted,
    demoted: cycleResult.objectsDemoted,
    savings: cycleResult.estimatedMonthlySavings
  })
}, 24 * 60 * 60 * 1000) // Daily
```

## Cost Savings

The tiering system enables significant cost savings through intelligent tier placement:

### DePin vs. AWS S3

| Tier | DePin Cost | AWS S3 Cost | Savings |
|------|------------|-------------|---------|
| HOT | $0.002/GB | $0.023/GB | 91% |
| WARM | $0.0015/GB | $0.0125/GB | 88% |
| COLD | $0.001/GB | $0.004/GB | 75% |
| GLACIER | $0.0005/GB | $0.001/GB | 50% |

### Example Scenario

For a company storing 1 TB of data with mixed access patterns:

**Without Tiering (all in HOT):**
- AWS: $23.00/month
- DePin: $2.00/month

**With Intelligent Tiering:**
- 200 GB HOT (20%)
- 300 GB WARM (30%)
- 400 GB COLD (40%)
- 100 GB GLACIER (10%)

**DePin Cost:** $1.50/month (25% savings vs. all-hot DePin, 94% savings vs. AWS)

## Best Practices

1. **Start with conservative rules** - Begin with simple time-based or access-based rules before implementing complex policies

2. **Monitor tier transitions** - Track tier changes and cost impacts to refine your rules

3. **Use access analytics** - Leverage the AccessAnalyzer to understand your access patterns before optimizing

4. **Set appropriate thresholds** - Configure `optimizationThreshold` to avoid excessive tier changes for minimal savings

5. **Enable backups** - Use MetadataStore backups to protect against data loss

6. **Test with what-if scenarios** - Use CostOptimizer's what-if analysis to model different strategies

7. **Combine policies** - Use multiple tiering rules with priorities to handle different object types

8. **Regular cycles** - Run tiering cycles daily or weekly for optimal cost management

## Performance Considerations

- **Cache TTL**: Configure appropriate cache TTL for metadata to balance freshness and performance
- **Batch operations**: Use batch save/update for better performance with large datasets
- **Background processing**: Run tiering cycles in background to avoid blocking operations
- **Prediction confidence**: Set minimum confidence thresholds to avoid premature tier changes
- **Memory limits**: Configure `maxRecordsPerObject` in AccessAnalyzer based on available memory

## License

Part of Varity SDK - Licensed for Varity Platform use.
