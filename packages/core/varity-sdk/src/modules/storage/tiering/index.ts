/**
 * Varity SDK - Tiering Module
 *
 * Complete intelligent tiering system for storage cost optimization.
 *
 * @packageDocumentation
 */

// Re-export core types from @varity-labs/types
export { StorageTier, StorageLayer, TieringPolicy } from '@varity-labs/types'

export { TieringEngine } from './TieringEngine'
export type {
  TieringMetadata,
  TieringDecision,
  TieringCycleResult,
  TieringCycleStats,
  TieringError,
  TieringEngineConfig
} from './TieringEngine'

export { AccessAnalyzer } from './AccessAnalyzer'
export type {
  AccessRecord,
  AccessStats,
  TimeWindow,
  AccessPrediction,
  AccessAnalyzerConfig
} from './AccessAnalyzer'

export { CostOptimizer, DEFAULT_DEPIN_COST_MODELS, AWS_S3_COST_MODELS } from './CostOptimizer'
export type {
  TierCostModel,
  CostBreakdown,
  OptimizationResult,
  WhatIfScenario,
  WhatIfResult,
  CostOptimizerConfig
} from './CostOptimizer'

export { MetadataStore, MetadataBackend } from './MetadataStore'
export type {
  TieringMetadata as StoredTieringMetadata,
  TierTransition,
  MetadataQueryOptions,
  BatchUpdate,
  MetadataStoreConfig,
  MetadataStoreStats
} from './MetadataStore'
