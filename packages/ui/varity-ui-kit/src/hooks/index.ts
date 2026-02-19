/**
 * Varity UI Kit - React Hooks
 *
 * Custom React hooks for Varity integration.
 */

// ============================================================================
// Advanced: API Client Hooks (requires backend API — not yet available)
// These hooks will be enabled in a future release.
// ============================================================================
// export {
//   useVarityAPI,
//   useVarityQuery,
//   useVarityMutation,
//   VarityAPIProvider
// } from './useVarityAPI'
// export type { VarityAPIContextValue, VarityAPIProviderProps } from './useVarityAPI'

// ============================================================================
// Advanced: SIWE Authentication (use Privy instead for most apps)
// ============================================================================
// export {
//   useAuth,
// } from './useAuth'
// export type { User, UseAuthReturn } from './useAuth'

// ============================================================================
// Advanced: Analytics & Dashboard Hooks (requires backend API)
// ============================================================================
// export {
//   useAnalytics,
//   useKPI
// } from './useAnalytics'
// export type {
//   KPIData,
//   AnalyticsData,
//   UseAnalyticsOptions,
//   UseAnalyticsReturn
// } from './useAnalytics'

// export {
//   useDashboard,
//   useWidgetData
// } from './useDashboard'
// export type {
//   DashboardWidget,
//   DashboardConfig,
//   UseDashboardOptions,
//   UseDashboardReturn
// } from './useDashboard'

// Re-export useTheme from Branding components
export { useTheme } from '../components/Branding/ThemeProvider'

// ============================================================================
// Advanced: Wallet Authentication (blockchain-specific)
// ============================================================================
// export {
//   useWalletAuth,
// } from './useWalletAuth'
// export type {
//   WalletSession,
//   SessionInfo,
//   UseWalletAuthReturn,
//   UseWalletAuthConfig,
// } from './useWalletAuth'
