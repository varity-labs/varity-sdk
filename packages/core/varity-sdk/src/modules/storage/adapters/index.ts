/**
 * Varity SDK - Storage Adapters
 *
 * Export all storage adapter interfaces and implementations
 */

// Base interfaces and classes
export {
  IStorageAdapter,
  UnsupportedOperationError,
  BaseStorageAdapter
} from './IStorageAdapter'

export type {
  IStorageAdapter as StorageAdapter
} from './IStorageAdapter'

// Adapter implementations
export { FilecoinAdapter } from './FilecoinAdapter'
export { MultiTierAdapter } from './MultiTierAdapter'

// Factory for creating adapters
export { AdapterFactory } from './AdapterFactory'
export type { AdapterFactoryConfig } from './AdapterFactory'
