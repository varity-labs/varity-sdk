import React, { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReadyGate } from '../components/Privy/PrivyReadyGate';
import { WalletSyncProvider } from './WalletSyncProvider';
import { VARITY_DEV_CREDENTIALS } from '@varity-labs/sdk';

/**
 * Simple chain configuration type (Varity internal — no external dependency required)
 */
export interface Chain {
  id: number;
  rpc: string;
  name?: string;
  testnet?: boolean;
}

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
 * Convert Varity Chain to Privy Chain format
 */
function toPrivyChain(chain: Chain): PrivyChainConfig {
  return {
    id: chain.id,
    name: chain.name || `Chain ${chain.id}`,
    network: `chain-${chain.id}`,
    nativeCurrency: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
    },
    rpcUrls: {
      default: { http: [chain.rpc] },
      public: { http: [chain.rpc] },
    },
    testnet: chain.testnet,
  };
}

export interface AuthProviderProps {
  /**
   * Your Varity auth app ID.
   *
   * Optional — defaults to shared development credentials (VARITY_DEV_CREDENTIALS).
   * For production, `varitykit deploy` injects the correct value automatically.
   * You never need to sign up for any external service.
   */
  appId?: string;
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
   * @default ['email', 'google']
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
   * Callback when user address changes
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
 * @example Production setup (varitykit deploy injects appId automatically)
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <PrivyStack appId={process.env.NEXT_PUBLIC_VARITY_AUTH_ID}>
 *       <YourApp />
 *     </PrivyStack>
 *   );
 * }
 * ```
 *
 * @example With appearance customization
 * ```tsx
 * import { PrivyStack } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <PrivyStack
 *       loginMethods={['email', 'google']}
 *       appearance={{
 *         theme: 'light',
 *         accentColor: '#2563EB',
 *         logo: '/logo.png'
 *       }}
 *       onAddressChange={(address) => {
 *         console.log('User address changed:', address);
 *       }}
 *     >
 *       <YourApp />
 *     </PrivyStack>
 *   );
 * }
 * ```
 */
export function AuthProvider({
  appId,
  chains,
  children,
  loginMethods = ['email', 'google'],
  appearance = {
    theme: 'light',
    accentColor: '#2563EB',
  },
  onAddressChange,
}: AuthProviderProps): JSX.Element {
  // Resolve auth app ID — fall back to shared dev credentials automatically
  const resolvedAppId = React.useMemo(
    () => appId || VARITY_DEV_CREDENTIALS.privy.appId,
    [appId]
  );

  // Use Varity default chain if none provided
  const supportedChains = React.useMemo((): PrivyChainConfig[] => {
    if (chains && chains.length > 0) {
      return chains.map(toPrivyChain);
    }
    // Default Varity chain configuration
    return [
      {
        id: 33529,
        name: 'Varity Testnet',
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
        appId={resolvedAppId}
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
        <ReadyGate>
          <WalletSyncProvider onAddressChange={onAddressChange}>
            {children}
          </WalletSyncProvider>
        </ReadyGate>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

export default AuthProvider;
