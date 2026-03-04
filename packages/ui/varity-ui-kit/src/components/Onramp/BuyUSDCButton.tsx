/**
 * BuyUSDCButton - Button to buy USDC with fiat via Privy onramp
 *
 * Opens Privy's funding modal for credit card purchases
 * Supports credit card, debit card, Apple Pay, Google Pay
 * Targets Arbitrum One (mainnet) for real USDC
 *
 * @example
 * ```tsx
 * <BuyUSDCButton
 *   walletAddress="0x..."
 *   amount={100}
 *   onSuccess={() => console.log('Funding initiated')}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import { useFundWallet } from '@privy-io/react-auth';
import { arbitrum } from 'viem/chains';

export interface BuyUSDCButtonProps {
  walletAddress: string;
  amount?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  className?: string;
  /** @deprecated clientId is no longer needed — Privy uses the app-level config */
  clientId?: string;
}

export function BuyUSDCButton({
  walletAddress,
  amount = 100,
  onSuccess,
  onError,
  buttonText = 'Buy USDC',
  className,
}: BuyUSDCButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { fundWallet } = useFundWallet();

  const defaultClassName = `
    px-6 py-3
    bg-gradient-to-r from-blue-600 to-indigo-600
    hover:from-blue-700 hover:to-indigo-700
    text-white font-semibold rounded-lg
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
    shadow-lg hover:shadow-xl
  `;

  const handleClick = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      await fundWallet(walletAddress, {
        chain: arbitrum,
        asset: 'USDC',
        amount: amount.toString(),
      });
      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Funding failed');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, amount, fundWallet, onSuccess, onError]);

  return (
    <button
      onClick={handleClick}
      disabled={!walletAddress || isLoading}
      className={className || defaultClassName}
    >
      {isLoading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )}
      {isLoading ? 'Opening...' : buttonText}
    </button>
  );
}
