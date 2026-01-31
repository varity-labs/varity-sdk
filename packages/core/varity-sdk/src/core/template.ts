/**
 * Template Configuration System
 *
 * Defines the schema and types for Varity templates (ISO, Healthcare, Finance, Retail, etc.)
 * Enables dynamic SDK configuration based on template selection
 */

import type { Network } from './types'

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Available template types
 */
export type TemplateType = 'iso' | 'healthcare' | 'finance' | 'retail' | 'custom'

/**
 * Contract configuration for a template
 */
export interface TemplateContract {
  /** Contract name */
  name: string
  /** Contract description */
  description?: string
  /** ABI file path or inline ABI */
  abi: string | any[]
  /** Contract address (per network) */
  addresses: Partial<Record<Network, string>>
  /** Whether contract is required for template */
  required?: boolean
}

/**
 * Entity configuration (e.g., Merchant, Patient, Customer)
 */
export interface TemplateEntity {
  /** Entity name */
  name: string
  /** Display name */
  displayName: string
  /** Entity description */
  description?: string
  /** Primary identifier field */
  idField: string
  /** Display field for entity */
  displayField: string
  /** Available fields */
  fields: EntityField[]
  /** API endpoints for entity CRUD */
  endpoints?: {
    list?: string
    get?: string
    create?: string
    update?: string
    delete?: string
  }
  /** Contract mapping configuration (optional - defaults to standard patterns) */
  contractMapping?: {
    /** Contract name (defaults to '{Entity}Registry') */
    contractName?: string
    /** Function names for CRUD operations */
    functions?: {
      /** Create function (defaults to 'create{Entity}') */
      create?: string
      /** Get/Read function (defaults to 'get{Entity}') */
      get?: string
      /** Get all/List function (defaults to 'getAll{Entity}s') */
      getAll?: string
      /** Update function (defaults to 'update{Entity}') */
      update?: string
      /** Delete function (defaults to 'delete{Entity}') */
      delete?: string
      /** Count function (defaults to 'get{Entity}Count') */
      count?: string
    }
    /** Field mappings (if contract field names differ from entity field names) */
    fieldMappings?: Record<string, string>
  }
}

/**
 * Entity field types - Universal support for all industries
 */
export type EntityFieldType =
  // Basic types
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object'
  // Financial types
  | 'currency'
  | 'decimal'
  | 'percentage'
  // Temporal types
  | 'date'
  | 'time'
  | 'datetime'
  | 'duration'
  // Contact types
  | 'email'
  | 'phone'
  | 'url'
  // Blockchain types
  | 'address'
  // Identification types
  | 'ssn'
  | 'tax-id'
  | 'medical-code'
  | 'sku'
  | 'barcode'
  // Content types
  | 'rich-text'
  | 'markdown'
  | 'json'
  // Media types
  | 'file'
  | 'image'
  | 'document'
  // Advanced types
  | 'lookup'
  | 'multi-select'
  | 'coordinates'
  | 'color'
  | 'ip-address'

/**
 * Entity field definition
 */
export interface EntityField {
  /** Field name */
  name: string
  /** Display label */
  label: string
  /** Field type */
  type: EntityFieldType
  /** Whether field is required */
  required?: boolean
  /** Field description */
  description?: string
  /** Enum values (if type is enum or multi-select) */
  enumValues?: string[]
  /** Lookup configuration (if type is lookup) */
  lookupConfig?: {
    entity: string
    displayField: string
    valueField: string
  }
  /** Validation rules */
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    precision?: number
    fileTypes?: string[]
    maxFileSize?: number
    custom?: string
  }
  /** Default value */
  defaultValue?: any
  /** Placeholder text */
  placeholder?: string
  /** Help text */
  helperText?: string
}

/**
 * Event configuration for webhooks and notifications
 */
export interface TemplateEvent {
  /** Event name */
  name: string
  /** Display name */
  displayName: string
  /** Event description */
  description?: string
  /** Event category */
  category: string
  /** Payload schema */
  payloadSchema?: Record<string, any>
}

/**
 * Metric configuration for analytics
 */
export interface TemplateMetric {
  /** Metric name */
  name: string
  /** Display name */
  displayName: string
  /** Metric description */
  description?: string
  /** Metric type */
  type: 'count' | 'sum' | 'average' | 'percentage' | 'rate'
  /** Data source (API endpoint or query) */
  source: string
  /** Aggregation function */
  aggregation?: string
  /** Unit of measurement */
  unit?: string
  /** Format for display */
  format?: string
}

/**
 * Dashboard configuration
 */
export interface TemplateDashboard {
  /** Dashboard name */
  name: string
  /** Display name */
  displayName: string
  /** Dashboard description */
  description?: string
  /** Widgets to display */
  widgets: DashboardWidget[]
  /** Default time range */
  defaultTimeRange?: string
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  /** Widget type */
  type: 'kpi' | 'chart' | 'table' | 'map' | 'list' | 'custom'
  /** Widget title */
  title: string
  /** Data source (metric name or API endpoint) */
  source: string
  /** Widget size (grid units) */
  size?: {
    width: number
    height: number
  }
  /** Widget position */
  position?: {
    x: number
    y: number
  }
  /** Widget configuration */
  config?: Record<string, any>
}

/**
 * Storage layer configuration for template
 */
export interface TemplateStorageConfig {
  /** Varity internal namespace */
  varityNamespace?: string
  /** Industry RAG namespace */
  industryNamespace?: string
  /** Customer data namespace pattern */
  customerNamespacePattern: string
  /** Encryption enabled */
  encryptionEnabled: boolean
  /** Lit Protocol access conditions */
  litProtocolEnabled: boolean
  /** Celestia DA enabled */
  celestiaDAEnabled: boolean
  /** ZK proofs enabled */
  zkProofsEnabled: boolean
}

/**
 * Complete template configuration
 */
export interface TemplateConfig {
  /** Template type identifier */
  type: TemplateType
  /** Template name */
  name: string
  /** Template version */
  version: string
  /** Template description */
  description?: string

  /** Smart contracts for this template */
  contracts: TemplateContract[]

  /** Entities (data models) */
  entities: TemplateEntity[]

  /** Available events */
  events: TemplateEvent[]

  /** Available metrics */
  metrics: TemplateMetric[]

  /** Dashboard configurations */
  dashboards?: TemplateDashboard[]

  /** Storage configuration */
  storage: TemplateStorageConfig

  /** API configuration */
  api?: {
    /** Base path for template APIs */
    basePath: string
    /** Custom endpoints */
    customEndpoints?: Record<string, string>
  }

  /** Feature flags */
  features?: {
    analytics?: boolean
    forecasting?: boolean
    webhooks?: boolean
    notifications?: boolean
    export?: boolean
    cache?: boolean
    monitoring?: boolean
  }

  /** Custom configuration */
  custom?: Record<string, any>
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Template registry for loading and managing templates
 */
export class TemplateRegistry {
  private templates: Map<TemplateType, TemplateConfig> = new Map()

  /**
   * Register a template configuration
   */
  register(config: TemplateConfig): void {
    this.templates.set(config.type, config)
  }

  /**
   * Get template configuration by type
   */
  get(type: TemplateType): TemplateConfig | undefined {
    return this.templates.get(type)
  }

  /**
   * Check if template is registered
   */
  has(type: TemplateType): boolean {
    return this.templates.has(type)
  }

  /**
   * List all registered templates
   */
  list(): TemplateConfig[] {
    return Array.from(this.templates.values())
  }

  /**
   * Load template from JSON
   */
  loadFromJSON(json: string): TemplateConfig {
    const config = JSON.parse(json) as TemplateConfig
    this.register(config)
    return config
  }

  /**
   * Load template from URL
   */
  async loadFromURL(url: string): Promise<TemplateConfig> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load template from ${url}: ${response.statusText}`)
    }
    const json = await response.text()
    return this.loadFromJSON(json)
  }
}

// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================

/**
 * Global template registry instance
 */
export const templateRegistry = new TemplateRegistry()

// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================

/**
 * Validate template configuration
 */
export function validateTemplate(config: TemplateConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate required fields
  if (!config.type) errors.push('Template type is required')
  if (!config.name) errors.push('Template name is required')
  if (!config.version) errors.push('Template version is required')
  if (!config.contracts || config.contracts.length === 0) {
    errors.push('Template must have at least one contract')
  }
  if (!config.entities || config.entities.length === 0) {
    errors.push('Template must have at least one entity')
  }
  if (!config.storage) errors.push('Storage configuration is required')

  // Validate contracts
  if (config.contracts) {
    config.contracts.forEach((contract, index) => {
      if (!contract.name) errors.push(`Contract ${index}: name is required`)
      if (!contract.abi) errors.push(`Contract ${index}: ABI is required`)
      if (!contract.addresses || Object.keys(contract.addresses).length === 0) {
        errors.push(`Contract ${index}: at least one network address is required`)
      }
    })
  }

  // Validate entities
  if (config.entities) {
    config.entities.forEach((entity, index) => {
      if (!entity.name) errors.push(`Entity ${index}: name is required`)
      if (!entity.idField) errors.push(`Entity ${index}: idField is required`)
      if (!entity.fields || entity.fields.length === 0) {
        errors.push(`Entity ${index}: at least one field is required`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get contract ABI by name from template
 */
export function getContractABI(template: TemplateConfig, contractName: string): any[] | null {
  const contract = template.contracts.find(c => c.name === contractName)
  if (!contract) return null

  // Return inline ABI or load from path
  if (Array.isArray(contract.abi)) {
    return contract.abi
  }

  // If ABI is a string path, it should be loaded by the application
  return null
}

/**
 * Get contract address for network
 */
export function getContractAddress(
  template: TemplateConfig,
  contractName: string,
  network: Network
): string | null {
  const contract = template.contracts.find(c => c.name === contractName)
  if (!contract) return null

  return contract.addresses[network] || null
}

/**
 * Get entity configuration by name
 */
export function getEntity(template: TemplateConfig, entityName: string): TemplateEntity | null {
  return template.entities.find(e => e.name === entityName) || null
}

/**
 * Get metric configuration by name
 */
export function getMetric(template: TemplateConfig, metricName: string): TemplateMetric | null {
  return template.metrics.find(m => m.name === metricName) || null
}

/**
 * Get event configuration by name
 */
export function getEvent(template: TemplateConfig, eventName: string): TemplateEvent | null {
  return template.events.find(e => e.name === eventName) || null
}

/**
 * Merge template configuration with overrides
 */
export function mergeTemplateConfig(
  base: TemplateConfig,
  overrides: Partial<TemplateConfig>
): TemplateConfig {
  // Properly merge API config
  let mergedApi: TemplateConfig['api'] = undefined
  if (base.api && overrides.api) {
    mergedApi = { ...base.api, ...overrides.api }
  } else if (base.api) {
    mergedApi = base.api
  } else if (overrides.api) {
    mergedApi = overrides.api as any
  }

  return {
    ...base,
    ...overrides,
    contracts: overrides.contracts || base.contracts,
    entities: overrides.entities || base.entities,
    events: overrides.events || base.events,
    metrics: overrides.metrics || base.metrics,
    dashboards: overrides.dashboards || base.dashboards,
    storage: { ...base.storage, ...overrides.storage },
    api: mergedApi,
    features: { ...base.features, ...overrides.features },
    custom: { ...base.custom, ...overrides.custom }
  }
}
