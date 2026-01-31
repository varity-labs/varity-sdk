/**
 * SimpleSmartWallet - Zero-config smart wallet with gasless transactions
 *
 * Perfect for getting started quickly. Advanced users should use SmartWalletProvider directly.
 *
 * @example Basic usage
 * ```tsx
 * import { SimpleSmartWallet } from '@varity-labs/ui-kit';
 *
 * <SimpleSmartWallet appId="your-app-id">
 *   <YourApp />
 * </SimpleSmartWallet>
 * ```
 *
 * @example With custom developer wallet
 * ```tsx
 * <SimpleSmartWallet
 *   appId="your-app-id"
 *   developerWallet="0x..."
 * >
 *   <YourApp />
 * </SimpleSmartWallet>
 * ```
 */

import React from 'react';
import { SmartWalletProvider } from './SmartWalletProvider';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet } from '@varity-labs/sdk';
import { VARITY_DEV_CREDENTIALS } from '@varity-labs/sdk';

export interface SimpleSmartWalletProps {
  /**
   * Your app ID (for gas tracking and billing)
   * Get this from Varity App Store dashboard
   */
  appId: string;

  /**
   * Developer wallet address for gas billing (optional)
   * Defaults to connected wallet
   */
  developerWallet?: string;

  /**
   * Enable gasless transactions (default: true)
   */
  gasless?: boolean;

  /**
   * thirdweb client ID (optional)
   * Uses shared dev credentials if not provided
   */
  thirdwebClientId?: string;

  /**
   * Enable gas tracking (default: true on production)
   */
  trackGas?: boolean;

  children: React.ReactNode;
}

/**
 * SimpleSmartWallet Component
 *
 * Zero-configuration smart wallet wrapper that "just works" for rapid prototyping.
 * Uses shared development credentials by default - upgrade to custom credentials for production.
 *
 * Features:
 * - Gasless transactions (Varity pays gas by default)
 * - Smart wallet (ERC-4337)
 * - Automatic gas tracking for billing
 * - Zero configuration required
 *
 * @param props - SimpleSmartWallet configuration
 * @returns React component
 */
export function SimpleSmartWallet({
  appId,
  developerWallet,
  gasless = true,
  thirdwebClientId,
  trackGas = process.env.NODE_ENV === 'production',
  children,
}: SimpleSmartWalletProps) {
  const client = React.useMemo(() => {
    return createThirdwebClient({
      clientId: thirdwebClientId || VARITY_DEV_CREDENTIALS.thirdweb.clientId,
    });
  }, [thirdwebClientId]);

  // Get developer wallet from context if not provided
  const resolvedDeveloperWallet = React.useMemo(() => {
    // TODO: Get from useWalletAuth if not provided
    // For now, use placeholder address
    return developerWallet || '0x0000000000000000000000000000000000000000';
  }, [developerWallet]);

  return (
    <SmartWalletProvider
      config={{
        client,
        chain: varityL3Testnet,
        gasless: gasless ? {
          enabled: true,
          paymasterUrl: 'https://aa.conduit.xyz/api/v3/60cd06d8-a734-453c-84e9-5387c315ee2e/chain/33529',
        } : undefined,
        appIdentifier: {
          appId,
          developerWallet: resolvedDeveloperWallet,
        },
        gasTracking: {
          enabled: trackGas,
          apiUrl: 'https://api.varity.so/v1/gas',
        },
      }}
    >
      {children}
    </SmartWalletProvider>
  );
}
