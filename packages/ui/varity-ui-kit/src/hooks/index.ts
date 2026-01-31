/**
 * Varity UI Kit - React Hooks
 *
 * Custom React hooks for Varity SDK integration.
 */

// Main API Hook
export {
  useVarityAPI,
  useVarityQuery,
  useVarityMutation,
  VarityAPIProvider
} from './useVarityAPI'
export type { VarityAPIContextValue, VarityAPIProviderProps } from './useVarityAPI'

// Authentication Hooks
export {
  useAuth,
  useWalletConnect
} from './useAuth'
export type { User, UseAuthReturn } from './useAuth'

// Analytics Hooks
export {
  useAnalytics,
  useKPI
} from './useAnalytics'
export type {
  KPIData,
  AnalyticsData,
  UseAnalyticsOptions,
  UseAnalyticsReturn
} from './useAnalytics'

// Dashboard Hooks
export {
  useDashboard,
  useWidgetData
} from './useDashboard'
export type {
  DashboardWidget,
  DashboardConfig,
  UseDashboardOptions,
  UseDashboardReturn
} from './useDashboard'

// Re-export useTheme from Branding components
export { useTheme } from '../components/Branding/ThemeProvider'

// Wallet Authentication Hooks (Privy + Backend Session Management)
export {
  useWalletAuth,
} from './useWalletAuth'
export type {
  WalletSession,
  SessionInfo,
  UseWalletAuthReturn,
  UseWalletAuthConfig,
} from './useWalletAuth'
