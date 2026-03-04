/**
 * Tests for template validator
 */

import * as fs from 'fs'
import { validateTemplate } from '../template-validator'

// Mock dependencies
jest.mock('fs')

describe('Template Validator', () => {
  const mockFs = fs as jest.Mocked<typeof fs>

  const validTemplate = {
    type: 'test',
    name: 'Test Template',
    version: '1.0.0',
    description: 'Test template description',
    entities: [
      {
        name: 'customer',
        displayName: 'Customer',
        description: 'Customer entity',
        idField: 'customerId',
        displayField: 'customerName',
        fields: [
          {
            name: 'customerId',
            label: 'Customer ID',
            type: 'string',
            required: true
          },
          {
            name: 'customerName',
            label: 'Customer Name',
            type: 'string',
            required: true
          },
          {
            name: 'createdAt',
            label: 'Created At',
            type: 'number',
            required: true
          },
          {
            name: 'isActive',
            label: 'Is Active',
            type: 'boolean',
            required: true
          }
        ]
      }
    ],
    contracts: [
      {
        name: 'CustomerRegistry',
        description: 'Customer registry contract',
        abi: './abis/CustomerRegistry.json',
        addresses: {
          'arbitrum-sepolia': '0x...',
          'arbitrum-l3-testnet': '',
          'arbitrum-l3-mainnet': ''
        },
        required: true
      }
    ],
    events: [
      {
        name: 'customer_created',
        displayName: 'Customer Created',
        description: 'New customer created',
        category: 'entity'
      }
    ],
    metrics: [
      {
        name: 'total_customers',
        displayName: 'Total Customers',
        description: 'Total number of customers',
        type: 'count',
        source: 'contract'
      }
    ],
    storage: {
      varityNamespace: 'varity-internal-test',
      industryNamespace: 'industry-test-rag',
      customerNamespacePattern: 'customer-test-{company-id}-{data-type}',
      encryptionEnabled: true,
      litProtocolEnabled: true,
      celestiaDAEnabled: true,
      zkProofsEnabled: true
    },
    api: {
      basePath: '/api/v1/test'
    },
    features: {
      analytics: true,
      forecasting: true,
      notifications: true,
      export: true,
      cache: true,
      monitoring: true
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync = jest.fn().mockReturnValue(true)
    mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(validTemplate))
  })

  describe('Basic validation', () => {
    it('should validate correct template successfully', async () => {
      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error if template file not found', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)

      const result = await validateTemplate({
        templatePath: './templates/missing.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should return error for invalid JSON', async () => {
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json {')

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Invalid JSON')
    })

    it('should return validation summary', async () => {
      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.summary).toBeDefined()
      expect(result.summary.entities).toBe(1)
      expect(result.summary.contracts).toBe(1)
      expect(result.summary.events).toBe(1)
      expect(result.summary.metrics).toBe(1)
    })
  })

  describe('Schema validation', () => {
    it('should require type field', async () => {
      const invalidTemplate = { ...validTemplate }
      delete (invalidTemplate as any).type

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required field: type')
    })

    it('should require name field', async () => {
      const invalidTemplate = { ...validTemplate }
      delete (invalidTemplate as any).name

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required field: name')
    })

    it('should require version field', async () => {
      const invalidTemplate = { ...validTemplate }
      delete (invalidTemplate as any).version

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required field: version')
    })

    it('should validate semantic versioning format', async () => {
      const invalidTemplate = { ...validTemplate, version: 'v1.0' }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const versionWarning = result.warnings.find(w => w.includes('semantic versioning'))
      expect(versionWarning).toBeDefined()
    })

    it('should warn if description is missing in non-strict mode', async () => {
      const templateWithoutDesc = { ...validTemplate }
      delete (templateWithoutDesc as any).description

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutDesc))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const descWarning = result.warnings.find(w => w.includes('description'))
      expect(descWarning).toBeDefined()
    })

    it('should error if description is missing in strict mode', async () => {
      const templateWithoutDesc = { ...validTemplate }
      delete (templateWithoutDesc as any).description

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutDesc))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: true
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required field: description')
    })
  })

  describe('Entity validation', () => {
    it('should require at least one entity', async () => {
      const templateWithoutEntities = { ...validTemplate, entities: [] }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutEntities))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must have at least one entity')
    })

    it('should require entity name', async () => {
      const invalidTemplate = {
        ...validTemplate,
        entities: [
          {
            idField: 'id',
            fields: []
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const nameError = result.errors.find(e => e.includes('Missing name'))
      expect(nameError).toBeDefined()
    })

    it('should require entity idField', async () => {
      const invalidTemplate = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            fields: []
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const idFieldError = result.errors.find(e => e.includes('Missing idField'))
      expect(idFieldError).toBeDefined()
    })

    it('should require at least one field per entity', async () => {
      const invalidTemplate = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: []
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const fieldsError = result.errors.find(e => e.includes('Must have at least one field'))
      expect(fieldsError).toBeDefined()
    })

    it('should verify idField exists in fields', async () => {
      const invalidTemplate = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'nonexistentId',
            fields: [
              {
                name: 'customerId',
                type: 'string',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const idFieldError = result.errors.find(e => e.includes('not found in fields'))
      expect(idFieldError).toBeDefined()
    })

    it('should warn if createdAt field is missing', async () => {
      const templateWithoutCreatedAt = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: [
              {
                name: 'customerId',
                type: 'string',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutCreatedAt))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const createdAtWarning = result.warnings.find(w => w.includes('createdAt'))
      expect(createdAtWarning).toBeDefined()
    })

    it('should warn if isActive field is missing', async () => {
      const templateWithoutIsActive = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: [
              {
                name: 'customerId',
                type: 'string',
                required: true
              },
              {
                name: 'createdAt',
                type: 'number',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutIsActive))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const isActiveWarning = result.warnings.find(w => w.includes('isActive'))
      expect(isActiveWarning).toBeDefined()
    })
  })

  describe('Field validation', () => {
    it('should require field name', async () => {
      const invalidTemplate = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'id',
            fields: [
              {
                type: 'string',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const nameError = result.errors.find(e => e.includes('Missing name'))
      expect(nameError).toBeDefined()
    })

    it('should require field type', async () => {
      const invalidTemplate = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: [
              {
                name: 'customerId',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidTemplate))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const typeError = result.errors.find(e => e.includes('Missing type'))
      expect(typeError).toBeDefined()
    })

    it('should warn for unknown field types', async () => {
      const templateWithUnknownType = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: [
              {
                name: 'customerId',
                type: 'unknown-type',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithUnknownType))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const typeWarning = result.warnings.find(w => w.includes('Unknown type'))
      expect(typeWarning).toBeDefined()
    })

    it('should accept valid field types', async () => {
      const templateWithValidTypes = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: [
              { name: 'customerId', type: 'string', required: true },
              { name: 'count', type: 'number', required: true },
              { name: 'isActive', type: 'boolean', required: true },
              { name: 'wallet', type: 'address', required: true },
              { name: 'email', type: 'email', required: true },
              { name: 'amount', type: 'currency', required: true }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithValidTypes))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(true)
    })

    it('should require enumValues for enum type fields', async () => {
      const templateWithEnum = {
        ...validTemplate,
        entities: [
          {
            name: 'customer',
            idField: 'customerId',
            fields: [
              {
                name: 'customerId',
                type: 'string',
                required: true
              },
              {
                name: 'status',
                type: 'enum',
                required: true
              }
            ]
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithEnum))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const enumError = result.errors.find(e => e.includes('requires enumValues'))
      expect(enumError).toBeDefined()
    })
  })

  describe('Contract validation', () => {
    it('should warn if no contracts defined', async () => {
      const templateWithoutContracts = { ...validTemplate, contracts: [] }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutContracts))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const contractWarning = result.warnings.find(w => w.includes('No contracts defined'))
      expect(contractWarning).toBeDefined()
    })

    it('should require contract name', async () => {
      const templateWithInvalidContract = {
        ...validTemplate,
        contracts: [
          {
            abi: './abis/Contract.json',
            addresses: {}
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithInvalidContract))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      const nameError = result.errors.find(e => e.includes('Missing name'))
      expect(nameError).toBeDefined()
    })

    it('should warn if ABI is missing', async () => {
      const templateWithoutABI = {
        ...validTemplate,
        contracts: [
          {
            name: 'CustomerRegistry',
            addresses: {}
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutABI))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const abiWarning = result.warnings.find(w => w.includes('Missing ABI path'))
      expect(abiWarning).toBeDefined()
    })

    it('should warn for missing network addresses', async () => {
      const templateWithMissingAddresses = {
        ...validTemplate,
        contracts: [
          {
            name: 'CustomerRegistry',
            abi: './abis/CustomerRegistry.json',
            addresses: {
              'arbitrum-sepolia': '0x...'
            }
          }
        ]
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithMissingAddresses))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const addressWarnings = result.warnings.filter(w => w.includes('Missing address for network'))
      expect(addressWarnings.length).toBeGreaterThan(0)
    })
  })

  describe('Storage validation', () => {
    it('should validate storage configuration exists', async () => {
      const templateWithoutStorage = { ...validTemplate }
      delete (templateWithoutStorage as any).storage

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutStorage))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const storageWarning = result.warnings.find(w => w.includes('Missing storage'))
      expect(storageWarning).toBeDefined()
    })

    it('should warn for missing namespace patterns', async () => {
      const templateWithIncompleteStorage = {
        ...validTemplate,
        storage: {
          varityNamespace: 'varity-internal-test'
        }
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithIncompleteStorage))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const industryWarning = result.warnings.find(w => w.includes('industryNamespace'))
      const customerWarning = result.warnings.find(w => w.includes('customerNamespacePattern'))

      expect(industryWarning).toBeDefined()
      expect(customerWarning).toBeDefined()
    })

    it('should warn if namespace pattern lacks placeholders', async () => {
      const templateWithBadPattern = {
        ...validTemplate,
        storage: {
          ...validTemplate.storage,
          customerNamespacePattern: 'customer-static-name'
        }
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithBadPattern))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const patternWarning = result.warnings.find(w => w.includes('should include placeholders'))
      expect(patternWarning).toBeDefined()
    })
  })

  describe('API validation', () => {
    it('should warn if API configuration is missing', async () => {
      const templateWithoutAPI = { ...validTemplate }
      delete (templateWithoutAPI as any).api

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutAPI))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const apiWarning = result.warnings.find(w => w.includes('Missing API'))
      expect(apiWarning).toBeDefined()
    })

    it('should warn if basePath is missing', async () => {
      const templateWithInvalidAPI = {
        ...validTemplate,
        api: {}
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithInvalidAPI))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const basePathWarning = result.warnings.find(w => w.includes('Missing API basePath'))
      expect(basePathWarning).toBeDefined()
    })

    it('should warn if basePath does not start with /api/', async () => {
      const templateWithBadPath = {
        ...validTemplate,
        api: {
          basePath: '/v1/test'
        }
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithBadPath))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const pathWarning = result.warnings.find(w => w.includes('should start with /api/'))
      expect(pathWarning).toBeDefined()
    })
  })

  describe('Features validation', () => {
    it('should warn for missing recommended features', async () => {
      const templateWithoutFeatures = {
        ...validTemplate,
        features: {}
      }

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutFeatures))

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      const featureWarnings = result.warnings.filter(w => w.includes('Missing recommended feature'))
      expect(featureWarnings.length).toBeGreaterThan(0)
    })

    it('should validate all recommended features', async () => {
      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      // Should have no warnings about missing features
      const featureWarnings = result.warnings.filter(w => w.includes('Missing recommended feature'))
      expect(featureWarnings).toHaveLength(0)
    })
  })

  describe('Strict mode', () => {
    it('should be more strict when strict flag is enabled', async () => {
      const templateWithoutDesc = { ...validTemplate }
      delete (templateWithoutDesc as any).description

      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(templateWithoutDesc))

      const strictResult = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: true
      })

      const normalResult = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(strictResult.valid).toBe(false)
      // Normal mode might still be valid with warnings
    })
  })

  describe('Error handling', () => {
    it('should handle file system errors', async () => {
      mockFs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = await validateTemplate({
        templatePath: './templates/test.template.json',
        strict: false
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
