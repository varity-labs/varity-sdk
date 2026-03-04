import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useActiveAccount } from 'thirdweb/react';

/**
 * Wallet Sync State
 * Provides unified wallet state from Privy and Thirdweb
 */
export interface WalletSyncState {
  /** The connected wallet address (from Privy embedded wallet or external wallet) */
  address: string | null;
  /** Whether wallet state is still loading */
  isLoading: boolean;
  /** Whether Privy and Thirdweb wallets are in sync */
  isSynced: boolean;
  /** Whether the user is authenticated via Privy */
  isAuthenticated: boolean;
  /** The authentication method used (email, google, wallet, etc.) */
  authMethod: string | null;
}

/**
 * WalletSyncContext - Provides unified wallet state across Privy and Thirdweb
 *
 * This context synchronizes embedded wallets (created by Privy for email/social users)
 * with Thirdweb's wallet context, ensuring a consistent experience.
 */
export const WalletSyncContext = createContext<WalletSyncState>({
  address: null,
  isLoading: true,
  isSynced: false,
  isAuthenticated: false,
  authMethod: null,
});

/**
 * Hook to access wallet sync state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { address, isLoading, isSynced } = useWalletSync();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!address) return <ConnectButton />;
 *
 *   return <p>Connected: {address}</p>;
 * }
 * ```
 */
export const useWalletSync = () => useContext(WalletSyncContext);

export interface WalletSyncProviderProps {
  children: ReactNode;
  /**
   * Callback when wallet address changes
   */
  onAddressChange?: (address: string | null) => void;
  /**
   * Callback when sync state changes
   */
  onSyncStateChange?: (state: WalletSyncState) => void;
}

/**
 * WalletSyncProvider - Synchronizes Privy embedded wallets with Thirdweb
 *
 * This provider ensures that when a user signs in with email/Google,
 * their embedded wallet is immediately available to all components using Thirdweb hooks.
 *
 * Features:
 * - Syncs Privy wallets with Thirdweb context
 * - Supports embedded wallets (email/social login)
 * - Supports external wallets (MetaMask, WalletConnect, etc.)
 * - Provides unified wallet state across the app
 *
 * @example
 * ```tsx
 * import { WalletSyncProvider, VarityPrivyProvider } from '@varity-labs/ui-kit';
 * import { ThirdwebProvider } from 'thirdweb/react';
 *
 * function App() {
 *   return (
 *     <VarityPrivyProvider appId="your-privy-app-id">
 *       <ThirdwebProvider>
 *         <WalletSyncProvider>
 *           <YourApp />
 *         </WalletSyncProvider>
 *       </ThirdwebProvider>
 *     </VarityPrivyProvider>
 *   );
 * }
 * ```
 */
export function WalletSyncProvider({
  children,
  onAddressChange,
  onSyncStateChange,
}: WalletSyncProviderProps) {
  const { authenticated, user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const activeAccount = useActiveAccount();

  const [syncState, setSyncState] = useState<WalletSyncState>({
    address: null,
    isLoading: true,
    isSynced: false,
    isAuthenticated: false,
    authMethod: null,
  });

  useEffect(() => {
    // Get the primary wallet address
    // Priority: Privy wallet > Thirdweb active account
    const privyWallet = wallets && wallets.length > 0 ? wallets[0] : null;
    const thirdwebAddress = activeAccount?.address;
    const primaryAddress = privyWallet?.address || thirdwebAddress || null;

    // Determine auth method
    let authMethod: string | null = null;
    if (user?.email) {
      authMethod = 'email';
    } else if (user?.google) {
      authMethod = 'google';
    } else if (user?.twitter) {
      authMethod = 'twitter';
    } else if (user?.discord) {
      authMethod = 'discord';
    } else if (user?.github) {
      authMethod = 'github';
    } else if (user?.wallet) {
      authMethod = 'wallet';
    }

    // Determine loading state
    const isLoading = !privyReady || (authenticated && !walletsReady);

    // Determine sync state
    const isSynced = authenticated && !!primaryAddress && walletsReady;

    const newState: WalletSyncState = {
      address: primaryAddress,
      isLoading,
      isSynced,
      isAuthenticated: authenticated,
      authMethod,
    };

    setSyncState(newState);

    // Call callbacks if provided
    if (onAddressChange && newState.address !== syncState.address) {
      onAddressChange(newState.address);
    }
    if (onSyncStateChange) {
      onSyncStateChange(newState);
    }
  }, [authenticated, user, wallets, walletsReady, privyReady, activeAccount, onAddressChange, onSyncStateChange, syncState.address]);

  // Store wallet address in localStorage for persistence across sessions
  useEffect(() => {
    if (syncState.address) {
      localStorage.setItem('wallet_address', syncState.address);
    } else if (!syncState.isLoading && !syncState.isAuthenticated) {
      localStorage.removeItem('wallet_address');
    }
  }, [syncState.address, syncState.isLoading, syncState.isAuthenticated]);

  return (
    <WalletSyncContext.Provider value={syncState}>
      {children}
    </WalletSyncContext.Provider>
  );
}

export default WalletSyncProvider;
