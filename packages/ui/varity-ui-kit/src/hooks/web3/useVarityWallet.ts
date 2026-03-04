import { useActiveAccount, useDisconnect, useActiveWallet, useWalletBalance } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { THIRDWEB_CLIENT_ID, DEFAULT_CHAIN, formatAddress } from '../../config/chains';
import { useMemo, useCallback } from 'react';

export interface UseVarityWalletReturn {
  address: string | null;
  formattedAddress: string | null;
  isConnected: boolean;
  disconnect: () => Promise<void>;
  balance: bigint | null;
  isLoadingBalance: boolean;
}

/**
 * Hook for wallet operations
 *
 * Provides convenient access to wallet state and operations:
 * - Current address and formatted address
 * - Connection status
 * - Disconnect function
 * - Balance queries
 *
 * @returns {UseVarityWalletReturn} Wallet state and operations
 *
 * @example
 * ```tsx
 * import { useVarityWallet } from '@varity-labs/ui-kit';
 *
 * function MyComponent() {
 *   const {
 *     address,
 *     formattedAddress,
 *     isConnected,
 *     disconnect,
 *     balance
 *   } = useVarityWallet();
 *
 *   if (!isConnected) {
 *     return <ConnectWallet />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Address: {formattedAddress}</p>
 *       <p>Balance: {balance?.toString()} USDC</p>
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVarityWallet(): UseVarityWalletReturn {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect: thirdwebDisconnect } = useDisconnect();

  const client = useMemo(
    () => createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID }),
    []
  );

  const { data: balanceData, isLoading: isLoadingBalance } = useWalletBalance({
    client,
    chain: DEFAULT_CHAIN,
    address: account?.address,
  });

  const address = account?.address || null;
  const formattedAddress = address ? formatAddress(address) : null;
  const isConnected = !!address;

  const disconnect = useCallback(async () => {
    if (wallet) {
      await thirdwebDisconnect(wallet);
    }
  }, [wallet, thirdwebDisconnect]);

  return {
    address,
    formattedAddress,
    isConnected,
    disconnect,
    balance: balanceData?.value || null,
    isLoadingBalance,
  };
}
