/**
 * Template Validator
 *
 * Validates template configuration against schema and best practices
 */

import * as fs from 'fs'
import * as path from 'path'
import type { TemplateConfig, EntityFieldType } from '../core/template'

export interface ValidateTemplateOptions {
  templatePath: string
  strict: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    entities: number
    contracts: number
    events: number
    metrics: number
  }
}

/**
 * Validate template configuration
 */
export async function validateTemplate(
  options: ValidateTemplateOptions
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: false,
    errors: [],
    warnings: [],
    summary: {
      entities: 0,
      contracts: 0,
      events: 0,
      metrics: 0
    }
  }

  try {
    // Check if file exists
    if (!fs.existsSync(options.templatePath)) {
      result.errors.push(`Template file not found: ${options.templatePath}`)
      return result
    }

    // Parse JSON
    const templateContent = fs.readFileSync(options.templatePath, 'utf-8')
    let template: TemplateConfig

    try {
      template = JSON.parse(templateContent)
    } catch (parseError) {
      result.errors.push(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`)
      return result
    }

    // Validate schema
    validateSchema(template, result, options.strict)

    // Validate entities
    validateEntities(template, result, options.strict)

    // Validate contracts
    validateContracts(template, result, options.strict)

    // Validate storage configuration
    validateStorage(template, result, options.strict)

    // Validate API configuration
    validateAPI(template, result, options.strict)

    // Validate features
    validateFeatures(template, result, options.strict)

    // Generate summary
    result.summary = {
      entities: template.entities?.length || 0,
      contracts: template.contracts?.length || 0,
      events: template.events?.length || 0,
      metrics: template.metrics?.length || 0
    }

    // Set overall validity
    result.valid = result.errors.length === 0

  } catch (error) {
    result.errors.push(
      `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Validate template schema
 */
function validateSchema(
  template: TemplateConfig,
  result: ValidationResult,
  strict: boolean
): void {
  // Required fields
  if (!template.type) {
    result.errors.push('Missing required field: type')
  }

  if (!template.name) {
    result.errors.push('Missing required field: name')
  }

  if (!template.version) {
    result.errors.push('Missing required field: version')
  }

  // Version format
  if (template.version && !/^\d+\.\d+\.\d+$/.test(template.version)) {
    result.warnings.push('Version should follow semantic versioning (e.g., 1.0.0)')
  }

  // Description
  if (!template.description) {
    if (strict) {
      result.errors.push('Missing required field: description')
    } else {
      result.warnings.push('Missing description field')
    }
  }
}

/**
 * Validate entities
 */
function validateEntities(
  template: TemplateConfig,
  result: ValidationResult,
  strict: boolean
): void {
  if (!template.entities || template.entities.length === 0) {
    result.errors.push('Template must have at least one entity')
    return
  }

  template.entities.forEach((entity, index) => {
    const prefix = `Entity ${entity.name || index}`

    // Required fields
    if (!entity.name) {
      result.errors.push(`${prefix}: Missing name`)
    }

    if (!entity.idField) {
      result.errors.push(`${prefix}: Missing idField`)
    }

    // Fields validation
    if (!entity.fields || entity.fields.length === 0) {
      result.errors.push(`${prefix}: Must have at least one field`)
    } else {
      // Check for idField existence
      const hasIdField = entity.fields.some(f => f.name === entity.idField)
      if (!hasIdField) {
        result.errors.push(`${prefix}: idField "${entity.idField}" not found in fields`)
      }

      // Check for required tracking fields
      const hasCreatedAt = entity.fields.some(f => f.name === 'createdAt')
      const hasIsActive = entity.fields.some(f => f.name === 'isActive')

      if (!hasCreatedAt) {
        result.warnings.push(`${prefix}: Missing recommended field "createdAt"`)
      }

      if (!hasIsActive) {
        result.warnings.push(`${prefix}: Missing recommended field "isActive"`)
      }

      // Validate field types
      entity.fields.forEach((field, fieldIndex) => {
        const fieldPrefix = `${prefix}.fields[${fieldIndex}]`

        if (!field.name) {
          result.errors.push(`${fieldPrefix}: Missing name`)
        }

        if (!field.type) {
          result.errors.push(`${fieldPrefix}: Missing type`)
        } else {
          // Universal field types - supporting all industries
          const validTypes: string[] = [
            // Basic types
            'string', 'number', 'boolean', 'enum', 'array', 'object',
            // Financial types
            'currency', 'decimal', 'percentage',
            // Temporal types
            'date', 'time', 'datetime', 'duration',
            // Contact types
            'email', 'phone', 'url',
            // Blockchain types
            'address',
            // Identification types
            'ssn', 'tax-id', 'medical-code', 'sku', 'barcode',
            // Content types
            'rich-text', 'markdown', 'json',
            // Media types
            'file', 'image', 'document',
            // Advanced types
            'lookup', 'multi-select', 'coordinates', 'color', 'ip-address',
            // Legacy types
            'bytes', 'bytes32'
          ]
          if (!validTypes.includes(field.type)) {
            result.warnings.push(
              `${fieldPrefix}: Unknown type "${field.type}". Valid types: ${validTypes.join(', ')}`
            )
          }
        }

        // Additional validation for specific field types
        if (field.type === 'enum' || field.type === 'multi-select') {
          if (!field.enumValues || field.enumValues.length === 0) {
            result.errors.push(`${fieldPrefix}: Field type "${field.type}" requires enumValues`)
          }
        }

        if (field.type === 'lookup') {
          if (!(field as any).lookupConfig) {
            result.errors.push(`${fieldPrefix}: Field type "lookup" requires lookupConfig`)
          }
        }

        // Validation rule checks
        if (field.validation) {
          // Validate email pattern
          if (field.type === 'email' && !field.validation.pattern) {
            result.warnings.push(`${fieldPrefix}: Email field should have validation pattern`)
          }

          // Validate phone pattern
          if (field.type === 'phone' && !field.validation.pattern) {
            result.warnings.push(`${fieldPrefix}: Phone field should have validation pattern`)
          }

          // Validate currency precision
          if (field.type === 'currency' && !field.validation.precision) {
            result.warnings.push(`${fieldPrefix}: Currency field should have precision validation`)
          }

          // Validate file types
          if (['file', 'image', 'document'].includes(field.type) && !field.validation.fileTypes) {
            result.warnings.push(`${fieldPrefix}: File field should specify allowed fileTypes`)
          }
        }
      })
    }

    // Display name
    if (!entity.displayName && strict) {
      result.warnings.push(`${prefix}: Missing displayName`)
    }
  })
}

/**
 * Validate contracts
 */
function validateContracts(
  template: TemplateConfig,
  result: ValidationResult,
  strict: boolean
): void {
  if (!template.contracts || template.contracts.length === 0) {
    result.warnings.push('No contracts defined in template')
    return
  }

  template.contracts.forEach((contract, index) => {
    const prefix = `Contract ${contract.name || index}`

    if (!contract.name) {
      result.errors.push(`${prefix}: Missing name`)
    }

    if (!contract.abi) {
      result.warnings.push(`${prefix}: Missing ABI path`)
    }

    if (!contract.addresses) {
      result.warnings.push(`${prefix}: Missing addresses configuration`)
    } else {
      // Check for network addresses
      const networks = ['arbitrum-sepolia', 'arbitrum-l3-testnet', 'arbitrum-l3-mainnet']
      networks.forEach(network => {
        if (!(network in contract.addresses)) {
          result.warnings.push(`${prefix}: Missing address for network "${network}"`)
        }
      })
    }
  })
}

/**
 * Validate storage configuration
 */
function validateStorage(
  template: TemplateConfig,
  result: ValidationResult,
  strict: boolean
): void {
  if (!template.storage) {
    if (strict) {
      result.errors.push('Missing storage configuration')
    } else {
      result.warnings.push('Missing storage configuration')
    }
    return
  }

  // Check namespace patterns
  if (!template.storage.varityNamespace) {
    result.warnings.push('Missing varityNamespace in storage config')
  }

  if (!template.storage.industryNamespace) {
    result.warnings.push('Missing industryNamespace in storage config')
  }

  if (!template.storage.customerNamespacePattern) {
    result.warnings.push('Missing customerNamespacePattern in storage config')
  }

  // Validate namespace pattern format
  const patterns = [
    template.storage.customerNamespacePattern
  ].filter(Boolean)

  patterns.forEach(pattern => {
    if (pattern && !pattern.includes('{') && !pattern.includes('}')) {
      result.warnings.push(`Namespace pattern "${pattern}" should include placeholders like {category}`)
    }
  })
}

/**
 * Validate API configuration
 */
function validateAPI(
  template: TemplateConfig,
  result: ValidationResult,
  strict: boolean
): void {
  if (!template.api) {
    result.warnings.push('Missing API configuration')
    return
  }

  if (!template.api.basePath) {
    result.warnings.push('Missing API basePath')
  } else if (!template.api.basePath.startsWith('/api/')) {
    result.warnings.push('API basePath should start with /api/')
  }
}

/**
 * Validate features
 */
function validateFeatures(
  template: TemplateConfig,
  result: ValidationResult,
  strict: boolean
): void {
  if (!template.features) {
    result.warnings.push('Missing features configuration')
    return
  }

  const recommendedFeatures = [
    'analytics',
    'forecasting',
    'notifications',
    'export',
    'cache',
    'monitoring'
  ]

  if (template.features) {
    recommendedFeatures.forEach(feature => {
      if (!(feature in template.features!)) {
        result.warnings.push(`Missing recommended feature: ${feature}`)
      }
    })
  }
}
