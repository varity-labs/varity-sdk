import React, { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient, type Chain } from 'thirdweb';
import { PrivyReadyGate } from '../components/Privy/PrivyReadyGate';
import { WalletSyncProvider } from './WalletSyncProvider';
import { resolveCredentials, VARITY_DEV_CREDENTIALS } from '@varity-labs/sdk';

/**
 * Create React Query client (memoized singleton)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Privy chain configuration format (matches Privy's expected structure)
 */
interface PrivyChainConfig {
  id: number;
  name: string;
  network: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers?: Record<string, { name: string; url: string }>;
  testnet?: boolean;
}

/**
 * Convert thirdweb Chain to Privy Chain format
 */
function toPrivyChain(chain: Chain): PrivyChainConfig {
  return {
    id: chain.id,
    name: chain.name || `Chain ${chain.id}`,
    network: `chain-${chain.id}`,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [chain.rpc] },
      public: { http: [chain.rpc] },
    },
    testnet: chain.testnet,
  };
}

export interface PrivyStackProps {
  /**
   * Your Privy app ID from https://dashboard.privy.io
   *
   * Optional - defaults to shared development credentials (VARITY_DEV_CREDENTIALS).
   * For production, provide your own credentials.
   *
   * @see https://dashboard.privy.io
   */
  appId?: string;
  /**
   * Your thirdweb client ID from https://thirdweb.com/dashboard
   *
   * Optional - defaults to shared development credentials (VARITY_DEV_CREDENTIALS).
   * For production, provide your own credentials.
   *
   * @see https://thirdweb.com/dashboard
   */
  thirdwebClientId?: string;
  /**
   * Chains to support
   * @default [varityL3Testnet]
   */
  chains?: Chain[];
  /**
   * The children to render once providers are ready
   */
  children: ReactNode;
  /**
   * Login methods to enable
   * @default ['email', 'google', 'wallet']
   */
  loginMethods?: Array<'email' | 'wallet' | 'google' | 'twitter' | 'discord' | 'github' | 'apple' | 'linkedin' | 'sms'>;
  /**
   * Appearance configuration
   */
  appearance?: {
    theme?: 'light' | 'dark';
    accentColor?: string;
    logo?: string;
  };
  /**
   * Callback when wallet address changes
   */
  onAddressChange?: (address: string | null) => void;
}

/**
 * PrivyStack - All-in-one authentication and provider setup for Varity apps
 *
 * This component combines all necessary providers in the correct order:
 * 1. QueryClientProvider - For React Query (data fetching)
 * 2. PrivyProvider - Authentication (email, social login)
 * 3. PrivyReadyGate - Prevents blank screen during initialization
 *
 * **Production Pattern**: Extracted from generic-template-dashboard production deployment
 *
 * **Key Features**:
 * - No blank screen during initialization (PrivyReadyGate)
 * - Zero-config with shared development credentials
 * - Support for email/social login
 * - Professional loading and timeout screens
 * - Optimized for Varity by default
 *
 * **Stack Order** (critical - do not change):
 * ```
 * QueryClientProvider         # React Query for data fetching
 *   └─ PrivyProvider           # Authentication layer
 *       └─ PrivyReadyGate       # Loading state management
 *           └─ YourApp          # Your application
 * ```
 *
 * @example Zero-config setup (uses shared dev credentials)
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <PrivyStack>
 *       <YourApp />
 *     </PrivyStack>
 *   );
 * }
 * ```
 *
 * @example Production setup with custom credentials
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <PrivyStack
 *       appId={process.env.PRIVY_APP_ID}
 *       thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
 *     >
 *       <YourApp />
 *     </PrivyStack>
 *   );
 * }
 * ```
 *
 * @example With custom chains and appearance
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 * import { varityL3Testnet, arbitrumSepolia } from '@varity-labs/sdk';
 *
 * function App() {
 *   return (
 *     <PrivyStack
 *       appId={process.env.PRIVY_APP_ID}
 *       thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
 *       chains={[varityL3Testnet, arbitrumSepolia]}
 *       loginMethods={['email', 'google', 'wallet']}
 *       appearance={{
 *         theme: 'light',
 *         accentColor: '#2563EB',
 *         logo: '/logo.png'
 *       }}
 *       onAddressChange={(address) => {
 *         console.log('Wallet connected:', address);
 *       }}
 *     >
 *       <YourApp />
 *     </PrivyStack>
 *   );
 * }
 * ```
 *
 * @example With wallet address tracking
 * ```tsx
 * <PrivyStack
 *   appId={process.env.PRIVY_APP_ID}
 *   thirdwebClientId={process.env.THIRDWEB_CLIENT_ID}
 *   onAddressChange={(address) => {
 *     if (address) {
 *       // User connected wallet
 *       localStorage.setItem('wallet_address', address);
 *     } else {
 *       // User disconnected
 *       localStorage.removeItem('wallet_address');
 *     }
 *   }}
 * >
 *   <YourApp />
 * </PrivyStack>
 * ```
 */
export function PrivyStack({
  appId,
  thirdwebClientId,
  chains,
  children,
  loginMethods = ['email', 'google', 'wallet'],
  appearance = {
    theme: 'light',
    accentColor: '#2563EB',
  },
  onAddressChange,
}: PrivyStackProps): JSX.Element {
  // Resolve credentials with fallback to VARITY_DEV_CREDENTIALS
  const credentials = React.useMemo(() => {
    return resolveCredentials(
      appId || VARITY_DEV_CREDENTIALS.privy.appId,
      thirdwebClientId || VARITY_DEV_CREDENTIALS.thirdweb.clientId
    );
  }, [appId, thirdwebClientId]);

  // Use Varity default chain if none provided
  const supportedChains = React.useMemo((): PrivyChainConfig[] => {
    if (chains && chains.length > 0) {
      return chains.map(toPrivyChain);
    }
    // Default Varity chain configuration
    return [
      {
        id: 33529,
        name: 'Varity L3 Testnet',
        network: 'varity-testnet',
        nativeCurrency: {
          name: 'USDC',
          symbol: 'USDC',
          decimals: 6,
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
      },
    ];
  }, [chains]);

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={credentials.privy.appId}
        config={{
          loginMethods,
          appearance: {
            theme: appearance.theme || 'light',
            accentColor: (appearance.accentColor || '#2563EB') as `#${string}`,
            logo: appearance.logo,
          },
          supportedChains: supportedChains as any,
          defaultChain: supportedChains[0] as any,
        }}
      >
        <PrivyReadyGate>
          <ThirdwebProvider>
            <WalletSyncProvider onAddressChange={onAddressChange}>
              {children}
            </WalletSyncProvider>
          </ThirdwebProvider>
        </PrivyReadyGate>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

export default PrivyStack;
