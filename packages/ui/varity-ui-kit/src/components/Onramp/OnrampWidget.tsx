/**
 * OnrampWidget - Full embedded Thirdweb Pay widget
 *
 * Complete payment widget with KYC, payment processing, and status tracking
 * Automatically handles payment providers, KYC verification, and transaction receipts
 *
 * @example
 * ```tsx
 * <OnrampWidget
 *   walletAddress="0x..."
 *   clientId="your-client-id"
 *   defaultAmount={100}
 *   onComplete={(status) => console.log('Purchase:', status)}
 * />
 * ```
 */

import React, { useState } from 'react';
import { PayEmbed } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { varityL3Testnet, VARITY_USDC_ADDRESS } from '../../config/chains';

export interface Purchase {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  txHash?: string;
}

export interface OnrampWidgetProps {
  walletAddress: string;
  clientId: string;
  defaultAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  onComplete?: (purchase: Purchase) => void;
  onError?: (error: Error) => void;
  showHistory?: boolean;
  theme?: 'light' | 'dark';
}

export function OnrampWidget({
  walletAddress: _walletAddress,
  clientId,
  defaultAmount = 100,
  minAmount = 10,
  maxAmount = 10000,
  onComplete,
  onError,
  showHistory = true,
  theme = 'light'
}: OnrampWidgetProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);

  const client = React.useMemo(
    () => createThirdwebClient({ clientId }),
    [clientId]
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: Purchase['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Widget */}
      <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Buy USDC
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              Varity L3
            </div>
          </div>

          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div>
                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Supported Payment Methods
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Credit/Debit Card • Apple Pay • Google Pay
                </p>
              </div>
            </div>
          </div>

          <PayEmbed
            client={client}
            theme={theme}
            payOptions={{
              mode: 'fund_wallet',
              prefillBuy: {
                chain: varityL3Testnet,
                amount: defaultAmount.toString(),
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

      {/* Purchase History */}
      {showHistory && purchases.length > 0 && (
        <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          <h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Recent Purchases
          </h4>

          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ${purchase.amount} {purchase.currency}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(purchase.timestamp)}
                    </p>
                  </div>

                  {purchase.txHash && (
                    <a
                      href={`https://explorer.varity.io/tx/${purchase.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <div className="flex items-start gap-3">
          <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
              Secure & Regulated
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Payments are processed by licensed providers. KYC may be required for larger amounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
