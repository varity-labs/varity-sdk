import React, { ReactNode } from 'react';
import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { THIRDWEB_CLIENT_ID, DEFAULT_CHAIN, SUPPORTED_CHAINS } from '../config/chains';
// Note: CSS should be imported by the consuming application
// import '../styles/globals.css';

export interface VarityProviderProps {
  children: ReactNode;
  clientId?: string;
  activeChain?: typeof DEFAULT_CHAIN;
  supportedChains?: typeof SUPPORTED_CHAINS;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Main provider wrapper for Varity applications
 *
 * This component wraps your application with all necessary Web3 providers:
 * - Thirdweb client for wallet connections
 * - Chain configuration for Varity L3
 * - Theme management (light/dark mode)
 *
 * @example
 * ```tsx
 * import { VarityProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <VarityProvider>
 *       <YourApp />
 *     </VarityProvider>
 *   );
 * }
 * ```
 */
export function VarityProvider({
  children,
  clientId = THIRDWEB_CLIENT_ID,
  activeChain = DEFAULT_CHAIN,
  supportedChains = SUPPORTED_CHAINS,
  theme = 'system',
}: VarityProviderProps): JSX.Element {
  // Create Thirdweb client
  const client = React.useMemo(
    () => createThirdwebClient({ clientId }),
    [clientId]
  );

  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      updateTheme();
      mediaQuery.addEventListener('change', updateTheme);

      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}
