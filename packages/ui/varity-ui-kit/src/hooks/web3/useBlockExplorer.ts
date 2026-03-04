import { useMemo, useCallback } from 'react';
import { getBlockExplorerUrl, DEFAULT_CHAIN } from '../../config/chains';

export interface UseBlockExplorerReturn {
  getTxUrl: (hash: string, chainId?: number) => string;
  getAddressUrl: (address: string, chainId?: number) => string;
  getBlockUrl: (block: string, chainId?: number) => string;
  openTx: (hash: string, chainId?: number) => void;
  openAddress: (address: string, chainId?: number) => void;
  openBlock: (block: string, chainId?: number) => void;
}

/**
 * Hook for block explorer utilities
 *
 * Provides utilities for generating block explorer URLs and opening them:
 * - Get URLs for transactions, addresses, blocks
 * - Open explorer in new tab
 *
 * @returns {UseBlockExplorerReturn} Block explorer utilities
 *
 * @example
 * ```tsx
 * import { useBlockExplorer } from '@varity-labs/ui-kit';
 *
 * function TransactionView() {
 *   const { getTxUrl, openTx } = useBlockExplorer();
 *
 *   const txHash = "0xabc...";
 *   const url = getTxUrl(txHash);
 *
 *   return (
 *     <button onClick={() => openTx(txHash)}>
 *       View on Explorer
 *     </button>
 *   );
 * }
 * ```
 */
export function useBlockExplorer(): UseBlockExplorerReturn {
  const defaultChainId = DEFAULT_CHAIN.id;

  const getTxUrl = useCallback(
    (hash: string, chainId = defaultChainId) => {
      return getBlockExplorerUrl(chainId, 'tx', hash);
    },
    [defaultChainId]
  );

  const getAddressUrl = useCallback(
    (address: string, chainId = defaultChainId) => {
      return getBlockExplorerUrl(chainId, 'address', address);
    },
    [defaultChainId]
  );

  const getBlockUrl = useCallback(
    (block: string, chainId = defaultChainId) => {
      return getBlockExplorerUrl(chainId, 'block', block);
    },
    [defaultChainId]
  );

  const openTx = useCallback(
    (hash: string, chainId = defaultChainId) => {
      window.open(getTxUrl(hash, chainId), '_blank');
    },
    [getTxUrl, defaultChainId]
  );

  const openAddress = useCallback(
    (address: string, chainId = defaultChainId) => {
      window.open(getAddressUrl(address, chainId), '_blank');
    },
    [getAddressUrl, defaultChainId]
  );

  const openBlock = useCallback(
    (block: string, chainId = defaultChainId) => {
      window.open(getBlockUrl(block, chainId), '_blank');
    },
    [getBlockUrl, defaultChainId]
  );

  return useMemo(
    () => ({
      getTxUrl,
      getAddressUrl,
      getBlockUrl,
      openTx,
      openAddress,
      openBlock,
    }),
    [getTxUrl, getAddressUrl, getBlockUrl, openTx, openAddress, openBlock]
  );
}
