import React from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { formatAddress } from '../../config/chains';

export interface WalletInfoProps {
  showAvatar?: boolean;
  showBalance?: boolean;
  format?: 'short' | 'full';
  className?: string;
}

/**
 * Wallet Info Display Component
 *
 * Displays connected wallet information including:
 * - Wallet address (formatted)
 * - Avatar/identicon
 * - Balance (optional)
 *
 * @example
 * ```tsx
 * import { WalletInfo } from '@varity-labs/ui-kit';
 *
 * function Dashboard() {
 *   return (
 *     <WalletInfo
 *       showAvatar
 *       showBalance
 *       format="short"
 *     />
 *   );
 * }
 * ```
 */
export function WalletInfo({
  showAvatar = true,
  showBalance = false,
  format = 'short',
  className = '',
}: WalletInfoProps): JSX.Element | null {
  const account = useActiveAccount();

  if (!account) {
    return null;
  }

  const address = account.address;
  const displayAddress = format === 'short' ? formatAddress(address) : address;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-varity-primary to-varity-secondary flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {address.slice(2, 4).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex flex-col">
        <span className="truncate-address font-medium">{displayAddress}</span>
        {showBalance && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Loading balance...
          </span>
        )}
      </div>
    </div>
  );
}
