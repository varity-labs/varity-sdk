/**
 * BuyUSDCButton - Simple button to buy USDC with fiat
 *
 * Opens Thirdweb Pay widget for credit card purchases
 * Supports credit card, debit card, Apple Pay, Google Pay
 *
 * @example
 * ```tsx
 * <BuyUSDCButton
 *   walletAddress="0x..."
 *   amount={100}
 *   onSuccess={(tx) => console.log('Purchase complete:', tx)}
 * />
 * ```
 */

import React, { useState } from 'react';
import { PayEmbed } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet, VARITY_USDC_ADDRESS } from '../../config/chains';

export interface BuyUSDCButtonProps {
  walletAddress: string;
  amount?: number;
  onSuccess?: (transaction: any) => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  className?: string;
  clientId: string;
}

export function BuyUSDCButton({
  walletAddress,
  amount = 100,
  onSuccess: _onSuccess,
  onError: _onError,
  buttonText = 'Buy USDC',
  className,
  clientId
}: BuyUSDCButtonProps) {
  const [showWidget, setShowWidget] = useState(false);

  const client = React.useMemo(
    () => createThirdwebClient({ clientId }),
    [clientId]
  );

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

  const handleClick = () => {
    setShowWidget(true);
  };

  if (showWidget) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
          <button
            onClick={() => setShowWidget(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="text-xl font-bold mb-4">Buy USDC</h3>

          <PayEmbed
            client={client}
            theme="light"
            payOptions={{
              mode: 'fund_wallet',
              prefillBuy: {
                chain: varityL3Testnet,
                amount: amount.toString(),
                token: {
                  // Use actual USDC contract address on Varity L3
                  address: VARITY_USDC_ADDRESS,
                  name: 'USDC',
                  symbol: 'USDC',
                },
                allowEdits: {
                  amount: true,
                  token: false,
                  chain: false,
                },
              },
              metadata: {
                name: 'Buy USDC on Varity L3',
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!walletAddress}
      className={className || defaultClassName}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      {buttonText}
    </button>
  );
}
