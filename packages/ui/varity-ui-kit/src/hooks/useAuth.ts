/**
 * useAuth - Authentication state management hook
 *
 * Manages user authentication state with SIWE (Sign-In with Ethereum).
 */

import { useState, useCallback, useEffect } from 'react'
import { useVarityAPI } from './useVarityAPI'
import type { UserProfile, LoginResponse } from '../types/api-extensions'
import { Metadata } from '@varity-labs/types'

export interface User {
  /** User's wallet address */
  address: string
  /** User's display name */
  name?: string
  /** User's email */
  email?: string
  /** User's avatar URL */
  avatarUrl?: string
  /** Additional user metadata */
  metadata?: Metadata
}

export interface UseAuthReturn {
  /** Current user (null if not authenticated) */
  user: User | null
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Whether auth is loading */
  isLoading: boolean
  /** Authentication error */
  error: Error | null
  /** Login with SIWE */
  login: (message: string, signature: string) => Promise<void>
  /** Logout */
  logout: () => Promise<void>
  /** Refresh user data */
  refreshUser: () => Promise<void>
}

/**
 * useAuth Hook
 *
 * Manages authentication state with Sign-In with Ethereum (SIWE).
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth()
 *
 * // Login
 * await login(siweMessage, signature)
 *
 * // Logout
 * await logout()
 * ```
 */
export const useAuth = (): UseAuthReturn => {
  const { client, isAuthenticated, setAuthenticated } = useVarityAPI()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userData = await (client as any).auth.me() as UserProfile
      setUser({
        address: userData.address,
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
        metadata: userData.metadata
      })
      setAuthenticated(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user')
      setError(error)
      setUser(null)
      setAuthenticated(false)
      // Clear invalid token
      localStorage.removeItem('varity_token')
    } finally {
      setIsLoading(false)
    }
  }, [client, setAuthenticated])

  const login = useCallback(async (message: string, signature: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await (client as any).auth.login(message, signature) as LoginResponse

      // Store token
      if (response.token) {
        localStorage.setItem('varity_token', response.token)
        ;(client as any).setAPIKey(response.token)
      }

      // Set user data
      setUser({
        address: response.address,
        name: response.name,
        email: response.email,
        avatarUrl: response.avatarUrl,
        metadata: response.metadata
      })
      setAuthenticated(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [client, setAuthenticated])

  // Load user on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('varity_token')
    if (token) {
      refreshUser()
    }
  }, [refreshUser])

  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await (client as any).auth.logout()
    } catch (err) {
      // Log error but continue with logout
      console.error('Logout error:', err)
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('varity_token')
      setUser(null)
      setAuthenticated(false)
      setIsLoading(false)
    }
  }, [client, setAuthenticated])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser
  }
}

/**
 * useWalletConnect Hook
 *
 * Helper hook for connecting external wallets (MetaMask, etc).
 *
 * @example
 * ```tsx
 * const { connect, disconnect, address, isConnected } = useWalletConnect()
 * await connect()
 * ```
 */
export const useWalletConnect = () => {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const connect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Check if MetaMask is installed
      const ethereum = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
      if (!ethereum) {
        throw new Error('MetaMask is not installed')
      }

      // Request account access
      const result = await ethereum.request({
        method: 'eth_requestAccounts'
      })

      // Type guard for accounts array
      const accounts = Array.isArray(result) ? result as string[] : [];

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      setAddress(accounts[0])
      setIsConnected(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect wallet')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
  }, [])

  // Listen for account changes
  useEffect(() => {
    const ethereum = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    if (!ethereum) return

    const handleAccountsChanged = (...args: unknown[]) => {
      // Type guard for accounts parameter
      const accounts = Array.isArray(args[0]) ? args[0] as string[] : [];
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAddress(accounts[0])
      }
    }

    ethereum.on('accountsChanged', handleAccountsChanged)

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [disconnect])

  return {
    address,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect
  }
}

// Ethereum provider interface
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}
