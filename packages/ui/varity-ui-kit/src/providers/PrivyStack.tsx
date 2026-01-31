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
 * Convert thirdweb Chain to Privy Chain format
 */
function toPrivyChain(chain: Chain): PrivyChain {
  return {
    id: chain.id,
    name: chain.name || `Chain ${chain.id}`,
    network: chain.network || `chain-${chain.id}`,
    nativeCurrency: chain.nativeCurrency || {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: chain.rpcUrls || {
      default: { http: [chain.rpc] },
      public: { http: [chain.rpc] },
    },
    blockExplorers: chain.blockExplorers,
    testnet: chain.testnet,
  } as PrivyChain;
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
 * PrivyStack - All-in-one provider for Privy + thirdweb + Varity L3
 *
 * This component combines all necessary providers in the correct order:
 * 1. QueryClientProvider - For React Query (required by Privy)
 * 2. PrivyProvider - Authentication (email, social, wallet)
 * 3. PrivyReadyGate - Prevents blank screen during initialization
 * 4. ThirdwebProvider - Wallet management and contracts
 * 5. WalletSyncProvider - Syncs Privy embedded wallets with thirdweb
 *
 * **Production Pattern**: Extracted from generic-template-dashboard production deployment
 *
 * **Key Features**:
 * - No blank screen during initialization (PrivyReadyGate)
 * - Seamless wallet sync between Privy and thirdweb
 * - Support for email/social login (embedded wallets)
 * - Support for external wallets (MetaMask, WalletConnect, etc.)
 * - Optimized for Varity L3 by default
 *
 * **Stack Order** (critical - do not change):
 * ```
 * QueryClientProvider         # React Query for data fetching
 *   └─ PrivyProvider           # Authentication layer
 *       └─ PrivyReadyGate       # Loading state management
 *           └─ ThirdwebProvider # Blockchain operations
 *               └─ WalletSyncProvider # Wallet synchronization
 *                   └─ YourApp       # Your application
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

  // Use Varity L3 Testnet as default chain if none provided
  const supportedChains = React.useMemo((): PrivyChain[] => {
    if (chains && chains.length > 0) {
      return chains.map(toPrivyChain);
    }
    // Default to Varity L3 Testnet
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
      } as PrivyChain,
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
          supportedChains,
          defaultChain: supportedChains[0],
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
