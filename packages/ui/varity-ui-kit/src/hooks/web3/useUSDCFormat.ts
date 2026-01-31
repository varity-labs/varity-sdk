import { useMemo, useCallback } from 'react';
import { formatUSDC, parseUSDC, USDC_DECIMALS } from '../../config/chains';

export interface UseUSDCFormatReturn {
  format: (amount: bigint | string | number, decimals?: number) => string;
  parse: (amount: string | number) => bigint;
  decimals: number;
}

/**
 * Hook for USDC formatting utilities
 *
 * Provides utilities for formatting and parsing USDC amounts with 6 decimals:
 * - Format bigint to human-readable string
 * - Parse string to bigint
 * - Access USDC decimals constant
 *
 * @returns {UseUSDCFormatReturn} USDC formatting utilities
 *
 * @example
 * ```tsx
 * import { useUSDCFormat } from '@varity-labs/ui-kit';
 *
 * function BalanceCard() {
 *   const { format, parse, decimals } = useUSDCFormat();
 *
 *   const balance = BigInt(1500000000); // 1500 USDC
 *   const formatted = format(balance, 2); // "1500.00"
 *
 *   const amount = "100.50";
 *   const parsed = parse(amount); // BigInt(100500000)
 *
 *   return <div>Balance: {formatted} USDC</div>;
 * }
 * ```
 */
export function useUSDCFormat(): UseUSDCFormatReturn {
  const format = useCallback((amount: bigint | string | number, decimals = 2) => {
    return formatUSDC(amount, decimals);
  }, []);

  const parse = useCallback((amount: string | number) => {
    return parseUSDC(amount);
  }, []);

  return useMemo(
    () => ({
      format,
      parse,
      decimals: USDC_DECIMALS,
    }),
    [format, parse]
  );
}
