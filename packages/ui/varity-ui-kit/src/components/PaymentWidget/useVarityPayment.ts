/**
 * useVarityPayment Hook
 * Manages purchase state for developer apps with 90/10 revenue split
 */

import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, readContract, getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { arbitrumOne, THIRDWEB_CLIENT_ID } from '../../config/chains';
import {
  UseVarityPaymentReturn,
  UseVarityPaymentOptions,
  AppPricing,
  VARITY_PAYMENTS_ADDRESS,
  VARITY_PAYMENTS_ABI,
} from './types';

/**
 * Hook for managing app purchase state
 *
 * @example
 * ```tsx
 * const { hasPurchased, purchase, isLoading } = useVarityPayment({ appId: 123 });
 *
 * if (isLoading) return <Loading />;
 * if (!hasPurchased) return <button onClick={purchase}>Buy Now</button>;
 * return <PremiumContent />;
 * ```
 */
export function useVarityPayment({
  appId,
  autoFetch = true,
}: UseVarityPaymentOptions): UseVarityPaymentReturn {
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<AppPricing | null>(null);

  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();

  // Create thirdweb client
  const client = createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });

  // Get contract instance
  const getPaymentsContract = useCallback(() => {
    return getContract({
      client,
      chain: arbitrumOne, // Payments on Arb One (mainnet, real USDC)
      address: VARITY_PAYMENTS_ADDRESS,
    });
  }, [client]);

  /**
   * Fetch pricing and purchase status
   */
  const fetchData = useCallback(async () => {
    if (!appId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const contract = getPaymentsContract();

      // Get app pricing
      const pricingMethod = VARITY_PAYMENTS_ABI.find(m => m.name === 'getAppPricing');
      if (pricingMethod) {
        const pricingData = await readContract({
          contract,
          method: pricingMethod,
          params: [BigInt(appId)],
        }) as [bigint, string, boolean, bigint, boolean];

        setPricing({
          priceUsdc: pricingData[0],
          developer: pricingData[1],
          isSubscription: pricingData[2],
          intervalDays: Number(pricingData[3]),
          isActive: pricingData[4],
        });
      }

      // Check if user has purchased (if connected)
      if (account?.address) {
        const purchasedMethod = VARITY_PAYMENTS_ABI.find(m => m.name === 'hasUserPurchased');
        if (purchasedMethod) {
          const purchased = await readContract({
            contract,
            method: purchasedMethod,
            params: [BigInt(appId), account.address],
          }) as boolean;
          setHasPurchased(purchased);
        }
      } else {
        setHasPurchased(false);
      }
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
      // Don't show error for apps without pricing - just set pricing to null
      setPricing(null);
      setHasPurchased(false);
    } finally {
      setIsLoading(false);
    }
  }, [appId, account?.address, getPaymentsContract]);

  /**
   * Purchase the app
   */
  const purchase = useCallback(async (): Promise<string | null> => {
    if (!account) {
      setError('Please connect your wallet first');
      return null;
    }

    if (!pricing || !pricing.isActive) {
      setError('This app is not available for purchase');
      return null;
    }

    if (hasPurchased) {
      setError('You have already purchased this app');
      return null;
    }

    try {
      setIsPurchasing(true);
      setError(null);

      const contract = getPaymentsContract();
      const purchaseMethod = VARITY_PAYMENTS_ABI.find(m => m.name === 'purchaseApp');

      if (!purchaseMethod) {
        throw new Error('Purchase method not found in ABI');
      }

      const transaction = prepareContractCall({
        contract,
        method: purchaseMethod,
        params: [BigInt(appId)],
        // No value — purchaseApp is nonpayable, pulls USDC via ERC-20 transferFrom
      });

      const result = await sendTx(transaction);
      const txHash = result.transactionHash;

      // Update purchase status
      setHasPurchased(true);

      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      console.error('Purchase error:', err);
      return null;
    } finally {
      setIsPurchasing(false);
    }
  }, [account, pricing, hasPurchased, appId, getPaymentsContract, sendTx]);

  /**
   * Refresh purchase status
   */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    hasPurchased,
    isLoading,
    isPurchasing,
    error,
    pricing,
    purchase,
    refresh,
  };
}

export default useVarityPayment;
