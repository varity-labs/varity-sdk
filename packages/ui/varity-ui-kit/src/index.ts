/**
 * @varity-labs/ui-kit - React Component Library for building applications with Varity
 *
 * Comprehensive UI components for building applications with Varity
 * including auth, payments, and dashboard components
 *
 * @packageDocumentation
 */

// ============================================================================
// Advanced: API Client (requires backend API — not yet available)
// These module clients will be enabled in a future release.
// ============================================================================
// export { VarityClient } from './core/VarityClient'
// export type { VarityClientConfig } from './core/VarityClient'
// export { HTTPClient } from './utils/http'
// export type { HTTPResponse, HTTPClientConfig } from './utils/http'
// export { AuthClient } from './modules/auth'
// export { StorageClient } from './modules/storage'
// export { ComputeClient } from './modules/compute'
// export { ZKClient } from './modules/zk'
// export { AnalyticsClient } from './modules/analytics'
// export { NotificationsClient } from './modules/notifications'
// export { ExportClient } from './modules/export'
// export { CacheClient } from './modules/cache'
// export { MonitoringClient } from './modules/monitoring'
// export { ForecastingClient } from './modules/forecasting'
// export { WebhooksClient } from './modules/webhooks'
// export { OracleClient } from './modules/oracle'
// export { TemplateDeploymentClient } from './modules/templates'
// export type * from './modules/auth'
// export type * from './modules/storage'
// export type * from './modules/compute'
// export type * from './modules/zk'
// export type * from './modules/analytics'
// export type * from './modules/notifications'
// export type * from './modules/export'
// export type * from './modules/cache'
// export type * from './modules/monitoring'
// export type * from './modules/forecasting'
// export type * from './modules/webhooks'
// export type * from './modules/oracle'
// export type * from './modules/templates'

// React Components
export * from './components'

// Form Components (direct exports for convenience)
export { Button } from './components/Form/Button'
export { Input } from './components/Form/Input'
export { Textarea } from './components/Form/Textarea'
export { Select } from './components/Form/Select'
export { Toggle } from './components/Form/Toggle'
export { Checkbox } from './components/Form/Checkbox'
export { RadioGroup } from './components/Form/RadioGroup'

// Overlay Components (direct exports for convenience)
export { Dialog } from './components/Overlay/Dialog'
export { ConfirmDialog } from './components/Overlay/ConfirmDialog'
export { DropdownMenu } from './components/Overlay/DropdownMenu'

// Feedback Components (direct exports for convenience)
export { ToastProvider, type ToastContextValue } from './components/Feedback/ToastProvider'
export { useToast } from './components/Feedback/useToast'
export type { Toast, ToastType } from './components/Feedback/Toast'
export { Skeleton } from './components/Feedback/Skeleton'

// Display Components (direct exports for convenience)
export {
  Badge,
  PriorityBadge,
  ProjectStatusBadge,
  TaskStatusBadge,
  RoleBadge
} from './components/Display/Badge'
export { Avatar, AvatarGroup } from './components/Display/Avatar'
export { ProgressBar } from './components/Display/ProgressBar'

// Navigation Components (direct exports for convenience)
export { CommandPalette } from './components/Navigation/CommandPalette'
export { Breadcrumb } from './components/Navigation/Breadcrumb'

// ============================================================================
// Advanced: In-App Wallet Components
// Available via direct import: import { InAppWalletProvider } from '@varity/ui-kit/components/InAppWallet'
// ============================================================================
// export {
//   InAppWalletProvider,
//   useInAppWallet,
//   EmailLoginButton,
//   SocialLoginButtons,
//   OnboardingFlow,
// } from './components/InAppWallet'

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

// ============================================================================
// Advanced: Onramp Components
// Available via direct import: import { BuyUSDCButton } from '@varity/ui-kit/components/Onramp'
// ============================================================================
// export {
//   BuyUSDCButton,
//   OnrampWidget,
// } from './components/Onramp'

// PaymentWidget Components (MANDATORY for app monetization - 90/10 revenue split)
export {
  PaymentWidget,
  PaymentGate,
  useVarityPayment,
  // Advanced: Available via direct import from submodule
  // VARITY_PAYMENTS_ADDRESS,
  // VARITY_TREASURY_ADDRESS,
  // PLATFORM_FEE_BPS,
  // VARITY_PAYMENTS_ABI,
  type PaymentWidgetProps,
  type PaymentGateProps,
  type UseVarityPaymentReturn,
  type UseVarityPaymentOptions,
  type AppPricing,
  type PaymentType,
} from './components/PaymentWidget'

// React Hooks
export * from './hooks'

// ============================================================================
// Advanced: Web3 Providers
// Available via direct import: import { WalletProvider } from '@varity/ui-kit/providers'
// ============================================================================
// export {
//   VarityProvider,
//   WalletProvider,
//   ChainProvider,
//   useWallet,
//   useChain,
//   type VarityProviderProps,
//   type WalletProviderProps,
//   type ChainProviderProps,
//   type WalletContextValue,
//   type ChainContextValue,
// } from './providers'

// Dashboard Provider (Privy + Thirdweb + WalletSync - RECOMMENDED for dashboards)
export {
  VarityDashboardProvider,
  type VarityDashboardProviderProps,
} from './providers/VarityDashboardProvider'

// ============================================================================
// Advanced: Wallet Sync (Privy + Thirdweb synchronization)
// Available via direct import: import { WalletSyncProvider } from '@varity/ui-kit/providers/WalletSyncProvider'
// ============================================================================
// export {
//   WalletSyncProvider,
//   WalletSyncContext,
//   useWalletSync,
//   type WalletSyncState,
//   type WalletSyncProviderProps,
// } from './providers/WalletSyncProvider'

// ============================================================================
// Advanced: Web3 Components
// Available via direct import: import { ConnectWallet } from '@varity/ui-kit/web3'
// ============================================================================
// export {
//   ConnectWallet,
//   WalletInfo,
//   WalletBalance,
//   WalletDropdown,
//   DisconnectButton,
//   AddressDisplay,
//   BalanceDisplay,
//   BlockExplorerLink,
//   AmountInput,
//   AddressInput,
//   type ConnectWalletProps,
//   type WalletInfoProps,
//   type WalletBalanceProps,
//   type WalletDropdownProps,
//   type DisconnectButtonProps,
//   type AddressDisplayProps,
//   type BalanceDisplayProps,
//   type BlockExplorerLinkProps,
//   type AmountInputProps,
//   type AddressInputProps,
// } from './web3'

// ============================================================================
// Advanced: Web3 Hooks
// Available via direct import: import { useVarityWallet } from '@varity/ui-kit/hooks/web3'
// ============================================================================
// export {
//   useVarityWallet,
//   useUSDCFormat,
//   useAddressValidation,
//   useBlockExplorer,
//   type UseVarityWalletReturn,
//   type UseUSDCFormatReturn,
//   type UseAddressValidationReturn,
//   type UseBlockExplorerReturn,
// } from './hooks/web3'

// ============================================================================
// Advanced: Chain Configuration
// Available via direct import: import { varityL3 } from '@varity/ui-kit/config/chains'
// ============================================================================
// export {
//   varityL3,
//   varityL3Testnet,
//   varityL3Wagmi,
//   SUPPORTED_CHAINS,
//   DEFAULT_CHAIN,
//   THIRDWEB_CLIENT_ID,
//   USDC_DECIMALS,
//   VARITY_USDC_ADDRESS,
//   getBlockExplorerUrl,
//   formatAddress,
//   formatUSDC,
//   parseUSDC,
// } from './config/chains'

// ============================================================================
// Advanced: Smart Wallet Components (Account Abstraction)
// Available via direct import: import { SmartWalletProvider } from '@varity/ui-kit/wallets'
// ============================================================================
// export {
//   SmartWalletProvider,
//   useSmartWallet,
//   SmartWalletConnectButton,
//   GaslessBadge,
//   SimpleSmartWallet,
//   type SmartWalletConfig,
//   type SimpleSmartWalletProps,
// } from './wallets'

// Styles
// Note: CSS should be imported by the consuming application
// import './styles/globals.css'

// Version
export const VERSION = '2.0.0-alpha.1'
