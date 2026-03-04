/**
 * useVarityAPI - Main hook for Varity API integration
 *
 * Provides a React hook interface to the Varity API with automatic error handling,
 * loading states, and caching.
 */

import React, { useContext, createContext, ReactNode, useState, useCallback } from 'react'
import { VarityClient, VarityClientConfig } from '../core/VarityClient'

export interface VarityAPIContextValue {
  /** Varity client instance */
  client: VarityClient
  /** Whether client is authenticated */
  isAuthenticated: boolean
  /** Set authentication status */
  setAuthenticated: (authenticated: boolean) => void
}

const VarityAPIContext = createContext<VarityAPIContextValue | undefined>(undefined)

export interface VarityAPIProviderProps {
  /** Varity client configuration */
  config: VarityClientConfig
  /** Child components */
  children: ReactNode
}

/**
 * VarityAPIProvider - Context provider for Varity API
 *
 * Wrap your app with this provider to enable useVarityAPI hook.
 *
 * @example
 * ```tsx
 * <VarityAPIProvider config={{ apiEndpoint: 'https://api.varity.io' }}>
 *   <App />
 * </VarityAPIProvider>
 * ```
 */
export const VarityAPIProvider: React.FC<VarityAPIProviderProps> = ({ config, children }) => {
  const [client] = useState(() => new VarityClient(config))
  const [isAuthenticated, setAuthenticated] = useState(false)

  return (
    <VarityAPIContext.Provider value={{ client, isAuthenticated, setAuthenticated }}>
      {children}
    </VarityAPIContext.Provider>
  )
}

/**
 * useVarityAPI Hook
 *
 * Access Varity client from any component.
 *
 * @example
 * ```tsx
 * const { client, isAuthenticated } = useVarityAPI()
 * const data = await client.analytics.getKPIs({ period: 'current_month' })
 * ```
 */
export const useVarityAPI = (): VarityAPIContextValue => {
  const context = useContext(VarityAPIContext)
  if (!context) {
    throw new Error('useVarityAPI must be used within a VarityAPIProvider')
  }
  return context
}

/**
 * useVarityQuery Hook
 *
 * Execute API queries with automatic loading and error states.
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useVarityQuery(
 *   async (client) => client.analytics.getKPIs({ period: 'current_month' })
 * )
 * ```
 */
export function useVarityQuery<T>(
  queryFn: (client: VarityClient) => Promise<T>,
  deps: any[] = []
) {
  const { client } = useVarityAPI()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await queryFn(client)
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [client, ...deps])

  // Auto-execute on mount
  useState(() => {
    execute()
  })

  return {
    data,
    loading,
    error,
    refetch: execute
  }
}

/**
 * useVarityMutation Hook
 *
 * Execute API mutations with loading and error states.
 *
 * @example
 * ```tsx
 * const { mutate, loading, error } = useVarityMutation(
 *   async (client, file: File) => client.storage.uploadFile(file)
 * )
 *
 * // Later in code
 * await mutate(file)
 * ```
 */
export function useVarityMutation<TArgs extends any[], TResult>(
  mutationFn: (client: VarityClient, ...args: TArgs) => Promise<TResult>
) {
  const { client } = useVarityAPI()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TResult | null>(null)

  const mutate = useCallback(async (...args: TArgs): Promise<TResult> => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutationFn(client, ...args)
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [client])

  return {
    mutate,
    loading,
    error,
    data,
    reset: () => {
      setData(null)
      setError(null)
    }
  }
}
