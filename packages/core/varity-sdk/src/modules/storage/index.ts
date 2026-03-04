/**
 * Storage Module - Exports
 *
 * Exports both the main StorageModule and the new adapter architecture
 * for advanced use cases and multi-backend support.
 */

// Main storage module (backward compatible)
export { StorageModule } from './StorageModule'
export type {
  UploadResult,
  DataPointer,
  Pin,
  PinFilters,
  CelestiaReceipt
} from './StorageModule'

// S3-compatible storage module
export { S3Module } from './S3Module'
export type {
  S3PutObjectParams,
  S3GetObjectParams,
  S3GetObjectResponse,
  S3DeleteObjectParams,
  S3ListObjectsParams,
  S3HeadObjectParams,
  S3HeadObjectResponse
} from './S3Module'

// NEW: Storage adapters for advanced multi-backend support
export {
  IStorageAdapter,
  BaseStorageAdapter,
  UnsupportedOperationError
} from './adapters/IStorageAdapter'

export { FilecoinAdapter } from './adapters/FilecoinAdapter'
export { MultiTierAdapter } from './adapters/MultiTierAdapter'
export { AdapterFactory } from './adapters/AdapterFactory'
export type { AdapterFactoryConfig } from './adapters/AdapterFactory'
