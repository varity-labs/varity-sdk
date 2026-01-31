/**
 * VaritySDK Core Tests
 *
 * Comprehensive test suite for the main SDK class
 * Target: 90%+ code coverage
 */

import { VaritySDK, createVaritySDK } from '../VaritySDK'
import type { VaritySDKConfig } from '../types'

// Mock StorageBackend enum
enum StorageBackend {
  FILECOIN_IPFS = 'filecoin-ipfs',
  S3_COMPATIBLE = 's3-compatible',
  GCS_COMPATIBLE = 'gcs-compatible',
  MULTI_TIER = 'multi-tier'
}

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
      }),
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(421614) }),
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000'))
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(421614) }),
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000'))
    })),
    Wallet: jest.fn().mockImplementation((privateKey, provider) => ({
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      privateKey
    })),
    formatEther: jest.fn((value) => {
      return (Number(value) / 1e18).toString()
    }),
    parseEther: jest.fn((value) => {
      return BigInt(Math.floor(parseFloat(value) * 1e18))
    })
  }
}))

describe('VaritySDK', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.log/warn during tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(sdk).toBeDefined()
      expect(sdk).toBeInstanceOf(VaritySDK)
      expect(sdk.isConnected()).toBe(false)
    })

    it('should initialize with custom network', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-l3-testnet' })

      expect(sdk.getNetworkConfig().chainId).toBe(999999)
    })

    it('should initialize with custom API endpoint', () => {
      const customEndpoint = 'https://custom-api.example.com'
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        apiEndpoint: customEndpoint
      })

      expect(sdk.getAPIEndpoint()).toBe(customEndpoint)
    })

    it('should initialize with API key', () => {
      const apiKey = 'test-api-key-123'
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        apiKey
      })

      expect(sdk.getAPIKey()).toBe(apiKey)
    })

    it('should initialize S3 module when s3Config provided', () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        s3Config: {
          endpoint: 'http://localhost:3001',
          accessKeyId: 'test',
          secretAccessKey: 'test',
          bucket: 'test-bucket',
          region: 'us-east-1'
        }
      })

      expect(sdk.s3).toBeDefined()
    })

    it('should initialize without S3 module by default', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(sdk.s3).toBeUndefined()
    })

    it('should initialize with custom storage backend', () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        storageBackend: StorageBackend.MULTI_TIER
      })

      expect(sdk.storage).toBeDefined()
    })

    it('should handle invalid network gracefully', () => {
      expect(() => {
        new VaritySDK({ network: 'invalid-network' as any })
      }).toThrow('Unsupported network')
    })

    it('should warn when contract addresses are not configured', () => {
      const warnSpy = jest.spyOn(console, 'warn')

      new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(warnSpy).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Module Initialization Tests
  // ============================================================================

  describe('Module Initialization', () => {
    it('should initialize all 13 core modules', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(sdk.auth).toBeDefined()
      expect(sdk.storage).toBeDefined()
      expect(sdk.compute).toBeDefined()
      expect(sdk.zk).toBeDefined()
      expect(sdk.contracts).toBeDefined()
      expect(sdk.oracle).toBeDefined()
      expect(sdk.analytics).toBeDefined()
      expect(sdk.notifications).toBeDefined()
      expect(sdk.export).toBeDefined()
      expect(sdk.cache).toBeDefined()
      expect(sdk.monitoring).toBeDefined()
      expect(sdk.forecasting).toBeDefined()
      expect(sdk.webhooks).toBeDefined()
    })

    it('should initialize 14 modules when S3 config provided', () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        s3Config: {
          endpoint: 'http://localhost:3001',
          accessKeyId: 'test',
          secretAccessKey: 'test',
          bucket: 'test-bucket',
          region: 'us-east-1'
        }
      })

      expect(sdk.s3).toBeDefined()
    })
  })

  // ============================================================================
  // Connection Tests
  // ============================================================================

  describe('Connection', () => {
    it('should connect with wallet provider', async () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      const mockProvider = { request: jest.fn() }

      await sdk.connect(mockProvider as any)

      expect(sdk.isConnected()).toBe(true)
    })

    it('should connect with private key', async () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      })

      await sdk.connect()

      expect(sdk.isConnected()).toBe(true)
    })

    it('should connect in read-only mode when no provider or key', async () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      const warnSpy = jest.spyOn(console, 'warn')

      await sdk.connect()

      expect(sdk.isConnected()).toBe(true)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('read-only mode')
      )
    })

    it('should disconnect successfully', async () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      await sdk.connect()

      expect(sdk.isConnected()).toBe(true)

      await sdk.disconnect()

      expect(sdk.isConnected()).toBe(false)
    })

    it('should throw error on network mismatch', async () => {
      const { ethers } = require('ethers')
      ethers.JsonRpcProvider.mockImplementationOnce(() => ({
        getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(999) })
      }))

      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      await expect(sdk.connect()).rejects.toThrow('Network mismatch')
    })

    it('should handle connection errors', async () => {
      const { ethers } = require('ethers')
      ethers.JsonRpcProvider.mockImplementationOnce(() => {
        throw new Error('Connection failed')
      })

      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      await expect(sdk.connect()).rejects.toThrow('Failed to connect to network')
    })
  })

  // ============================================================================
  // Provider and Signer Tests
  // ============================================================================

  describe('Provider and Signer', () => {
    it('should get provider after connection', async () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      await sdk.connect()

      const provider = sdk.getProvider()

      expect(provider).toBeDefined()
    })

    it('should throw error when getting provider before connection', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(() => sdk.getProvider()).toThrow('SDK not connected')
    })

    it('should get signer when available', async () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      })
      await sdk.connect()

      const signer = sdk.getSigner()

      expect(signer).toBeDefined()
    })

    it('should throw error when getting signer in read-only mode', async () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      await sdk.connect()

      expect(() => sdk.getSigner()).toThrow('No signer available')
    })
  })

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration', () => {
    it('should return SDK configuration', () => {
      const config: Partial<VaritySDKConfig> = {
        network: 'arbitrum-sepolia',
        apiKey: 'test-key'
      }
      const sdk = new VaritySDK(config)

      const sdkConfig = sdk.getConfig()

      expect(sdkConfig.network).toBe('arbitrum-sepolia')
      expect(sdkConfig.apiKey).toBe('test-key')
    })

    it('should return network configuration', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      const networkConfig = sdk.getNetworkConfig()

      expect(networkConfig.chainId).toBe(421614)
      expect(networkConfig.rpcUrl).toBeDefined()
    })

    it('should get contract address by name', () => {
      // Set environment variable for testing
      process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA = '0xMerchantRegistry123'

      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      const address = sdk.getContractAddress('MerchantRegistry')

      expect(address).toBe('0xMerchantRegistry123')

      delete process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA
    })

    it('should throw error for undeployed contract', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(() => sdk.getContractAddress('MerchantRegistry')).toThrow(
        'Contract MerchantRegistry not deployed'
      )
    })
  })

  // ============================================================================
  // Blockchain Interaction Tests
  // ============================================================================

  describe('Blockchain Interactions', () => {
    it('should get block number', async () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      await sdk.connect()

      const blockNumber = await sdk.getBlockNumber()

      expect(blockNumber).toBe(12345)
    })

    it('should get wallet address', async () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      })
      await sdk.connect()

      const address = await sdk.getAddress()

      expect(address).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should get wallet balance', async () => {
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      })
      await sdk.connect()

      const balance = await sdk.getBalance()

      expect(balance).toBe(BigInt('1000000000000000000'))
    })

    it('should format balance to ETH', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })
      const balance = BigInt('1000000000000000000')

      const formatted = sdk.formatBalance(balance)

      expect(formatted).toBe('1')
    })

    it('should parse ETH to Wei', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      const wei = sdk.parseEther('1.5')

      expect(wei).toBe(BigInt('1500000000000000000'))
    })
  })

  // ============================================================================
  // Template Configuration Tests
  // ============================================================================

  describe('Template Configuration', () => {
    it('should initialize with built-in template', () => {
      // Note: This requires template-loader to have loaded templates
      const sdk = new VaritySDK({
        network: 'arbitrum-sepolia',
        template: 'iso'
      })

      // Should not throw, even if template is not found
      expect(sdk).toBeDefined()
    })

    it('should check if template is loaded', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      expect(sdk.hasTemplate()).toBe(false)
    })

    it('should get current template configuration', () => {
      const sdk = new VaritySDK({ network: 'arbitrum-sepolia' })

      const template = sdk.getTemplate()

      expect(template).toBeNull()
    })

    it('should warn when template not found in registry', () => {
      const warnSpy = jest.spyOn(console, 'warn')

      new VaritySDK({
        network: 'arbitrum-sepolia',
        template: 'nonexistent' as any
      })

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('not found in registry')
      )
    })
  })

  // ============================================================================
  // Convenience Function Tests
  // ============================================================================

  describe('Convenience Functions', () => {
    it('should create SDK using convenience function', () => {
      const sdk = createVaritySDK({ network: 'arbitrum-sepolia' })

      expect(sdk).toBeInstanceOf(VaritySDK)
    })

    it('should create SDK with default config', () => {
      const sdk = createVaritySDK()

      expect(sdk).toBeInstanceOf(VaritySDK)
      expect(sdk.getConfig().network).toBe('arbitrum-sepolia')
    })
  })
})
