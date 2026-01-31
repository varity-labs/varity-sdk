import React from 'react';
import { useActiveAccount, useWalletBalance } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { THIRDWEB_CLIENT_ID, DEFAULT_CHAIN, formatUSDC } from '../../config/chains';

export interface WalletBalanceProps {
  showSymbol?: boolean;
  decimals?: number;
  className?: string;
  loadingText?: string;
}

/**
 * Wallet Balance Display Component
 *
 * Displays wallet USDC balance with automatic formatting (6 decimals)
 *
 * @example
 * ```tsx
 * import { WalletBalance } from '@varity-labs/ui-kit';
 *
 * function Balance() {
 *   return (
 *     <WalletBalance
 *       showSymbol
 *       decimals={2}
 *     />
 *   );
 * }
 * ```
 */
export function WalletBalance({
  showSymbol = true,
  decimals = 2,
  className = '',
  loadingText = 'Loading...',
}: WalletBalanceProps): JSX.Element | null {
  const account = useActiveAccount();
  const client = React.useMemo(
    () => createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID }),
    []
  );

  const { data: balance, isLoading, error } = useWalletBalance({
    client,
    chain: DEFAULT_CHAIN,
    address: account?.address,
  });

  if (!account) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-varity-primary" />
        <span className="text-sm text-gray-500">{loadingText}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        Error loading balance
      </div>
    );
  }

  const balanceValue = balance?.value || BigInt(0);
  const formattedBalance = formatUSDC(balanceValue, decimals);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-lg font-semibold">{formattedBalance}</span>
      {showSymbol && (
        <span className="text-sm text-gray-600 dark:text-gray-400">USDC</span>
      )}
    </div>
  );
}
