/**
 * Template System Tests
 *
 * Comprehensive test suite for template configuration system
 * Target: 90%+ code coverage
 */

import {
  TemplateRegistry,
  templateRegistry,
  validateTemplate,
  getContractABI,
  getContractAddress,
  getEntity,
  getMetric,
  getEvent,
  mergeTemplateConfig
} from '../template'
import type { TemplateConfig, TemplateContract } from '../template'

// Mock fetch for loadFromURL
global.fetch = jest.fn()

describe('Template System', () => {
  let registry: TemplateRegistry

  beforeEach(() => {
    registry = new TemplateRegistry()
    jest.clearAllMocks()
  })

  // ============================================================================
  // Template Registry Tests
  // ============================================================================

  describe('TemplateRegistry', () => {
    const mockTemplate: TemplateConfig = {
      type: 'iso',
      name: 'ISO Dashboard',
      version: '1.0.0',
      description: 'ISO merchant processing dashboard',
      contracts: [
        {
          name: 'MerchantRegistry',
          abi: [],
          addresses: {
            'arbitrum-sepolia': '0x123'
          }
        }
      ],
      entities: [
        {
          name: 'Merchant',
          displayName: 'Merchant',
          idField: 'merchantId',
          displayField: 'businessName',
          fields: [
            {
              name: 'businessName',
              label: 'Business Name',
              type: 'string',
              required: true
            }
          ]
        }
      ],
      events: [],
      metrics: [],
      storage: {
        customerNamespacePattern: 'customer-{company-id}',
        encryptionEnabled: true,
        litProtocolEnabled: true,
        celestiaDAEnabled: true,
        zkProofsEnabled: true
      }
    }

    it('should register a template', () => {
      registry.register(mockTemplate)

      expect(registry.has('iso')).toBe(true)
    })

    it('should get registered template', () => {
      registry.register(mockTemplate)

      const template = registry.get('iso')

      expect(template).toEqual(mockTemplate)
    })

    it('should return undefined for unregistered template', () => {
      const template = registry.get('healthcare')

      expect(template).toBeUndefined()
    })

    it('should check if template exists', () => {
      registry.register(mockTemplate)

      expect(registry.has('iso')).toBe(true)
      expect(registry.has('healthcare')).toBe(false)
    })

    it('should list all registered templates', () => {
      registry.register(mockTemplate)

      const healthcareTemplate = { ...mockTemplate, type: 'healthcare' as const, name: 'Healthcare' }
      registry.register(healthcareTemplate)

      const list = registry.list()

      expect(list).toHaveLength(2)
      expect(list).toContainEqual(mockTemplate)
      expect(list).toContainEqual(healthcareTemplate)
    })

    it('should load template from JSON', () => {
      const json = JSON.stringify(mockTemplate)

      const loaded = registry.loadFromJSON(json)

      expect(loaded).toEqual(mockTemplate)
      expect(registry.has('iso')).toBe(true)
    })

    it('should throw error for invalid JSON', () => {
      expect(() => {
        registry.loadFromJSON('invalid json')
      }).toThrow()
    })

    it('should load template from URL', async () => {
      const mockResponse = {
        ok: true,
        text: async () => JSON.stringify(mockTemplate)
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const loaded = await registry.loadFromURL('https://example.com/template.json')

      expect(loaded).toEqual(mockTemplate)
      expect(registry.has('iso')).toBe(true)
    })

    it('should throw error when loading from failed URL', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      })

      await expect(
        registry.loadFromURL('https://example.com/missing.json')
      ).rejects.toThrow('Failed to load template')
    })
  })

  // ============================================================================
  // Global Registry Tests
  // ============================================================================

  describe('Global Template Registry', () => {
    it('should have global registry instance', () => {
      expect(templateRegistry).toBeInstanceOf(TemplateRegistry)
    })

    it('should be shared across imports', () => {
      const template: TemplateConfig = {
        type: 'finance',
        name: 'Finance',
        version: '1.0.0',
        contracts: [{ name: 'Test', abi: [], addresses: {} }],
        entities: [{
          name: 'Account',
          displayName: 'Account',
          idField: 'id',
          displayField: 'name',
          fields: []
        }],
        events: [],
        metrics: [],
        storage: {
          customerNamespacePattern: 'customer-{id}',
          encryptionEnabled: true,
          litProtocolEnabled: true,
          celestiaDAEnabled: false,
          zkProofsEnabled: false
        }
      }

      templateRegistry.register(template)

      expect(templateRegistry.has('finance')).toBe(true)
    })
  })

  // ============================================================================
  // Template Validation Tests
  // ============================================================================

  describe('validateTemplate', () => {
    const validTemplate: TemplateConfig = {
      type: 'iso',
      name: 'ISO Dashboard',
      version: '1.0.0',
      contracts: [
        {
          name: 'MerchantRegistry',
          abi: [],
          addresses: { 'arbitrum-sepolia': '0x123' }
        }
      ],
      entities: [
        {
          name: 'Merchant',
          displayName: 'Merchant',
          idField: 'merchantId',
          displayField: 'businessName',
          fields: [
            { name: 'businessName', label: 'Business Name', type: 'string' }
          ]
        }
      ],
      events: [],
      metrics: [],
      storage: {
        customerNamespacePattern: 'customer-{id}',
        encryptionEnabled: true,
        litProtocolEnabled: true,
        celestiaDAEnabled: true,
        zkProofsEnabled: false
      }
    }

    it('should validate correct template', () => {
      const result = validateTemplate(validTemplate)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when type is missing', () => {
      const invalid = { ...validTemplate, type: undefined as any }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template type is required')
    })

    it('should fail when name is missing', () => {
      const invalid = { ...validTemplate, name: undefined as any }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template name is required')
    })

    it('should fail when version is missing', () => {
      const invalid = { ...validTemplate, version: undefined as any }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template version is required')
    })

    it('should fail when contracts are missing', () => {
      const invalid = { ...validTemplate, contracts: [] }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must have at least one contract')
    })

    it('should fail when entities are missing', () => {
      const invalid = { ...validTemplate, entities: [] }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must have at least one entity')
    })

    it('should fail when storage config is missing', () => {
      const invalid = { ...validTemplate, storage: undefined as any }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Storage configuration is required')
    })

    it('should validate contract fields', () => {
      const invalid = {
        ...validTemplate,
        contracts: [
          { abi: [], addresses: {} } as any
        ]
      }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('name is required'))).toBe(true)
    })

    it('should validate entity fields', () => {
      const invalid = {
        ...validTemplate,
        entities: [
          { name: 'Test', fields: [] } as any
        ]
      }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('idField is required'))).toBe(true)
    })

    it('should accumulate multiple errors', () => {
      const invalid: any = {
        type: undefined,
        name: undefined,
        version: undefined
      }
      const result = validateTemplate(invalid)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(3)
    })
  })

  // ============================================================================
  // Template Utility Tests
  // ============================================================================

  describe('Template Utilities', () => {
    const template: TemplateConfig = {
      type: 'iso',
      name: 'ISO Dashboard',
      version: '1.0.0',
      contracts: [
        {
          name: 'MerchantRegistry',
          abi: [{ name: 'register', type: 'function' }],
          addresses: {
            'arbitrum-sepolia': '0x123',
            'arbitrum-l3-testnet': '0x456'
          }
        },
        {
          name: 'TransactionVault',
          abi: '/path/to/abi.json',
          addresses: {
            'arbitrum-sepolia': '0x789'
          }
        }
      ],
      entities: [
        {
          name: 'Merchant',
          displayName: 'Merchant',
          idField: 'merchantId',
          displayField: 'businessName',
          fields: []
        },
        {
          name: 'Transaction',
          displayName: 'Transaction',
          idField: 'transactionId',
          displayField: 'transactionAmount',
          fields: []
        }
      ],
      events: [
        {
          name: 'merchant.registered',
          displayName: 'Merchant Registered',
          category: 'merchant'
        }
      ],
      metrics: [
        {
          name: 'total_volume',
          displayName: 'Total Volume',
          type: 'sum',
          source: '/api/metrics/volume'
        }
      ],
      storage: {
        customerNamespacePattern: 'customer-{id}',
        encryptionEnabled: true,
        litProtocolEnabled: true,
        celestiaDAEnabled: true,
        zkProofsEnabled: true
      }
    }

    describe('getContractABI', () => {
      it('should get inline ABI', () => {
        const abi = getContractABI(template, 'MerchantRegistry')

        expect(abi).toEqual([{ name: 'register', type: 'function' }])
      })

      it('should return null for path-based ABI', () => {
        const abi = getContractABI(template, 'TransactionVault')

        expect(abi).toBeNull()
      })

      it('should return null for non-existent contract', () => {
        const abi = getContractABI(template, 'NonExistent')

        expect(abi).toBeNull()
      })
    })

    describe('getContractAddress', () => {
      it('should get contract address for network', () => {
        const address = getContractAddress(template, 'MerchantRegistry', 'arbitrum-sepolia')

        expect(address).toBe('0x123')
      })

      it('should get contract address for different network', () => {
        const address = getContractAddress(template, 'MerchantRegistry', 'arbitrum-l3-testnet')

        expect(address).toBe('0x456')
      })

      it('should return null for undeployed network', () => {
        const address = getContractAddress(template, 'TransactionVault', 'arbitrum-l3-mainnet')

        expect(address).toBeNull()
      })

      it('should return null for non-existent contract', () => {
        const address = getContractAddress(template, 'NonExistent', 'arbitrum-sepolia')

        expect(address).toBeNull()
      })
    })

    describe('getEntity', () => {
      it('should get entity by name', () => {
        const entity = getEntity(template, 'Merchant')

        expect(entity).toBeDefined()
        expect(entity?.name).toBe('Merchant')
      })

      it('should return null for non-existent entity', () => {
        const entity = getEntity(template, 'NonExistent')

        expect(entity).toBeNull()
      })
    })

    describe('getMetric', () => {
      it('should get metric by name', () => {
        const metric = getMetric(template, 'total_volume')

        expect(metric).toBeDefined()
        expect(metric?.name).toBe('total_volume')
      })

      it('should return null for non-existent metric', () => {
        const metric = getMetric(template, 'nonexistent')

        expect(metric).toBeNull()
      })
    })

    describe('getEvent', () => {
      it('should get event by name', () => {
        const event = getEvent(template, 'merchant.registered')

        expect(event).toBeDefined()
        expect(event?.name).toBe('merchant.registered')
      })

      it('should return null for non-existent event', () => {
        const event = getEvent(template, 'nonexistent')

        expect(event).toBeNull()
      })
    })

    describe('mergeTemplateConfig', () => {
      it('should merge template configurations', () => {
        const base = template
        const overrides = {
          version: '2.0.0',
          description: 'Updated description'
        }

        const merged = mergeTemplateConfig(base, overrides)

        expect(merged.version).toBe('2.0.0')
        expect(merged.description).toBe('Updated description')
        expect(merged.name).toBe('ISO Dashboard') // Preserved from base
      })

      it('should override contracts', () => {
        const overrides = {
          contracts: [
            {
              name: 'NewContract',
              abi: [],
              addresses: { 'arbitrum-sepolia': '0xnew' }
            }
          ]
        }

        const merged = mergeTemplateConfig(template, overrides)

        expect(merged.contracts).toEqual(overrides.contracts)
      })

      it('should merge storage config', () => {
        const overrides = {
          storage: {
            zkProofsEnabled: false
          }
        }

        const merged = mergeTemplateConfig(template, overrides as any)

        expect(merged.storage.zkProofsEnabled).toBe(false)
        expect(merged.storage.encryptionEnabled).toBe(true) // Preserved
      })

      it('should merge API config', () => {
        const baseWithApi = {
          ...template,
          api: {
            basePath: '/api/v1',
            customEndpoints: { test: '/test' }
          }
        }
        const overrides = {
          api: {
            basePath: '/api/v2'
          }
        }

        const merged = mergeTemplateConfig(baseWithApi, overrides as any)

        expect(merged.api?.basePath).toBe('/api/v2')
        expect(merged.api?.customEndpoints).toEqual({ test: '/test' })
      })

      it('should merge features', () => {
        const baseWithFeatures = {
          ...template,
          features: {
            analytics: true,
            forecasting: false
          }
        }
        const overrides = {
          features: {
            forecasting: true
          }
        }

        const merged = mergeTemplateConfig(baseWithFeatures, overrides as any)

        expect(merged.features?.analytics).toBe(true)
        expect(merged.features?.forecasting).toBe(true)
      })

      it('should merge custom fields', () => {
        const baseWithCustom = {
          ...template,
          custom: {
            field1: 'value1',
            field2: 'value2'
          }
        }
        const overrides = {
          custom: {
            field2: 'updated',
            field3: 'new'
          }
        }

        const merged = mergeTemplateConfig(baseWithCustom, overrides as any)

        expect(merged.custom?.field1).toBe('value1')
        expect(merged.custom?.field2).toBe('updated')
        expect(merged.custom?.field3).toBe('new')
      })
    })
  })
})
