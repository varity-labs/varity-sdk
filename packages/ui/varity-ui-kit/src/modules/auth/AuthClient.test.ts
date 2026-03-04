/**
 * Unit tests for AuthClient
 */

import { AuthClient, LoginResponse, UserProfile } from './AuthClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('AuthClient', () => {
  let mockHttp: MockHTTPClient
  let authClient: AuthClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    authClient = new AuthClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('login', () => {
    it('should login with SIWE credentials', async () => {
      const mockResponse: LoginResponse = {
        token: 'mock-jwt-token',
        address: '0x1234567890abcdef',
        expiresIn: 3600
      }

      mockHttp.mockPost('/auth/login', mockResponse)

      const result = await authClient.login('mock-message', 'mock-signature')

      expect(result).toEqual(mockResponse)
      expect(result.token).toBe('mock-jwt-token')
      expect(result.address).toBe('0x1234567890abcdef')
      expect(result.expiresIn).toBe(3600)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/auth/login',
        data: { message: 'mock-message', signature: 'mock-signature' }
      })
    })

    it('should handle login errors', async () => {
      await expect(authClient.login('invalid', 'invalid')).rejects.toThrow()
    })
  })

  describe('logout', () => {
    it('should logout current user', async () => {
      mockHttp.mockPost('/auth/logout', undefined)

      await authClient.logout()

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/auth/logout'
      })
    })
  })

  describe('me', () => {
    it('should get current user profile', async () => {
      const mockProfile: UserProfile = {
        address: '0x1234567890abcdef',
        role: 'merchant',
        createdAt: '2025-01-01T00:00:00Z'
      }

      mockHttp.mockGet('/auth/me', mockProfile)

      const result = await authClient.me()

      expect(result).toEqual(mockProfile)
      expect(result.address).toBe('0x1234567890abcdef')
      expect(result.role).toBe('merchant')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'GET',
        path: '/auth/me'
      })
    })

    it('should handle unauthorized errors', async () => {
      await expect(authClient.me()).rejects.toThrow()
    })
  })

  describe('refresh', () => {
    it('should refresh authentication token', async () => {
      const mockResponse: LoginResponse = {
        token: 'new-jwt-token',
        address: '0x1234567890abcdef',
        expiresIn: 3600
      }

      mockHttp.mockPost('/auth/refresh', mockResponse)

      const result = await authClient.refresh()

      expect(result).toEqual(mockResponse)
      expect(result.token).toBe('new-jwt-token')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/auth/refresh'
      })
    })
  })
})
