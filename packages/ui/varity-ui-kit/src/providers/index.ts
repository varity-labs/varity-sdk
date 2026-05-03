export { VarityProvider, type VarityProviderProps } from './VarityProvider';
export { WalletProvider, useWallet, type WalletProviderProps, type WalletContextValue } from './WalletContext';
export { ChainProvider, useChain, type ChainProviderProps, type ChainContextValue } from './ChainContext';

// Authentication (base provider — requires appId)
export { AuthBaseProvider, type AuthBaseProviderProps } from './PrivyProvider';

// Authentication (all-in-one provider — zero-config, PRODUCTION PATTERN)
export { AuthProvider, type AuthProviderProps } from './PrivyStack';

// ZeroDev Account Abstraction (gasless transactions)
export { ZeroDevProvider, useSmartAccount, useZeroDev, type ZeroDevContextType, type ZeroDevProviderProps } from './ZeroDevProvider';

// Wallet Sync (Privy + Thirdweb synchronization)
export {
  WalletSyncProvider,
  WalletSyncContext,
  useWalletSync,
  type WalletSyncState,
  type WalletSyncProviderProps,
} from './WalletSyncProvider';

// Complete Dashboard Provider (Privy + Thirdweb + WalletSync + React Query)
export {
  VarityDashboardProvider,
  type VarityDashboardProviderProps,
} from './VarityDashboardProvider';

/**
 * Provider Setup Guide
 *
 * For simple Thirdweb-only apps:
 * @example
 * ```tsx
 * import { VarityProvider, WalletProvider, ChainProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <VarityProvider>
 *       <WalletProvider>
 *         <ChainProvider>
 *           <YourApp />
 *         </ChainProvider>
 *       </WalletProvider>
 *     </VarityProvider>
 *   );
 * }
 * ```
 *
 * For dashboards with Privy authentication (RECOMMENDED):
 * @example
 * ```tsx
 * import { VarityDashboardProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <VarityDashboardProvider
 *       privyAppId="your-privy-app-id"
 *       thirdwebClientId="your-thirdweb-client-id"
 *       appearance={{ theme: 'light', accentColor: '#2563EB' }}
 *     >
 *       <YourDashboard />
 *     </VarityDashboardProvider>
 *   );
 * }
 * ```
 */
