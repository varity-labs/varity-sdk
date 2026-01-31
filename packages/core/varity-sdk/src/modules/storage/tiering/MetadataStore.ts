/**
 * Varity SDK - Metadata Store
 *
 * Persistent storage for tiering metadata with support for multiple backends.
 * Enables cross-instance consistency and historical tracking of tier transitions.
 *
 * Features:
 * - Multiple storage backends (in-memory, file, IPFS, SQL)
 * - Atomic updates
 * - Batch operations
 * - Historical tracking
 * - Efficient querying
 *
 * @packageDocumentation
 */

import { StorageLayer, StorageTier } from '@varity-labs/types'

/**
 * Tiering metadata for an object
 */
export interface TieringMetadata {
  /** Object identifier */
  identifier: string
  /** Current storage tier */
  tier: StorageTier
  /** Storage layer */
  layer: StorageLayer
  /** Object size in bytes */
  size: number
  /** Creation timestamp */
  createdAt: Date
  /** Last accessed timestamp */
  lastAccessed: Date
  /** Total access count */
  accessCount: number
  /** Last tier change timestamp */
  lastTierChange?: Date
  /** Tier change history */
  tierHistory?: TierTransition[]
  /** Custom tags */
  tags?: Record<string, string>
  /** Additional metadata */
  customMetadata?: Record<string, any>
}

/**
 * Tier transition record
 */
export interface TierTransition {
  /** Transition timestamp */
  timestamp: Date
  /** From tier */
  fromTier: StorageTier
  /** To tier */
  toTier: StorageTier
  /** Reason for transition */
  reason: string
  /** Cost impact (positive = savings) */
  costImpact: number
}

/**
 * Query options for metadata
 */
export interface MetadataQueryOptions {
  /** Filter by storage tier */
  tier?: StorageTier
  /** Filter by storage layer */
  layer?: StorageLayer
  /** Filter by tags */
  tags?: Record<string, string>
  /** Minimum size in bytes */
  minSize?: number
  /** Maximum size in bytes */
  maxSize?: number
  /** Created after date */
  createdAfter?: Date
  /** Created before date */
  createdBefore?: Date
  /** Accessed after date */
  accessedAfter?: Date
  /** Accessed before date */
  accessedBefore?: Date
  /** Limit results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Sort field */
  sortBy?: 'createdAt' | 'lastAccessed' | 'size' | 'accessCount'
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Batch update operation
 */
export interface BatchUpdate {
  /** Object identifier */
  identifier: string
  /** Metadata updates */
  updates: Partial<TieringMetadata>
}

/**
 * Storage backend type
 */
export enum MetadataBackend {
  /** In-memory storage (not persistent) */
  MEMORY = 'memory',
  /** File-based storage (JSON) */
  FILE = 'file',
  /** IPFS/Filecoin storage */
  IPFS = 'ipfs',
  /** SQL database (SQLite, PostgreSQL, etc.) */
  SQL = 'sql'
}

/**
 * Metadata store configuration
 */
export interface MetadataStoreConfig {
  /** Storage backend */
  backend: MetadataBackend
  /** Backend-specific options */
  backendOptions?: Record<string, any>
  /** Enable automatic backups */
  enableBackups?: boolean
  /** Backup interval in minutes */
  backupIntervalMinutes?: number
  /** Enable compression */
  enableCompression?: boolean
  /** Cache TTL in milliseconds */
  cacheTTL?: number
}

/**
 * Metadata store statistics
 */
export interface MetadataStoreStats {
  /** Total metadata entries */
  totalEntries: number
  /** Entries by tier */
  byTier: Record<StorageTier, number>
  /** Entries by layer */
  byLayer: Record<StorageLayer, number>
  /** Total storage size tracked */
  totalSize: number
  /** Last update timestamp */
  lastUpdate: Date
  /** Backend type */
  backend: MetadataBackend
}

/**
 * Persistent metadata store for tiering system
 *
 * @example
 * ```typescript
 * const store = new MetadataStore({
 *   backend: MetadataBackend.FILE,
 *   backendOptions: {
 *     filePath: './tiering-metadata.json'
 *   },
 *   enableBackups: true
 * })
 *
 * await store.initialize()
 *
 * // Save metadata
 * await store.save('obj-123', {
 *   identifier: 'obj-123',
 *   tier: StorageTier.HOT,
 *   layer: StorageLayer.CUSTOMER_DATA,
 *   size: 1024 * 1024,
 *   createdAt: new Date(),
 *   lastAccessed: new Date(),
 *   accessCount: 1
 * })
 *
 * // Load metadata
 * const metadata = await store.load('obj-123')
 * console.log(`Tier: ${metadata?.tier}`)
 *
 * // Query metadata
 * const hotObjects = await store.query({
 *   tier: StorageTier.HOT,
 *   limit: 10
 * })
 * ```
 */
export class MetadataStore {
  private config: Required<MetadataStoreConfig>
  private cache: Map<string, { metadata: TieringMetadata; timestamp: number }>
  private memoryStore: Map<string, TieringMetadata>
  private initialized: boolean = false
  private backupInterval: NodeJS.Timeout | null = null

  constructor(config: MetadataStoreConfig) {
    this.config = {
      backend: config.backend,
      backendOptions: config.backendOptions || {},
      enableBackups: config.enableBackups ?? false,
      backupIntervalMinutes: config.backupIntervalMinutes ?? 60,
      enableCompression: config.enableCompression ?? false,
      cacheTTL: config.cacheTTL ?? 5 * 60 * 1000 // 5 minutes
    }

    this.cache = new Map()
    this.memoryStore = new Map()
  }

  /**
   * Initialize the metadata store
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    switch (this.config.backend) {
      case MetadataBackend.MEMORY:
        // No initialization needed for memory backend
        break

      case MetadataBackend.FILE:
        await this.initializeFileBackend()
        break

      case MetadataBackend.IPFS:
        await this.initializeIPFSBackend()
        break

      case MetadataBackend.SQL:
        await this.initializeSQLBackend()
        break
    }

    // Start backup process if enabled
    if (this.config.enableBackups) {
      this.startBackupProcess()
    }

    this.initialized = true
  }

  /**
   * Save metadata for an object
   *
   * @param identifier - Object identifier
   * @param metadata - Tiering metadata
   */
  async save(identifier: string, metadata: TieringMetadata): Promise<void> {
    if (!this.initialized) {
      throw new Error('MetadataStore not initialized. Call initialize() first.')
    }

    // Update memory store
    this.memoryStore.set(identifier, metadata)

    // Invalidate cache
    this.cache.delete(identifier)

    // Persist to backend
    await this.persistToBackend(identifier, metadata)
  }

  /**
   * Load metadata for an object
   *
   * @param identifier - Object identifier
   * @returns Tiering metadata or null if not found
   */
  async load(identifier: string): Promise<TieringMetadata | null> {
    if (!this.initialized) {
      throw new Error('MetadataStore not initialized. Call initialize() first.')
    }

    // Check cache first
    const cached = this.cache.get(identifier)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.metadata
    }

    // Check memory store
    let metadata = this.memoryStore.get(identifier) || null

    // Load from backend if not in memory
    if (!metadata) {
      metadata = await this.loadFromBackend(identifier)
      if (metadata) {
        this.memoryStore.set(identifier, metadata)
      }
    }

    // Update cache
    if (metadata) {
      this.cache.set(identifier, {
        metadata,
        timestamp: Date.now()
      })
    }

    return metadata
  }

  /**
   * Delete metadata for an object
   *
   * @param identifier - Object identifier
   */
  async delete(identifier: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('MetadataStore not initialized. Call initialize() first.')
    }

    // Remove from memory and cache
    this.memoryStore.delete(identifier)
    this.cache.delete(identifier)

    // Delete from backend
    await this.deleteFromBackend(identifier)
  }

  /**
   * List all metadata entries
   *
   * @returns Map of all metadata
   */
  async listAll(): Promise<Map<string, TieringMetadata>> {
    if (!this.initialized) {
      throw new Error('MetadataStore not initialized. Call initialize() first.')
    }

    // Return memory store for now
    // In production, this would load from backend
    return new Map(this.memoryStore)
  }

  /**
   * Query metadata with filters
   *
   * @param options - Query options
   * @returns Filtered metadata entries
   */
  async query(options: MetadataQueryOptions = {}): Promise<TieringMetadata[]> {
    const allMetadata = await this.listAll()
    let results = Array.from(allMetadata.values())

    // Apply filters
    if (options.tier !== undefined) {
      results = results.filter(m => m.tier === options.tier)
    }

    if (options.layer !== undefined) {
      results = results.filter(m => m.layer === options.layer)
    }

    if (options.tags) {
      results = results.filter(m => {
        if (!m.tags) return false
        return Object.entries(options.tags!).every(
          ([key, value]) => m.tags![key] === value
        )
      })
    }

    if (options.minSize !== undefined) {
      results = results.filter(m => m.size >= options.minSize!)
    }

    if (options.maxSize !== undefined) {
      results = results.filter(m => m.size <= options.maxSize!)
    }

    if (options.createdAfter) {
      results = results.filter(m => m.createdAt >= options.createdAfter!)
    }

    if (options.createdBefore) {
      results = results.filter(m => m.createdAt <= options.createdBefore!)
    }

    if (options.accessedAfter) {
      results = results.filter(m => m.lastAccessed >= options.accessedAfter!)
    }

    if (options.accessedBefore) {
      results = results.filter(m => m.lastAccessed <= options.accessedBefore!)
    }

    // Sort results
    if (options.sortBy) {
      results.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (options.sortBy) {
          case 'createdAt':
            aVal = a.createdAt.getTime()
            bVal = b.createdAt.getTime()
            break
          case 'lastAccessed':
            aVal = a.lastAccessed.getTime()
            bVal = b.lastAccessed.getTime()
            break
          case 'size':
            aVal = a.size
            bVal = b.size
            break
          case 'accessCount':
            aVal = a.accessCount
            bVal = b.accessCount
            break
          default:
            return 0
        }

        const order = options.sortOrder === 'desc' ? -1 : 1
        return aVal < bVal ? -order : aVal > bVal ? order : 0
      })
    }

    // Apply pagination
    const offset = options.offset || 0
    const limit = options.limit || results.length
    results = results.slice(offset, offset + limit)

    return results
  }

  /**
   * Batch save metadata
   *
   * @param entries - Array of metadata entries
   */
  async batchSave(entries: TieringMetadata[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('MetadataStore not initialized. Call initialize() first.')
    }

    for (const metadata of entries) {
      this.memoryStore.set(metadata.identifier, metadata)
      this.cache.delete(metadata.identifier)
    }

    await this.batchPersistToBackend(entries)
  }

  /**
   * Batch update metadata
   *
   * @param updates - Array of batch updates
   */
  async batchUpdate(updates: BatchUpdate[]): Promise<void> {
    for (const update of updates) {
      const existing = await this.load(update.identifier)
      if (existing) {
        const updated = { ...existing, ...update.updates }
        await this.save(update.identifier, updated)
      }
    }
  }

  /**
   * Record a tier transition
   *
   * @param identifier - Object identifier
   * @param fromTier - Source tier
   * @param toTier - Destination tier
   * @param reason - Reason for transition
   * @param costImpact - Cost impact of transition
   */
  async recordTierTransition(
    identifier: string,
    fromTier: StorageTier,
    toTier: StorageTier,
    reason: string,
    costImpact: number = 0
  ): Promise<void> {
    const metadata = await this.load(identifier)
    if (!metadata) return

    const transition: TierTransition = {
      timestamp: new Date(),
      fromTier,
      toTier,
      reason,
      costImpact
    }

    metadata.tier = toTier
    metadata.lastTierChange = transition.timestamp

    if (!metadata.tierHistory) {
      metadata.tierHistory = []
    }
    metadata.tierHistory.push(transition)

    // Keep only last 10 transitions
    if (metadata.tierHistory.length > 10) {
      metadata.tierHistory = metadata.tierHistory.slice(-10)
    }

    await this.save(identifier, metadata)
  }

  /**
   * Get statistics about stored metadata
   *
   * @returns Metadata store statistics
   */
  async getStats(): Promise<MetadataStoreStats> {
    const allMetadata = await this.listAll()

    const byTier: Record<StorageTier, number> = {
      [StorageTier.HOT]: 0,
      [StorageTier.WARM]: 0,
      [StorageTier.COLD]: 0,
      [StorageTier.GLACIER]: 0
    }

    const byLayer: Record<StorageLayer, number> = {
      [StorageLayer.VARITY_INTERNAL]: 0,
      [StorageLayer.INDUSTRY_RAG]: 0,
      [StorageLayer.CUSTOMER_DATA]: 0
    }

    let totalSize = 0

    for (const metadata of allMetadata.values()) {
      byTier[metadata.tier]++
      byLayer[metadata.layer]++
      totalSize += metadata.size
    }

    return {
      totalEntries: allMetadata.size,
      byTier,
      byLayer,
      totalSize,
      lastUpdate: new Date(),
      backend: this.config.backend
    }
  }

  /**
   * Export metadata to JSON
   *
   * @returns JSON string
   */
  async exportToJSON(): Promise<string> {
    const allMetadata = await this.listAll()
    const data: Record<string, TieringMetadata> = {}

    for (const [identifier, metadata] of allMetadata.entries()) {
      data[identifier] = metadata
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Import metadata from JSON
   *
   * @param json - JSON string
   */
  async importFromJSON(json: string): Promise<void> {
    const data = JSON.parse(json) as Record<string, TieringMetadata>

    const entries: TieringMetadata[] = []
    for (const [identifier, metadata] of Object.entries(data)) {
      // Convert date strings back to Date objects
      entries.push({
        ...metadata,
        createdAt: new Date(metadata.createdAt),
        lastAccessed: new Date(metadata.lastAccessed),
        lastTierChange: metadata.lastTierChange
          ? new Date(metadata.lastTierChange)
          : undefined,
        tierHistory: metadata.tierHistory?.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }))
      })
    }

    await this.batchSave(entries)
  }

  /**
   * Clear all metadata
   */
  async clear(): Promise<void> {
    this.memoryStore.clear()
    this.cache.clear()

    // Clear backend storage
    await this.clearBackend()
  }

  /**
   * Destroy the metadata store and clean up resources
   */
  destroy(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }

    this.memoryStore.clear()
    this.cache.clear()
    this.initialized = false
  }

  // ========================================================================
  // Backend-specific methods
  // ========================================================================

  private async initializeFileBackend(): Promise<void> {
    const filePath = this.config.backendOptions.filePath || './tiering-metadata.json'

    // Try to load existing file
    try {
      const fs = await import('fs/promises')
      const data = await fs.readFile(filePath, 'utf-8')
      await this.importFromJSON(data)
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
    }
  }

  private async initializeIPFSBackend(): Promise<void> {
    // IPFS backend initialization would go here
    // For now, fall back to memory
    console.warn('IPFS backend not yet implemented, using memory backend')
  }

  private async initializeSQLBackend(): Promise<void> {
    // SQL backend initialization would go here
    // For now, fall back to memory
    console.warn('SQL backend not yet implemented, using memory backend')
  }

  private async persistToBackend(
    identifier: string,
    metadata: TieringMetadata
  ): Promise<void> {
    switch (this.config.backend) {
      case MetadataBackend.FILE:
        await this.persistToFile()
        break
      case MetadataBackend.IPFS:
        // IPFS persistence
        break
      case MetadataBackend.SQL:
        // SQL persistence
        break
      default:
        // Memory backend - no persistence needed
        break
    }
  }

  private async loadFromBackend(identifier: string): Promise<TieringMetadata | null> {
    // Already loaded in memory during initialization
    return null
  }

  private async deleteFromBackend(identifier: string): Promise<void> {
    switch (this.config.backend) {
      case MetadataBackend.FILE:
        await this.persistToFile()
        break
      default:
        break
    }
  }

  private async batchPersistToBackend(entries: TieringMetadata[]): Promise<void> {
    switch (this.config.backend) {
      case MetadataBackend.FILE:
        await this.persistToFile()
        break
      default:
        break
    }
  }

  private async clearBackend(): Promise<void> {
    switch (this.config.backend) {
      case MetadataBackend.FILE:
        await this.persistToFile()
        break
      default:
        break
    }
  }

  private async persistToFile(): Promise<void> {
    const filePath = this.config.backendOptions.filePath || './tiering-metadata.json'

    try {
      const fs = await import('fs/promises')
      const json = await this.exportToJSON()
      await fs.writeFile(filePath, json, 'utf-8')
    } catch (error) {
      console.error('Failed to persist to file:', error)
    }
  }

  private startBackupProcess(): void {
    const intervalMs = this.config.backupIntervalMinutes * 60 * 1000

    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup()
      } catch (error) {
        console.error('Backup failed:', error)
      }
    }, intervalMs)
  }

  private async createBackup(): Promise<void> {
    if (this.config.backend === MetadataBackend.FILE) {
      const filePath = this.config.backendOptions.filePath || './tiering-metadata.json'
      const backupPath = `${filePath}.backup.${Date.now()}`

      try {
        const fs = await import('fs/promises')
        const json = await this.exportToJSON()
        await fs.writeFile(backupPath, json, 'utf-8')

        // Clean up old backups (keep last 5)
        const dir = filePath.substring(0, filePath.lastIndexOf('/') || 0) || '.'
        const files = await fs.readdir(dir)
        const backups = files
          .filter(f => f.startsWith('tiering-metadata.json.backup'))
          .sort()

        if (backups.length > 5) {
          for (const backup of backups.slice(0, backups.length - 5)) {
            await fs.unlink(`${dir}/${backup}`)
          }
        }
      } catch (error) {
        console.error('Backup creation failed:', error)
      }
    }
  }
}
