/**
 * Config Tests
 *
 * Comprehensive test suite for SDK configuration
 * Target: 90%+ code coverage
 */

import {
  NETWORK_CONFIGS,
  DEFAULT_CONFIG,
  API_ENDPOINTS,
  STORAGE_CONFIG,
  getNetworkConfig,
  validateContractAddresses
} from '../config'
import type { Network } from '../types'

describe('Config', () => {
  beforeEach(() => {
    // Clean up environment variables
    delete process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA
    delete process.env.TRANSACTION_VAULT_ARBITRUM_SEPOLIA
  })

  // ============================================================================
  // Network Configurations Tests
  // ============================================================================

  describe('NETWORK_CONFIGS', () => {
    it('should have arbitrum-sepolia configuration', () => {
      expect(NETWORK_CONFIGS['arbitrum-sepolia']).toBeDefined()
      expect(NETWORK_CONFIGS['arbitrum-sepolia'].chainId).toBe(421614)
      expect(NETWORK_CONFIGS['arbitrum-sepolia'].rpcUrl).toContain('arbitrum')
    })

    it('should have arbitrum-l3-testnet configuration', () => {
      expect(NETWORK_CONFIGS['arbitrum-l3-testnet']).toBeDefined()
      expect(NETWORK_CONFIGS['arbitrum-l3-testnet'].chainId).toBe(999999)
    })

    it('should have arbitrum-l3-mainnet configuration', () => {
      expect(NETWORK_CONFIGS['arbitrum-l3-mainnet']).toBeDefined()
      expect(NETWORK_CONFIGS['arbitrum-l3-mainnet'].chainId).toBe(1000000)
    })

    it('should have explorer URLs for all networks', () => {
      Object.values(NETWORK_CONFIGS).forEach(config => {
        expect(config.explorerUrl).toBeDefined()
        expect(config.explorerUrl).toContain('http')
      })
    })

    it('should have contract configurations for all networks', () => {
      Object.values(NETWORK_CONFIGS).forEach(config => {
        expect(config.contracts).toBeDefined()
        expect(config.contracts.MerchantRegistry).toBeDefined()
        expect(config.contracts.TransactionVault).toBeDefined()
        expect(config.contracts.RepPerformance).toBeDefined()
        expect(config.contracts.ResidualCalculator).toBeDefined()
        expect(config.contracts.AccessControlRegistry).toBeDefined()
        expect(config.contracts.DataProofRegistry).toBeDefined()
        expect(config.contracts.VarityWalletFactory).toBeDefined()
      })
    })
  })

  // ============================================================================
  // Default Configuration Tests
  // ============================================================================

  describe('DEFAULT_CONFIG', () => {
    it('should have default network', () => {
      expect(DEFAULT_CONFIG.network).toBe('arbitrum-sepolia')
    })

    it('should have default API endpoint', () => {
      expect(DEFAULT_CONFIG.apiEndpoint).toBeDefined()
      expect(DEFAULT_CONFIG.apiEndpoint).toContain('http')
    })

    it('should have default timeout', () => {
      expect(DEFAULT_CONFIG.timeout).toBe(30000)
    })
  })

  // ============================================================================
  // API Endpoints Tests
  // ============================================================================

  describe('API_ENDPOINTS', () => {
    it('should have storage endpoints', () => {
      expect(API_ENDPOINTS.storage).toBeDefined()
      expect(API_ENDPOINTS.storage.pin).toBe('/api/v1/storage/pin')
      expect(API_ENDPOINTS.storage.retrieve).toBe('/api/v1/storage/retrieve')
      expect(API_ENDPOINTS.storage.unpin).toBe('/api/v1/storage/unpin')
    })

    it('should have celestia endpoints', () => {
      expect(API_ENDPOINTS.celestia).toBeDefined()
      expect(API_ENDPOINTS.celestia.submit).toBe('/api/v1/celestia/submit')
      expect(API_ENDPOINTS.celestia.retrieve).toBe('/api/v1/celestia/retrieve')
      expect(API_ENDPOINTS.celestia.submitBatch).toBe('/api/v1/celestia/submit-batch')
    })

    it('should have LLM endpoints', () => {
      expect(API_ENDPOINTS.llm).toBeDefined()
      expect(API_ENDPOINTS.llm.query).toBe('/api/v1/llm/query')
      expect(API_ENDPOINTS.llm.queryWithRAG).toBe('/api/v1/llm/query-rag')
    })

    it('should have config endpoints', () => {
      expect(API_ENDPOINTS.config).toBeDefined()
      expect(API_ENDPOINTS.config.contracts).toBe('/api/v1/config/contracts')
      expect(API_ENDPOINTS.config.networks).toBe('/api/v1/config/networks')
    })
  })

  // ============================================================================
  // Storage Configuration Tests
  // ============================================================================

  describe('STORAGE_CONFIG', () => {
    it('should have default backend', () => {
      expect(STORAGE_CONFIG.defaultBackend).toBe('filecoin-ipfs')
    })

    it('should have Pinata configuration', () => {
      expect(STORAGE_CONFIG.pinata).toBeDefined()
      expect(STORAGE_CONFIG.pinata.gateway).toContain('pinata')
      expect(STORAGE_CONFIG.pinata.api).toContain('pinata')
    })

    it('should have Celestia configuration', () => {
      expect(STORAGE_CONFIG.celestia).toBeDefined()
      expect(STORAGE_CONFIG.celestia.namespacePrefix).toBe('varity-')
      expect(STORAGE_CONFIG.celestia.testnetRPC).toBeDefined()
    })

    it('should have encryption settings', () => {
      expect(STORAGE_CONFIG.encryption).toBeDefined()
      expect(STORAGE_CONFIG.encryption.algorithm).toBe('aes-256-gcm')
      expect(STORAGE_CONFIG.encryption.keyDerivation).toBe('pbkdf2')
      expect(STORAGE_CONFIG.encryption.iterations).toBe(100000)
    })

    it('should have multi-tier configuration', () => {
      expect(STORAGE_CONFIG.multiTier).toBeDefined()
      expect(STORAGE_CONFIG.multiTier.hotTier).toBeDefined()
      expect(STORAGE_CONFIG.multiTier.coldTier).toBeDefined()
      expect(STORAGE_CONFIG.multiTier.autoTiering).toBeDefined()
    })

    it('should have hot tier settings', () => {
      const hotTier = STORAGE_CONFIG.multiTier.hotTier
      expect(hotTier.backend).toBe('filecoin-ipfs')
      expect(hotTier.replication).toBe(3)
      expect(hotTier.costPerGB).toBe(0.001)
      expect(hotTier.accessLatency).toBe(50)
    })

    it('should have cold tier settings', () => {
      const coldTier = STORAGE_CONFIG.multiTier.coldTier
      expect(coldTier.backend).toBe('filecoin-ipfs')
      expect(coldTier.replication).toBe(2)
      expect(coldTier.costPerGB).toBe(0.0005)
      expect(coldTier.accessLatency).toBe(200)
    })

    it('should have auto-tiering enabled by default', () => {
      expect(STORAGE_CONFIG.multiTier.autoTiering.enabled).toBe(true)
      expect(STORAGE_CONFIG.multiTier.autoTiering.policy).toBe('access-based')
      expect(STORAGE_CONFIG.multiTier.autoTiering.checkInterval).toBe(24)
    })

    it('should have auto-tiering rules', () => {
      const rules = STORAGE_CONFIG.multiTier.autoTiering.rules
      expect(rules).toHaveLength(2)

      // Rule 1: Demote to cold after 30 days
      expect(rules[0].name).toContain('cold after 30 days')
      expect(rules[0].condition.type).toBe('last_accessed')
      expect(rules[0].condition.value).toBe(30)
      expect(rules[0].action.moveTo).toBe('cold')

      // Rule 2: Promote frequently accessed
      expect(rules[1].name).toContain('frequently accessed')
      expect(rules[1].condition.type).toBe('access_count')
      expect(rules[1].condition.value).toBe(5)
      expect(rules[1].action.moveTo).toBe('hot')
    })
  })

  // ============================================================================
  // getNetworkConfig Tests
  // ============================================================================

  describe('getNetworkConfig', () => {
    it('should return config for arbitrum-sepolia', () => {
      const config = getNetworkConfig('arbitrum-sepolia')

      expect(config).toBeDefined()
      expect(config.chainId).toBe(421614)
    })

    it('should return config for arbitrum-l3-testnet', () => {
      const config = getNetworkConfig('arbitrum-l3-testnet')

      expect(config).toBeDefined()
      expect(config.chainId).toBe(999999)
    })

    it('should return config for arbitrum-l3-mainnet', () => {
      const config = getNetworkConfig('arbitrum-l3-mainnet')

      expect(config).toBeDefined()
      expect(config.chainId).toBe(1000000)
    })

    it('should throw error for unsupported network', () => {
      expect(() => {
        getNetworkConfig('invalid-network' as Network)
      }).toThrow('Unsupported network: invalid-network')
    })
  })

  // ============================================================================
  // validateContractAddresses Tests
  // ============================================================================

  describe('validateContractAddresses', () => {
    it('should throw error when contracts are not configured', () => {
      expect(() => {
        validateContractAddresses('arbitrum-sepolia')
      }).toThrow('Missing contract addresses')
    })

    it('should list all missing contracts', () => {
      try {
        validateContractAddresses('arbitrum-sepolia')
      } catch (error) {
        const message = (error as Error).message
        expect(message).toContain('MerchantRegistry')
        expect(message).toContain('TransactionVault')
        expect(message).toContain('RepPerformance')
        expect(message).toContain('ResidualCalculator')
        expect(message).toContain('AccessControlRegistry')
        expect(message).toContain('DataProofRegistry')
        expect(message).toContain('VarityWalletFactory')
      }
    })

    it('should pass when all contracts are configured', () => {
      // Need to reload module to pick up env vars
      jest.resetModules()

      // Set all required environment variables
      process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA = '0x123'
      process.env.TRANSACTION_VAULT_ARBITRUM_SEPOLIA = '0x456'
      process.env.REP_PERFORMANCE_ARBITRUM_SEPOLIA = '0x789'
      process.env.RESIDUAL_CALCULATOR_ARBITRUM_SEPOLIA = '0xabc'
      process.env.ACCESS_CONTROL_ARBITRUM_SEPOLIA = '0xdef'
      process.env.DATA_PROOF_REGISTRY_ARBITRUM_SEPOLIA = '0x111'
      process.env.WALLET_FACTORY_ARBITRUM_SEPOLIA = '0x222'

      const { validateContractAddresses: validateFn } = require('../config')

      expect(() => {
        validateFn('arbitrum-sepolia')
      }).not.toThrow()

      // Clean up
      delete process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA
      delete process.env.TRANSACTION_VAULT_ARBITRUM_SEPOLIA
      delete process.env.REP_PERFORMANCE_ARBITRUM_SEPOLIA
      delete process.env.RESIDUAL_CALCULATOR_ARBITRUM_SEPOLIA
      delete process.env.ACCESS_CONTROL_ARBITRUM_SEPOLIA
      delete process.env.DATA_PROOF_REGISTRY_ARBITRUM_SEPOLIA
      delete process.env.WALLET_FACTORY_ARBITRUM_SEPOLIA

      // Re-import original
      jest.resetModules()
    })

    it('should identify partially configured contracts', () => {
      // Need to reload module to pick up env vars
      jest.resetModules()

      // Set only some contracts
      process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA = '0x123'
      process.env.TRANSACTION_VAULT_ARBITRUM_SEPOLIA = '0x456'

      const { validateContractAddresses: validateFn } = require('../config')

      try {
        validateFn('arbitrum-sepolia')
        fail('Should have thrown an error')
      } catch (error) {
        const message = (error as Error).message
        expect(message).not.toContain('MerchantRegistry')
        expect(message).not.toContain('TransactionVault')
        expect(message).toContain('RepPerformance')
        expect(message).toContain('ResidualCalculator')
      }

      // Clean up
      delete process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA
      delete process.env.TRANSACTION_VAULT_ARBITRUM_SEPOLIA

      // Re-import original
      jest.resetModules()
    })
  })

  // ============================================================================
  // Environment Variables Tests
  // ============================================================================

  describe('Environment Variables', () => {
    it('should use environment variable for RPC URL', () => {
      const originalRpc = process.env.ARBITRUM_SEPOLIA_RPC
      process.env.ARBITRUM_SEPOLIA_RPC = 'https://custom-rpc.example.com'

      // Re-import to get updated config
      jest.resetModules()
      const { getNetworkConfig: getConfig } = require('../config')

      const config = getConfig('arbitrum-sepolia')
      expect(config.rpcUrl).toBe('https://custom-rpc.example.com')

      // Restore
      if (originalRpc) {
        process.env.ARBITRUM_SEPOLIA_RPC = originalRpc
      } else {
        delete process.env.ARBITRUM_SEPOLIA_RPC
      }
    })

    it('should use environment variable for API endpoint', () => {
      const originalEndpoint = process.env.VARITY_API_ENDPOINT
      process.env.VARITY_API_ENDPOINT = 'https://custom-api.example.com'

      // Re-import to get updated config
      jest.resetModules()
      const { DEFAULT_CONFIG: defaultConfig } = require('../config')

      expect(defaultConfig.apiEndpoint).toBe('https://custom-api.example.com')

      // Restore
      if (originalEndpoint) {
        process.env.VARITY_API_ENDPOINT = originalEndpoint
      } else {
        delete process.env.VARITY_API_ENDPOINT
      }
    })
  })
})
