import React, { ReactNode } from 'react';
import { PrivyProvider as BasePrivyProvider, usePrivy } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { arbitrumSepolia, arbitrum } from 'viem/chains';
import { createConfig } from 'wagmi';

/**
 * Varity L3 Chain Configuration (Arbitrum Orbit Testnet)
 * CRITICAL: Uses correct RPC URL for Conduit deployment
 *
 * Chain ID: 33529
 * Native Token: USDC (6 decimals - NOT 18!)
 */
const varietyL3Testnet = {
  id: 33529,
  name: 'Varity L3 Testnet',
  network: 'varity-testnet',
  nativeCurrency: {
    decimals: 6, // USDC has 6 decimals - NOT 18!
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz'],
    },
    public: {
      http: ['https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Varity Explorer',
      url: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz',
    },
  },
  testnet: true,
} as const;

// Create Wagmi config for Privy
const config = createConfig({
  chains: [varietyL3Testnet, arbitrumSepolia, arbitrum],
  transports: {
    [varietyL3Testnet.id]: http(),
    [arbitrumSepolia.id]: http(),
    [arbitrum.id]: http(),
  },
});

// Create React Query client
const queryClient = new QueryClient();

import { User } from '@privy-io/react-auth';

export interface AuthBaseProviderProps {
  children: ReactNode;
  appId: string;
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: Error) => void;
  appearance?: {
    theme?: 'light' | 'dark';
    accentColor?: `#${string}`;
    logo?: string;
  };
}

/**
 * Varity Privy Provider
 *
 * Wraps Privy authentication with Varity L3 chain configuration.
 * Provides email/social login for non-crypto native users.
 *
 * Features:
 * - Email OTP authentication
 * - Social logins (Google, Twitter, Discord, GitHub, etc.)
 * - Embedded wallets (no MetaMask required)
 * - SMS authentication
 * - Fiat onramp integration
 *
 * @example
 * ```tsx
 * import { VarityPrivyProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <VarityPrivyProvider appId="your-privy-app-id">
 *       <YourApp />
 *     </VarityPrivyProvider>
 *   );
 * }
 * ```
 */
export function AuthBaseProvider({
  children,
  appId,
  onLoginSuccess,
  onLoginError,
  appearance = {
    theme: 'light',
    accentColor: '#6366f1',
  },
}: AuthBaseProviderProps): JSX.Element {
  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        // Login methods
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],

        // Appearance configuration
        appearance: {
          theme: appearance.theme,
          accentColor: appearance.accentColor,
          logo: appearance.logo,
          showWalletLoginFirst: false, // Prioritize email/social
        },

        // Embedded wallet configuration
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Auto-create wallet for email/social users
        },

        // Default chain
        defaultChain: varietyL3Testnet,

        // Supported chains
        supportedChains: [varietyL3Testnet, arbitrumSepolia, arbitrum],

        // MFA configuration
        mfa: {
          noPromptOnMfaRequired: false,
        },
      }}
      onSuccess={(user) => {
        // Login success — no console output in production
        onLoginSuccess?.(user);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <PrivyAuthWrapper onLoginError={onLoginError}>
            {children}
          </PrivyAuthWrapper>
        </WagmiProvider>
      </QueryClientProvider>
    </BasePrivyProvider>
  );
}

/**
 * Internal wrapper to handle login errors
 */
function PrivyAuthWrapper({
  children,
  onLoginError,
}: {
  children: ReactNode;
  onLoginError?: (error: Error) => void;
}) {
  const { ready } = usePrivy();

  // Handle initialization errors
  React.useEffect(() => {
    if (!ready) {
      // You can add custom error handling here
    }
  }, [ready, onLoginError]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthBaseProvider;
