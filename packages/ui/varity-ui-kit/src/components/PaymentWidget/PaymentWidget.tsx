/**
 * PaymentWidget Component
 *
 * Mandatory component for developer apps to charge end-users.
 * All payments go through the VarityPayments contract with 90/10 revenue split:
 * - 90% to developer
 * - 10% to Varity treasury
 *
 * Uses ERC-20 USDC approve + purchaseApp on Arbitrum One (mainnet).
 * thirdweb TransactionButton + payModal handles credit card payments.
 *
 * @example
 * ```tsx
 * import { PaymentWidget } from '@varity/ui-kit';
 *
 * <PaymentWidget appId={123} price={9900}>
 *   <button>Buy Premium - $99</button>
 * </PaymentWidget>
 * ```
 */

import React, { useState, useEffect } from 'react';
import { TransactionButton, useActiveAccount } from 'thirdweb/react';
import { prepareContractCall, getContract, readContract } from 'thirdweb';
import { approve } from 'thirdweb/extensions/erc20';
import { PaymentWidgetProps } from './types';
import { useVarityPayment } from './useVarityPayment';

/** Arbitrum One USDC contract address */
const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

/**
 * PaymentWidget - Mandatory component for app monetization
 *
 * Wraps a trigger element and handles the purchase flow.
 * Automatically checks USDC allowance — skips authorize step if sufficient.
 */
export const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  appId,
  price,
  type = 'one-time',
  intervalDays = 30,
  onSuccess,
  onCancel,
  onError,
  theme = 'dark',
  className = '',
  children,
  disabled = false,
}) => {
  const {
    hasPurchased,
    isLoading,
    pricing,
  } = useVarityPayment({ appId });

  const account = useActiveAccount();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasAllowance, setHasAllowance] = useState<boolean | null>(null);

  // Get payment contract address
  const paymentsAddress = (
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VARITY_PAYMENTS_ADDRESS
      ? process.env.NEXT_PUBLIC_VARITY_PAYMENTS_ADDRESS
      : '0x0568cf3b5b9c94542aa8d32eb51ffa38912fc48c'
  );

  // Amount needed in raw USDC units
  const amountNeeded = pricing?.priceUsdc
    ? pricing.priceUsdc
    : price
    ? BigInt(price * 10000) // cents * 10000 = USDC units (6 decimals)
    : BigInt(0);

  // Check USDC allowance on mount — skip authorize step if sufficient
  useEffect(() => {
    if (!account?.address || amountNeeded === BigInt(0)) {
      setHasAllowance(false);
      return;
    }
    const checkAllowance = async () => {
      try {
        const { createThirdwebClient, defineChain } = await import('thirdweb');
        const client = createThirdwebClient({
          clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
        });
        const chain = defineChain(42161);
        const usdcContract = getContract({ client, chain, address: USDC_ADDRESS });
        const currentAllowance = await readContract({
          contract: usdcContract,
          method: 'function allowance(address owner, address spender) view returns (uint256)',
          params: [account.address, paymentsAddress],
        });
        setHasAllowance(BigInt(currentAllowance.toString()) >= amountNeeded);
      } catch {
        setHasAllowance(false);
      }
    };
    checkAllowance();
  }, [account?.address, amountNeeded, paymentsAddress]);

  // Format price for display
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const displayPrice = price
    ? formatPrice(price)
    : pricing?.priceUsdc
    ? `$${(Number(pricing.priceUsdc) / 1_000_000).toFixed(2)}`
    : null;

  // Already purchased
  if (hasPurchased && !isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 text-green-500 ${className}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Purchased</span>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return <div className={className}>{children}</div>;
  }

  // No pricing set
  if (!pricing?.isActive) {
    return null;
  }

  // Helper to get thirdweb client and chain
  const getClientAndChain = async () => {
    const { createThirdwebClient, defineChain } = await import('thirdweb');
    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
    });
    const chain = defineChain(42161); // Arbitrum One
    return { client, chain };
  };

  const approveAmount = pricing?.priceUsdc
    ? Number(pricing.priceUsdc) / 1_000_000 // raw units → dollars
    : (price || 0) / 100; // cents → dollars

  const needsAuthorization = hasAllowance === false && !isAuthorized;

  if (needsAuthorization) {
    // Step 1: Authorize payment (sets USDC allowance)
    return (
      <TransactionButton
        transaction={async () => {
          const { client, chain } = await getClientAndChain();
          const usdcContract = getContract({ client, chain, address: USDC_ADDRESS });
          return approve({
            contract: usdcContract,
            spender: paymentsAddress,
            amount: approveAmount, // dollars — thirdweb handles decimals
          });
        }}
        onTransactionConfirmed={() => {
          setIsAuthorized(true);
        }}
        onError={(error) => {
          onError?.(error as Error);
        }}
        payModal={{
          theme: theme === 'dark' ? 'dark' : 'light',
          metadata: {
            name: `Authorize ${displayPrice} Payment`,
            image: '/logo/varity-logo-color.svg',
          },
        }}
        className={className}
        disabled={disabled}
      >
        {children}
      </TransactionButton>
    );
  }

  // Step 2 (or only step if allowance exists): Complete purchase
  return (
    <TransactionButton
      transaction={async () => {
        const { client, chain } = await getClientAndChain();
        const contract = getContract({ client, chain, address: paymentsAddress });
        return prepareContractCall({
          contract,
          method: {
            name: 'purchaseApp',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'appId', type: 'uint64' }],
            outputs: [],
          },
          params: [BigInt(appId)],
        });
      }}
      onTransactionConfirmed={(receipt) => {
        onSuccess?.(receipt.transactionHash);
      }}
      onError={(error) => {
        onError?.(error as Error);
      }}
      payModal={{
        theme: theme === 'dark' ? 'dark' : 'light',
        metadata: {
          name: type === 'subscription' ? `Subscribe — ${displayPrice}/mo` : `Purchase — ${displayPrice}`,
          image: '/logo/varity-logo-color.svg',
        },
      }}
      className={className}
      disabled={disabled}
    >
      {children}
    </TransactionButton>
  );
};

export default PaymentWidget;
