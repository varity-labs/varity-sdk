'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { arbitrumSepolia, arbitrum } from 'viem/chains';
import { createConfig } from 'wagmi';
import { WalletSyncProvider, useWalletSync, WalletSyncState } from './WalletSyncProvider';

/**
 * Varity L3 Chain Configuration (Arbitrum Orbit Testnet)
 * CRITICAL: Uses correct RPC URL for Conduit deployment
 */
const varityL3Testnet = {
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
const wagmiConfig = createConfig({
  chains: [varityL3Testnet, arbitrumSepolia, arbitrum],
  transports: {
    [varityL3Testnet.id]: http(),
    [arbitrumSepolia.id]: http(),
    [arbitrum.id]: http(),
  },
});

// Create React Query client
const queryClient = new QueryClient();

/**
 * InitializingScreen - Shows while authentication providers initialize
 */
function InitializingScreen({ logo }: { logo?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            {logo && (
              <img
                src={logo}
                alt="Logo"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8"
              />
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Initializing Dashboard...</h1>
        <p className="text-gray-600 mb-4">
          Setting up authentication and services.
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 text-green-500">&#10003;</span>
            Loading authentication
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 text-green-500">&#10003;</span>
            Connecting to Varity
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 text-green-500">&#10003;</span>
            Preparing your session
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * InitTimeoutScreen - Shows if initialization takes too long
 */
function InitTimeoutScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">&#9201;</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Taking Longer Than Expected</h1>
        <p className="text-gray-600 mb-4">
          The authentication services are taking longer than usual to initialize.
        </p>
        <ul className="text-sm text-gray-700 space-y-2 mb-4">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">&#8226;</span>
            <span>Check your internet connection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">&#8226;</span>
            <span>Services may be experiencing delays</span>
          </li>
        </ul>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ConfigErrorScreen - Shows when required env vars are missing
 */
function ConfigErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">&#9888;</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuration Error</h1>
        <p className="text-gray-600 mb-4">
          Missing required configuration: <strong>{error}</strong>
        </p>
        <ul className="text-sm text-gray-700 space-y-2 mb-4">
          <li>&#8226; Check your .env.local file</li>
          <li>&#8226; Ensure all environment variables are set</li>
          <li>&#8226; Restart the development server</li>
        </ul>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * PrivyReadyGate - Waits for Privy to be ready before rendering children
 */
function PrivyReadyGate({
  children,
  logo,
  initTimeout = 10000,
}: {
  children: React.ReactNode;
  logo?: string;
  initTimeout?: number;
}) {
  const { ready } = usePrivy();
  const [showTimeoutScreen, setShowTimeoutScreen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!ready) {
        setShowTimeoutScreen(true);
      }
    }, initTimeout);

    return () => clearTimeout(timeout);
  }, [ready, initTimeout]);

  if (ready) {
    return <>{children}</>;
  }

  if (showTimeoutScreen) {
    return (
      <InitTimeoutScreen
        onRetry={() => setShowTimeoutScreen(false)}
      />
    );
  }

  return <InitializingScreen logo={logo} />;
}

export interface VarityDashboardProviderProps {
  children: ReactNode;
  /**
   * Privy App ID (from Privy Dashboard)
   * Can also be set via NEXT_PUBLIC_PRIVY_APP_ID environment variable
   */
  privyAppId?: string;
  /**
   * Appearance configuration
   */
  appearance?: {
    theme?: 'light' | 'dark';
    accentColor?: `#${string}`;
    logo?: string;
  };
  /**
   * Login methods to enable
   * @default ['email', 'google', 'wallet']
   */
  loginMethods?: ('email' | 'google' | 'twitter' | 'discord' | 'github' | 'wallet' | 'sms')[];
  /**
   * Initialization timeout in milliseconds
   * @default 10000
   */
  initTimeout?: number;
  /**
   * Callback when wallet address changes
   */
  onAddressChange?: (address: string | null) => void;
  /**
   * Callback when wallet sync state changes
   */
  onWalletSyncChange?: (state: WalletSyncState) => void;
  /**
   * Custom error boundary component
   */
  errorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * VarityDashboardProvider - Complete provider setup for Varity dashboards
 *
 * Combines:
 * - Privy (authentication: email, social login)
 * - React Query (data fetching)
 * - Loading states and error handling
 *
 * Features:
 * - Email and social login for all users
 * - Zero-config with dev credentials
 * - Professional loading and error screens
 * - Customizable appearance
 *
 * @example
 * ```tsx
 * import { VarityDashboardProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <VarityDashboardProvider
 *       privyAppId="your-privy-app-id"
 *       appearance={{
 *         theme: 'light',
 *         accentColor: '#2563EB',
 *         logo: '/logo.png'
 *       }}
 *     >
 *       <YourDashboard />
 *     </VarityDashboardProvider>
 *   );
 * }
 * ```
 */
export function VarityDashboardProvider({
  children,
  privyAppId,
  appearance = {
    theme: 'light',
    accentColor: '#2563EB',
  },
  loginMethods = ['email', 'google', 'wallet'],
  initTimeout = 10000,
  onAddressChange,
  onWalletSyncChange,
  errorBoundary: ErrorBoundary,
}: VarityDashboardProviderProps) {
  // Get config from props or environment variables
  const appId = privyAppId || process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Validate required config
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) {
      setConfigError('Privy App ID is required (pass privyAppId prop or set NEXT_PUBLIC_PRIVY_APP_ID)');
    } else {
      setConfigError(null);
    }
  }, [appId]);

  // Show config error
  if (configError) {
    return <ConfigErrorScreen error={configError} />;
  }

  const content = (
    <PrivyProvider
      appId={appId!}
      config={{
        loginMethods,
        appearance: {
          theme: appearance.theme,
          accentColor: appearance.accentColor,
          logo: appearance.logo,
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: varityL3Testnet,
        supportedChains: [varityL3Testnet, arbitrumSepolia, arbitrum],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <PrivyReadyGate logo={appearance.logo} initTimeout={initTimeout}>
            <WalletSyncProvider
              onAddressChange={onAddressChange}
              onSyncStateChange={onWalletSyncChange}
            >
              {children}
            </WalletSyncProvider>
          </PrivyReadyGate>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );

  // Wrap with error boundary if provided
  if (ErrorBoundary) {
    return <ErrorBoundary>{content}</ErrorBoundary>;
  }

  return content;
}

// Re-export hooks for convenience
export { useWalletSync };
export type { WalletSyncState };

export default VarityDashboardProvider;
