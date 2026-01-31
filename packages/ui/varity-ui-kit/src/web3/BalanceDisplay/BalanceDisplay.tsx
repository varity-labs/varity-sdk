import React from 'react';
import { formatUSDC } from '../../config/chains';

export interface BalanceDisplayProps {
  balance: bigint | string | number;
  showSymbol?: boolean;
  decimals?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Balance Display Component
 *
 * Formats and displays USDC balance with proper 6-decimal formatting
 *
 * @example
 * ```tsx
 * import { BalanceDisplay } from '@varity-labs/ui-kit';
 *
 * function Portfolio() {
 *   return (
 *     <BalanceDisplay
 *       balance={BigInt(1500000000)} // 1,500 USDC
 *       showSymbol
 *       decimals={2}
 *       size="lg"
 *     />
 *   );
 * }
 * ```
 */
export function BalanceDisplay({
  balance,
  showSymbol = true,
  decimals = 2,
  className = '',
  size = 'md',
}: BalanceDisplayProps): JSX.Element {
  const formattedBalance = formatUSDC(balance, decimals);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className={`font-semibold ${sizeClasses[size]}`}>
        {formattedBalance}
      </span>
      {showSymbol && (
        <span className="text-sm text-gray-600 dark:text-gray-400">USDC</span>
      )}
    </div>
  );
}
