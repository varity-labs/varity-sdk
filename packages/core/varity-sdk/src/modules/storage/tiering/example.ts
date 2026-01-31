/**
 * Example usage of Varity Tiering System
 *
 * This example demonstrates the complete integration of all tiering components.
 */

import {
  TieringEngine,
  AccessAnalyzer,
  CostOptimizer,
  MetadataStore,
  DEFAULT_DEPIN_COST_MODELS,
  MetadataBackend,
  TieringPolicy,
  StorageTier,
  StorageLayer
} from './index'

async function main() {
  console.log('🚀 Varity Intelligent Tiering System - Demo\n')

  // ========================================================================
  // 1. Initialize MetadataStore
  // ========================================================================
  console.log('📦 Initializing MetadataStore...')
  const metadataStore = new MetadataStore({
    backend: MetadataBackend.MEMORY,
    enableBackups: false
  })
  await metadataStore.initialize()
  console.log('✅ MetadataStore initialized\n')

  // ========================================================================
  // 2. Initialize AccessAnalyzer
  // ========================================================================
  console.log('📊 Initializing AccessAnalyzer...')
  const accessAnalyzer = new AccessAnalyzer({
    maxRecordsPerObject: 1000,
    recentAccessWindow: 24,
    enablePrediction: true,
    minAccessesForPrediction: 5
  })
  console.log('✅ AccessAnalyzer initialized\n')

  // ========================================================================
  // 3. Initialize CostOptimizer
  // ========================================================================
  console.log('💰 Initializing CostOptimizer...')
  const costOptimizer = new CostOptimizer({
    tierCosts: DEFAULT_DEPIN_COST_MODELS,
    optimizationThreshold: 0.5
  })
  console.log('✅ CostOptimizer initialized\n')

  // ========================================================================
  // 4. Initialize TieringEngine
  // ========================================================================
  console.log('⚙️  Initializing TieringEngine...')
  const tieringEngine = new TieringEngine({
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
        priority: 1,
        enabled: true
      },
      {
        name: 'demote-inactive',
        condition: {
          type: 'last_accessed',
          operator: 'gt',
          value: 30,
          unit: 'days'
        },
        action: {
          moveTo: StorageTier.COLD
        },
        priority: 2,
        enabled: true
      }
    ],
    tierCosts: {
      [StorageTier.HOT]: 0.002,
      [StorageTier.WARM]: 0.0015,
      [StorageTier.COLD]: 0.001,
      [StorageTier.GLACIER]: 0.0005
    }
  })
  console.log('✅ TieringEngine initialized\n')

  // ========================================================================
  // 5. Simulate object uploads and access patterns
  // ========================================================================
  console.log('📤 Simulating object uploads...')

  const objects = [
    {
      id: 'hot-obj-1',
      size: 10 * 1024 * 1024, // 10 MB
      tier: StorageTier.HOT,
      ageInDays: 5,
      lastAccessedDays: 0,
      accessCount: 100
    },
    {
      id: 'warm-obj-1',
      size: 50 * 1024 * 1024, // 50 MB
      tier: StorageTier.HOT,
      ageInDays: 20,
      lastAccessedDays: 10,
      accessCount: 20
    },
    {
      id: 'cold-obj-1',
      size: 100 * 1024 * 1024, // 100 MB
      tier: StorageTier.HOT,
      ageInDays: 50,
      lastAccessedDays: 40,
      accessCount: 5
    },
    {
      id: 'archive-obj-1',
      size: 500 * 1024 * 1024, // 500 MB
      tier: StorageTier.HOT,
      ageInDays: 120,
      lastAccessedDays: 100,
      accessCount: 1
    }
  ]

  // Create metadata for each object
  for (const obj of objects) {
    const now = Date.now()
    const metadata = {
      identifier: obj.id,
      tier: obj.tier,
      layer: StorageLayer.CUSTOMER_DATA,
      size: obj.size,
      createdAt: new Date(now - obj.ageInDays * 24 * 60 * 60 * 1000),
      lastAccessed: new Date(now - obj.lastAccessedDays * 24 * 60 * 60 * 1000),
      accessCount: obj.accessCount
    }

    await metadataStore.save(obj.id, metadata)

    // Simulate access records
    for (let i = 0; i < obj.accessCount; i++) {
      accessAnalyzer.recordAccess({
        identifier: obj.id,
        timestamp: new Date(now - (i * obj.ageInDays * 24 * 60 * 60 * 1000) / obj.accessCount),
        type: 'read',
        bytesTransferred: obj.size / 10,
        durationMs: 50
      })
    }
  }

  console.log(`✅ Created ${objects.length} objects\n`)

  // ========================================================================
  // 6. Analyze access patterns
  // ========================================================================
  console.log('🔍 Analyzing access patterns...\n')

  for (const obj of objects) {
    const stats = accessAnalyzer.getAccessStats(obj.id)
    const prediction = accessAnalyzer.predictAccessProbability(obj.id)

    console.log(`Object: ${obj.id}`)
    console.log(`  Total accesses: ${stats.totalAccesses}`)
    console.log(`  Trend: ${stats.trend}`)
    console.log(`  Predicted tier: ${prediction.recommendedTier}`)
    console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%\n`)
  }

  // ========================================================================
  // 7. Calculate costs and optimization opportunities
  // ========================================================================
  console.log('💰 Calculating costs and optimization opportunities...\n')

  const allMetadata = await metadataStore.listAll()
  const metadataArray = Array.from(allMetadata.values())

  const objectsWithPatterns = metadataArray.map(metadata => ({
    identifier: metadata.identifier,
    size: metadata.size,
    tier: metadata.tier,
    accessPattern: accessAnalyzer.getAccessPattern(
      metadata.identifier,
      metadata.tier,
      metadata.size,
      {
        [StorageTier.HOT]: 0.002,
        [StorageTier.WARM]: 0.0015,
        [StorageTier.COLD]: 0.001,
        [StorageTier.GLACIER]: 0.0005
      }
    )
  }))

  const totalCost = costOptimizer.calculateTotalCost(objectsWithPatterns)

  console.log(`Current Monthly Cost: $${totalCost.totalMonthlyCost.toFixed(2)}`)
  console.log('\nCost by Tier:')
  for (const [tier, stats] of Object.entries(totalCost.byTier)) {
    console.log(`  ${tier}: ${stats.count} objects, $${stats.cost.toFixed(2)}/month`)
  }

  console.log(`\nOptimization Opportunities: ${totalCost.optimizationOpportunities.length}`)
  for (const opp of totalCost.optimizationOpportunities) {
    console.log(`  ${opp.identifier}: ${opp.currentTier} → ${opp.optimalTier}`)
    console.log(`    Savings: $${opp.monthlySavings.toFixed(2)}/month`)
  }
  console.log()

  // ========================================================================
  // 8. Run tiering cycle
  // ========================================================================
  console.log('🔄 Running tiering cycle...\n')

  const cycleResult = await tieringEngine.runTieringCycle(
    metadataArray,
    (current, total) => {
      // Progress callback
      if (current === total) {
        console.log(`Progress: ${current}/${total} objects evaluated`)
      }
    }
  )

  console.log('\nTiering Cycle Results:')
  console.log(`  Objects evaluated: ${cycleResult.objectsEvaluated}`)
  console.log(`  Objects promoted: ${cycleResult.objectsPromoted}`)
  console.log(`  Objects demoted: ${cycleResult.objectsDemoted}`)
  console.log(`  Estimated monthly savings: $${cycleResult.estimatedMonthlySavings.toFixed(2)}`)
  console.log(`  Duration: ${cycleResult.durationMs}ms`)
  console.log(`  Average confidence: ${(cycleResult.statistics.avgConfidence * 100).toFixed(1)}%`)

  console.log('\nTier Distribution:')
  console.log('  Before:', cycleResult.statistics.tierDistributionBefore)
  console.log('  After:', cycleResult.statistics.tierDistributionAfter)

  if (cycleResult.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${cycleResult.errors.length}`)
    for (const error of cycleResult.errors) {
      console.log(`  ${error.identifier}: ${error.error}`)
    }
  }

  // ========================================================================
  // 9. Get statistics
  // ========================================================================
  console.log('\n📈 Final Statistics:\n')

  const stats = await metadataStore.getStats()
  console.log('Storage Statistics:')
  console.log(`  Total entries: ${stats.totalEntries}`)
  console.log(`  Total size: ${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`)
  console.log('  By tier:', stats.byTier)
  console.log('  By layer:', stats.byLayer)

  // Hot spots
  const hotSpots = accessAnalyzer.getHotSpots(3, 24)
  console.log(`\n🔥 Top ${hotSpots.length} Hot Spots:`)
  for (const spot of hotSpots) {
    console.log(`  ${spot.identifier}: ${spot.stats.totalAccesses} accesses`)
  }

  // Cold objects
  const coldObjects = accessAnalyzer.getColdObjects(3, 7 * 24)
  console.log(`\n❄️  Top ${coldObjects.length} Cold Objects:`)
  for (const cold of coldObjects) {
    console.log(`  ${cold.identifier}: ${cold.stats.totalAccesses} accesses`)
  }

  // ========================================================================
  // 10. Cleanup
  // ========================================================================
  console.log('\n🧹 Cleaning up...')
  metadataStore.destroy()
  console.log('✅ Cleanup complete\n')

  console.log('=' .repeat(60))
  console.log('✨ Demo completed successfully!')
  console.log('=' .repeat(60))
}

// Run the demo
if (require.main === module) {
  main().catch(console.error)
}

export { main }
