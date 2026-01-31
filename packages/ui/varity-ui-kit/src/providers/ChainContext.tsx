import React, { createContext, useContext, ReactNode } from 'react';
import { useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from '../config/chains';
import type { Chain } from 'thirdweb/chains';

export interface ChainContextValue {
  activeChain: Chain | undefined;
  supportedChains: Chain[];
  switchChain: (chainId: number) => Promise<void>;
  isCorrectChain: boolean;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export interface ChainProviderProps {
  children: ReactNode;
  supportedChains?: Chain[];
  defaultChain?: Chain;
  onChainChange?: (chainId: number) => void;
}

/**
 * Chain state management provider
 *
 * Manages blockchain network state and provides utilities for:
 * - Accessing current chain
 * - Switching between chains
 * - Validating chain compatibility
 *
 * @example
 * ```tsx
 * import { ChainProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <ChainProvider
 *       onChainChange={(chainId) => console.log('Chain changed to:', chainId)}
 *     >
 *       <YourApp />
 *     </ChainProvider>
 *   );
 * }
 * ```
 */
export function ChainProvider({
  children,
  supportedChains = SUPPORTED_CHAINS,
  defaultChain = DEFAULT_CHAIN,
  onChainChange,
}: ChainProviderProps): JSX.Element {
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const isCorrectChain = React.useMemo(() => {
    if (!activeChain) return false;
    return supportedChains.some((chain) => chain.id === activeChain.id);
  }, [activeChain, supportedChains]);

  const handleSwitchChain = React.useCallback(
    async (chainId: number) => {
      const targetChain = supportedChains.find((c) => c.id === chainId);
      if (!targetChain) {
        throw new Error(`Chain ${chainId} is not supported`);
      }

      try {
        await switchChain(targetChain);
        if (onChainChange) {
          onChainChange(chainId);
        }
      } catch (error) {
        console.error('Error switching chain:', error);
        throw error;
      }
    },
    [supportedChains, switchChain, onChainChange]
  );

  const value: ChainContextValue = {
    activeChain,
    supportedChains,
    switchChain: handleSwitchChain,
    isCorrectChain,
  };

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

/**
 * Hook to access chain context
 *
 * @returns {ChainContextValue} Chain state and utilities
 * @throws {Error} If used outside ChainProvider
 *
 * @example
 * ```tsx
 * import { useChain } from '@varity-labs/ui-kit';
 *
 * function MyComponent() {
 *   const { activeChain, switchChain, isCorrectChain } = useChain();
 *
 *   if (!isCorrectChain) {
 *     return (
 *       <button onClick={() => switchChain(33529)}>
 *         Switch to Varity L3
 *       </button>
 *     );
 *   }
 *
 *   return <p>Connected to: {activeChain?.name}</p>;
 * }
 * ```
 */
export function useChain(): ChainContextValue {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within ChainProvider');
  }
  return context;
}
