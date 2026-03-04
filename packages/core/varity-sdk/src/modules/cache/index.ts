/**
 * Varity SDK - Cache Module (stub)
 *
 * Placeholder for the caching capability module.
 * Will be implemented when backend cache infrastructure is available.
 */

import type { VaritySDK } from '../../core/VaritySDK'

export interface CacheOptions {
  ttl?: number
  key: string
}

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  ttl?: number
  createdAt: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
}

export class CacheModule {
  constructor(private sdk: VaritySDK) {}

  async get<T>(key: string): Promise<T | null> {
    throw new Error('Cache module not yet available. Coming in a future release.')
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    throw new Error('Cache module not yet available. Coming in a future release.')
  }

  async delete(key: string): Promise<boolean> {
    throw new Error('Cache module not yet available. Coming in a future release.')
  }

  async clear(): Promise<void> {
    throw new Error('Cache module not yet available. Coming in a future release.')
  }

  async stats(): Promise<CacheStats> {
    throw new Error('Cache module not yet available. Coming in a future release.')
  }
}
