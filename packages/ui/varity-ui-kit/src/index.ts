/**
 * @varity-labs/ui-kit - Web3 React Component Library
 *
 * Comprehensive UI components for building Varity L3 applications
 * with Thirdweb React SDK and USDC gas support
 *
 * @packageDocumentation
 */

// Core
export { VarityClient } from './core/VarityClient'
export type { VarityClientConfig } from './core/VarityClient'
export { HTTPClient } from './utils/http'
export type { HTTPResponse, HTTPClientConfig } from './utils/http'

// Module Clients
export { AuthClient } from './modules/auth'
export { StorageClient } from './modules/storage'
export { ComputeClient } from './modules/compute'
export { ZKClient } from './modules/zk'
export { AnalyticsClient } from './modules/analytics'
export { NotificationsClient } from './modules/notifications'
export { ExportClient } from './modules/export'
export { CacheClient } from './modules/cache'
export { MonitoringClient } from './modules/monitoring'
export { ForecastingClient } from './modules/forecasting'
export { WebhooksClient } from './modules/webhooks'
export { OracleClient } from './modules/oracle'
export { TemplateDeploymentClient } from './modules/templates'

// Module Types
export type * from './modules/auth'
export type * from './modules/storage'
export type * from './modules/compute'
export type * from './modules/zk'
export type * from './modules/analytics'
export type * from './modules/notifications'
export type * from './modules/export'
export type * from './modules/cache'
export type * from './modules/monitoring'
export type * from './modules/forecasting'
export type * from './modules/webhooks'
export type * from './modules/oracle'
export type * from './modules/templates'

// React Components
export * from './components'

// In-App Wallet Components (Thirdweb)
export {
  InAppWalletProvider,
  useInAppWallet,
  EmailLoginButton,
  SocialLoginButtons,
  OnboardingFlow,
} from './components/InAppWallet'

// Privy Authentication Components (Recommended for Non-Crypto Users)
export {
  VarityPrivyProvider,
  type VarityPrivyProviderProps,
} from './providers/PrivyProvider'

// Privy Stack (All-in-one Provider Setup - PRODUCTION PATTERN)
export {
  PrivyStack,
  type PrivyStackProps,
} from './providers/PrivyStack'

export {
  PrivyLoginButton,
  PrivyUserProfile,
  PrivyProtectedRoute,
  // Production patterns for Privy initialization
  PrivyReadyGate,
  InitializingScreen,
  InitTimeoutScreen,
  type PrivyLoginButtonProps,
  type PrivyUserProfileProps,
  type PrivyProtectedRouteProps,
  type PrivyReadyGateProps,
  type InitializingScreenProps,
  type InitTimeoutScreenProps,
} from './components/Privy'

// Re-export Privy hooks for convenience
export { usePrivy, useWallets, useLogin, useLogout } from '@privy-io/react-auth'

// Onramp Components (Thirdweb Pay)
export {
  BuyUSDCButton,
  OnrampWidget,
} from './components/Onramp'

// React Hooks
export * from './hooks'

// Web3 Providers
export {
  VarityProvider,
  WalletProvider,
  ChainProvider,
  useWallet,
  useChain,
  type VarityProviderProps,
  type WalletProviderProps,
  type ChainProviderProps,
  type WalletContextValue,
  type ChainContextValue,
} from './providers'

// Dashboard Provider (Privy + Thirdweb + WalletSync - RECOMMENDED for dashboards)
export {
  VarityDashboardProvider,
  type VarityDashboardProviderProps,
} from './providers/VarityDashboardProvider'

// Wallet Sync (Privy + Thirdweb synchronization)
export {
  WalletSyncProvider,
  WalletSyncContext,
  useWalletSync,
  type WalletSyncState,
  type WalletSyncProviderProps,
} from './providers/WalletSyncProvider'

// Web3 Components
export {
  // Wallet Components
  ConnectWallet,
  WalletInfo,
  WalletBalance,
  WalletDropdown,
  DisconnectButton,
  // Display Components
  AddressDisplay,
  BalanceDisplay,
  BlockExplorerLink,
  // Form Components
  AmountInput,
  AddressInput,
  // Types
  type ConnectWalletProps,
  type WalletInfoProps,
  type WalletBalanceProps,
  type WalletDropdownProps,
  type DisconnectButtonProps,
  type AddressDisplayProps,
  type BalanceDisplayProps,
  type BlockExplorerLinkProps,
  type AmountInputProps,
  type AddressInputProps,
} from './web3'

// Web3 Hooks
export {
  useVarityWallet,
  useUSDCFormat,
  useAddressValidation,
  useBlockExplorer,
  type UseVarityWalletReturn,
  type UseUSDCFormatReturn,
  type UseAddressValidationReturn,
  type UseBlockExplorerReturn,
} from './hooks/web3'

// Chain Configuration
export {
  varityL3,
  varityL3Testnet,
  varityL3Wagmi,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  THIRDWEB_CLIENT_ID,
  USDC_DECIMALS,
  VARITY_USDC_ADDRESS,
  getBlockExplorerUrl,
  formatAddress,
  formatUSDC,
  parseUSDC,
} from './config/chains'

// Smart Wallet Components (ERC-4337 Account Abstraction)
export {
  SmartWalletProvider,
  useSmartWallet,
  SmartWalletConnectButton,
  GaslessBadge,
  SimpleSmartWallet,
  type SmartWalletConfig,
  type SimpleSmartWalletProps,
} from './wallets'

// Styles
// Note: CSS should be imported by the consuming application
// import './styles/globals.css'

// Version
export const VERSION = '2.0.0-alpha.1'
