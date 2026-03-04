/**
 * AccessKeyModule Tests
 *
 * Comprehensive tests for API access key management
 */

import { AccessKeyModule, type CreateAccessKeyOptions, type UpdateAccessKeyOptions } from '../AccessKeyModule'
import type { AccessKeyStatus, Permission, Action, PermissionEffect } from '@varity-labs/types'

// Mock fetch globally
global.fetch = jest.fn()

describe('AccessKeyModule', () => {
  let accessKeyModule: AccessKeyModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key',
    getNetwork: () => 'arbitrum-sepolia'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    accessKeyModule = new AccessKeyModule(mockSDK as any)
  })

  describe('createAccessKey', () => {
    it('should create access key successfully', async () => {
      const mockAccessKey = {
        accessKeyId: 'VARIETYABC123DEF456',
        secretAccessKey: 'secret123',
        customerId: 'customer-123',
        name: 'Test Key',
        description: 'Test Description',
        permissions: [],
        status: 'active' as AccessKeyStatus,
        createdAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccessKey
      })

      const options: CreateAccessKeyOptions = {
        name: 'Test Key',
        description: 'Test Description',
        expiresInDays: 90
      }

      const result = await accessKeyModule.createAccessKey(options)

      expect(result).toHaveProperty('accessKeyId')
      expect(result).toHaveProperty('secretAccessKey')
      expect(result.name).toBe('Test Key')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.varity.test/api/v1/auth/access-keys',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
    })

    it('should create access key with custom permissions', async () => {
      const mockAccessKey = {
        accessKeyId: 'VARIETYABC123DEF456',
        secretAccessKey: 'secret123',
        customerId: 'customer-123',
        name: 'Custom Permissions Key',
        description: '',
        permissions: [{
          resource: 'bucket:specific/*',
          actions: ['storage:GetObject' as Action],
          effect: 'allow' as PermissionEffect
        }],
        status: 'active' as AccessKeyStatus,
        createdAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccessKey
      })

      const options: CreateAccessKeyOptions = {
        name: 'Custom Permissions Key',
        permissions: [{
          resource: 'bucket:specific/*',
          actions: ['storage:GetObject' as Action],
          effect: 'allow' as PermissionEffect
        }]
      }

      const result = await accessKeyModule.createAccessKey(options)

      expect(result.permissions).toHaveLength(1)
      expect(result.permissions[0].resource).toBe('bucket:specific/*')
    })

    it('should throw error when authentication is missing', async () => {
      const sdkWithoutAuth = {
        getAPIEndpoint: () => 'https://api.varity.test',
        getAPIKey: () => null,
        getNetwork: () => 'arbitrum-sepolia'
      }

      const module = new AccessKeyModule(sdkWithoutAuth as any)

      const options: CreateAccessKeyOptions = {
        name: 'Test Key'
      }

      await expect(module.createAccessKey(options)).rejects.toThrow(
        'Authentication required to create access keys'
      )
    })

    it('should throw error on API failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid input' })
      })

      const options: CreateAccessKeyOptions = {
        name: 'Test Key'
      }

      await expect(accessKeyModule.createAccessKey(options)).rejects.toThrow(
        'Failed to create access key'
      )
    })
  })

  describe('listAccessKeys', () => {
    it('should list access keys successfully', async () => {
      const mockKeys = {
        accessKeys: [
          {
            accessKeyId: 'VARIETY123',
            customerId: 'customer-123',
            name: 'Key 1',
            description: 'Description 1',
            permissions: [],
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            accessKeyId: 'VARIETY456',
            customerId: 'customer-123',
            name: 'Key 2',
            description: 'Description 2',
            permissions: [],
            status: 'inactive',
            createdAt: new Date().toISOString()
          }
        ]
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKeys
      })

      const result = await accessKeyModule.listAccessKeys()

      expect(result).toHaveLength(2)
      expect(result[0].secretAccessKey).toBe('***REDACTED***')
      expect(result[1].secretAccessKey).toBe('***REDACTED***')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.varity.test/api/v1/auth/access-keys',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
    })

    it('should throw error when authentication is missing', async () => {
      const sdkWithoutAuth = {
        getAPIEndpoint: () => 'https://api.varity.test',
        getAPIKey: () => null,
        getNetwork: () => 'arbitrum-sepolia'
      }

      const module = new AccessKeyModule(sdkWithoutAuth as any)

      await expect(module.listAccessKeys()).rejects.toThrow(
        'Authentication required to list access keys'
      )
    })
  })

  describe('getAccessKey', () => {
    it('should get access key by ID', async () => {
      const mockKey = {
        accessKeyId: 'VARIETY123',
        customerId: 'customer-123',
        name: 'Test Key',
        description: 'Test Description',
        permissions: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockKey
      })

      const result = await accessKeyModule.getAccessKey('VARIETY123')

      expect(result.accessKeyId).toBe('VARIETY123')
      expect(result.secretAccessKey).toBe('***REDACTED***')
      expect(result.lastUsedAt).toBeDefined()
    })
  })

  describe('revokeAccessKey', () => {
    it('should revoke access key successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await expect(accessKeyModule.revokeAccessKey('VARIETY123')).resolves.not.toThrow()

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.varity.test/api/v1/auth/access-keys/VARIETY123',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('should throw error on revoke failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ message: 'Key not found' })
      })

      await expect(accessKeyModule.revokeAccessKey('VARIETY123')).rejects.toThrow(
        'Failed to revoke access key'
      )
    })
  })

  describe('updateAccessKey', () => {
    it('should update access key successfully', async () => {
      const mockUpdatedKey = {
        accessKeyId: 'VARIETY123',
        customerId: 'customer-123',
        name: 'Updated Key Name',
        description: 'Updated Description',
        permissions: [],
        status: 'inactive',
        createdAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedKey
      })

      const updates: UpdateAccessKeyOptions = {
        name: 'Updated Key Name',
        description: 'Updated Description',
        status: 'inactive' as AccessKeyStatus
      }

      const result = await accessKeyModule.updateAccessKey('VARIETY123', updates)

      expect(result.name).toBe('Updated Key Name')
      expect(result.status).toBe('inactive')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.varity.test/api/v1/auth/access-keys/VARIETY123',
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })

    it('should update only specific fields', async () => {
      const mockUpdatedKey = {
        accessKeyId: 'VARIETY123',
        customerId: 'customer-123',
        name: 'Original Name',
        description: 'Updated Description',
        permissions: [],
        status: 'active',
        createdAt: new Date().toISOString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedKey
      })

      const updates: UpdateAccessKeyOptions = {
        description: 'Updated Description'
      }

      const result = await accessKeyModule.updateAccessKey('VARIETY123', updates)

      expect(result.description).toBe('Updated Description')
    })
  })

  describe('helper methods', () => {
    it('should generate valid access key ID', () => {
      // Access private method through any cast for testing
      const generateAccessKeyId = (accessKeyModule as any).generateAccessKeyId.bind(accessKeyModule)
      const keyId = generateAccessKeyId()

      expect(keyId).toMatch(/^VARITY[A-Z0-9]{16}$/)
      expect(keyId).toHaveLength(22)
    })

    it('should generate valid secret access key', () => {
      const generateSecretAccessKey = (accessKeyModule as any).generateSecretAccessKey.bind(accessKeyModule)
      const secret = generateSecretAccessKey()

      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(0)
    })

    it('should return default permissions', () => {
      const getDefaultPermissions = (accessKeyModule as any).getDefaultPermissions.bind(accessKeyModule)
      const permissions = getDefaultPermissions()

      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
      expect(permissions[0]).toHaveProperty('resource')
      expect(permissions[0]).toHaveProperty('actions')
      expect(permissions[0]).toHaveProperty('effect')
    })

    it('should return default rate limit', () => {
      const getDefaultRateLimit = (accessKeyModule as any).getDefaultRateLimit.bind(accessKeyModule)
      const rateLimit = getDefaultRateLimit()

      expect(rateLimit).toHaveProperty('requestsPerSecond')
      expect(rateLimit).toHaveProperty('requestsPerDay')
      expect(rateLimit).toHaveProperty('bandwidthPerDay')
      expect(rateLimit.requestsPerSecond).toBeGreaterThan(0)
    })
  })
})
