import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';
import type { Account } from 'thirdweb/wallets';

export interface WalletContextValue {
  address: string | null;
  account: Account | null;
  isConnected: boolean;
  isConnecting: boolean;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export interface WalletProviderProps {
  children: ReactNode;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

/**
 * Wallet state management provider
 *
 * Manages wallet connection state and provides utilities for:
 * - Accessing current wallet address
 * - Checking connection status
 * - Disconnecting wallet
 * - Event callbacks for connection changes
 *
 * @example
 * ```tsx
 * import { WalletProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <WalletProvider
 *       onConnect={(address) => console.log('Connected:', address)}
 *       onDisconnect={() => console.log('Disconnected')}
 *     >
 *       <YourApp />
 *     </WalletProvider>
 *   );
 * }
 * ```
 */
export function WalletProvider({ children, onConnect, onDisconnect }: WalletProviderProps): JSX.Element {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect: thirdwebDisconnect } = useDisconnect();

  // Note: Connection state is managed by thirdweb hooks
  const isConnecting = false;

  const address = account?.address || null;
  const isConnected = !!address;

  // Handle connection events
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    }
  }, [isConnected, address, onConnect]);

  const disconnect = useCallback(async () => {
    try {
      if (wallet) {
        await thirdwebDisconnect(wallet);
      }
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [wallet, thirdwebDisconnect, onDisconnect]);

  const value: WalletContextValue = {
    address,
    account: account || null,
    isConnected,
    isConnecting,
    disconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Hook to access wallet context
 *
 * @returns {WalletContextValue} Wallet state and utilities
 * @throws {Error} If used outside WalletProvider
 *
 * @example
 * ```tsx
 * import { useWallet } from '@varity-labs/ui-kit';
 *
 * function MyComponent() {
 *   const { address, isConnected, disconnect } = useWallet();
 *
 *   if (!isConnected) {
 *     return <p>Please connect your wallet</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Connected: {address}</p>
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
