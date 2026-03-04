/**
 * AuthModule Tests
 *
 * Comprehensive tests for universal authentication and access control
 */

import { AuthModule, type LoginCredentials, type User } from '../AuthModule'
import { VaritySDK } from '../../../core/VaritySDK'
import { Role } from '../../../core/types'

// Mock fetch globally
global.fetch = jest.fn()

describe('AuthModule', () => {
  let sdk: VaritySDK
  let authModule: AuthModule
  const mockApiEndpoint = 'https://api.varity.test'
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    jest.clearAllMocks()
    sdk = {
      getAPIEndpoint: () => mockApiEndpoint,
      getAPIKey: () => mockApiKey,
      getSigner: () => ({
        getAddress: async () => '0x1234567890123456789012345678901234567890',
        signMessage: async (msg: string) => '0xmocksignature'
      }),
      getAddress: async () => '0x1234567890123456789012345678901234567890',
      getProvider: () => ({}),
      getContractAddress: (name: string) => '0xcontract1234567890123456789012345678901234'
    } as any
    authModule = new AuthModule(sdk)
  })

  describe('login', () => {
    it('should login with wallet signature successfully', async () => {
      const mockToken = {
        token: 'mock-jwt-token',
        expiresAt: Date.now() + 3600000,
        user: '0x1234567890123456789012345678901234567890'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken
      })

      const credentials: LoginCredentials = {
        address: '0x1234567890123456789012345678901234567890',
        signature: '0xmocksignature',
        message: 'Login to Varity'
      }

      const result = await authModule.login(credentials)

      expect(result).toEqual(mockToken)
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiEndpoint}/api/v1/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should generate signature if not provided', async () => {
      const mockToken = {
        token: 'mock-jwt-token',
        expiresAt: Date.now() + 3600000,
        user: '0x1234567890123456789012345678901234567890'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken
      })

      const credentials: LoginCredentials = {
        address: '0x1234567890123456789012345678901234567890'
      }

      const result = await authModule.login(credentials)

      expect(result).toEqual(mockToken)
    })

    it('should throw error on login failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      })

      const credentials: LoginCredentials = {
        address: '0x1234567890123456789012345678901234567890'
      }

      await expect(authModule.login(credentials)).rejects.toThrow('Login failed: Unauthorized')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await authModule.logout()

      expect(consoleSpy).toHaveBeenCalledWith('Logged out')
      consoleSpy.mockRestore()
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user with roles and profile', async () => {
      const mockProfile = {
        userAddress: '0x1234567890123456789012345678901234567890',
        primaryRole: Role.MANAGER,
        metadata: '',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        isActive: true
      }

      // Mock contract calls
      sdk.getProvider = () => ({
        call: async () => '0x' + '0'.repeat(64)
      }) as any

      const result = await authModule.getCurrentUser()

      expect(result).toHaveProperty('address')
      expect(result).toHaveProperty('roles')
      expect(result).toHaveProperty('profile')
    })
  })

  describe('checkPermission', () => {
    it('should return true for user with roles', async () => {
      // Mock getUserRoles to return a role
      jest.spyOn(authModule, 'getUserRoles').mockResolvedValueOnce([Role.MANAGER])

      const result = await authModule.checkPermission(
        '0x1234567890123456789012345678901234567890',
        'merchants'
      )

      expect(result).toBe(true)
    })

    it('should return false for user without roles', async () => {
      jest.spyOn(authModule, 'getUserRoles').mockResolvedValueOnce([])

      const result = await authModule.checkPermission(
        '0x1234567890123456789012345678901234567890',
        'merchants'
      )

      expect(result).toBe(false)
    })
  })

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockTx = {
        wait: jest.fn().mockResolvedValueOnce({})
      }

      sdk.getSigner = () => ({
        getAddress: async () => '0x1234567890123456789012345678901234567890'
      }) as any

      // Mock contract interaction
      const originalGetProvider = sdk.getProvider
      sdk.getProvider = () => ({
        call: async () => '0x',
        getSigner: () => ({})
      }) as any

      await authModule.assignRole(
        '0x1234567890123456789012345678901234567890',
        Role.MANAGER,
        'metadata'
      )

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
      sdk.getProvider = originalGetProvider
    })
  })

  describe('revokeRole', () => {
    it('should revoke role successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockTx = {
        wait: jest.fn().mockResolvedValueOnce({})
      }

      sdk.getSigner = () => ({
        getAddress: async () => '0x1234567890123456789012345678901234567890'
      }) as any

      await authModule.revokeRole(
        '0x1234567890123456789012345678901234567890',
        Role.MANAGER
      )

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      const mockProfile = {
        primaryRole: Role.MANAGER
      }

      sdk.getProvider = () => ({
        call: async () => '0x'
      }) as any

      const result = await authModule.getUserRoles('0x1234567890123456789012345678901234567890')

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        userAddress: '0x1234567890123456789012345678901234567890',
        primaryRole: Role.MANAGER,
        metadata: 'test',
        createdAt: 1234567890,
        lastUpdated: 1234567890,
        isActive: true
      }

      sdk.getProvider = () => ({
        call: async () => '0x'
      }) as any

      const result = await authModule.getUserProfile('0x1234567890123456789012345678901234567890')

      expect(result).toHaveProperty('userAddress')
      expect(result).toHaveProperty('primaryRole')
      expect(result).toHaveProperty('createdAt')
    })
  })

  describe('hasRole', () => {
    it('should return true if user has role', async () => {
      jest.spyOn(authModule, 'getUserRoles').mockResolvedValueOnce([Role.MANAGER, Role.REP])

      const result = await authModule.hasRole(
        '0x1234567890123456789012345678901234567890',
        Role.MANAGER
      )

      expect(result).toBe(true)
    })

    it('should return false if user does not have role', async () => {
      jest.spyOn(authModule, 'getUserRoles').mockResolvedValueOnce([Role.REP])

      const result = await authModule.hasRole(
        '0x1234567890123456789012345678901234567890',
        Role.MANAGER
      )

      expect(result).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', async () => {
      jest.spyOn(authModule, 'getUserRoles').mockResolvedValueOnce([Role.REP])

      const result = await authModule.hasAnyRole(
        '0x1234567890123456789012345678901234567890',
        [Role.MANAGER, Role.REP]
      )

      expect(result).toBe(true)
    })

    it('should return false if user has none of the roles', async () => {
      jest.spyOn(authModule, 'getUserRoles').mockResolvedValueOnce([Role.MERCHANT])

      const result = await authModule.hasAnyRole(
        '0x1234567890123456789012345678901234567890',
        [Role.MANAGER, Role.REP]
      )

      expect(result).toBe(false)
    })
  })

  describe('setAccessCondition', () => {
    it('should set Lit Protocol access condition', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      sdk.getSigner = () => ({
        getAddress: async () => '0x1234567890123456789012345678901234567890'
      }) as any

      await authModule.setAccessCondition(
        Role.MANAGER,
        '{"condition": "test"}',
        'encryptedKey123'
      )

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getAccessCondition', () => {
    it('should get Lit Protocol access condition', async () => {
      const mockCondition = {
        condition: '{"condition": "test"}',
        encryptedKey: new Uint8Array([101, 110, 99, 114, 121, 112, 116, 101, 100]),
        isActive: true,
        lastUpdated: 1234567890
      }

      sdk.getProvider = () => ({
        call: async () => '0x'
      }) as any

      const result = await authModule.getAccessCondition(Role.MANAGER)

      expect(result).toHaveProperty('condition')
      expect(result).toHaveProperty('encryptedKey')
      expect(result).toHaveProperty('isActive')
    })
  })
})
