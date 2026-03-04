import React from 'react';
import { getBlockExplorerUrl } from '../../config/chains';

export interface BlockExplorerLinkProps {
  type: 'tx' | 'address' | 'block';
  hash: string;
  chainId?: number;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Block Explorer Link Component
 *
 * Creates links to Arbiscan block explorer for transactions, addresses, or blocks
 *
 * @example
 * ```tsx
 * import { BlockExplorerLink } from '@varity-labs/ui-kit';
 *
 * function Transaction() {
 *   return (
 *     <>
 *       <BlockExplorerLink
 *         type="tx"
 *         hash="0xabc..."
 *         label="View Transaction"
 *       />
 *
 *       <BlockExplorerLink
 *         type="address"
 *         hash="0x123..."
 *       >
 *         View on Explorer
 *       </BlockExplorerLink>
 *     </>
 *   );
 * }
 * ```
 */
export function BlockExplorerLink({
  type,
  hash,
  chainId = 421614, // Default to Arbitrum Sepolia
  label,
  children,
  className = '',
}: BlockExplorerLinkProps): JSX.Element {
  const url = getBlockExplorerUrl(chainId, type, hash);

  const defaultLabels = {
    tx: 'View Transaction',
    address: 'View Address',
    block: 'View Block',
  };

  const displayText = children || label || defaultLabels[type];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-varity-primary hover:text-varity-primary/80 underline ${className}`}
    >
      {displayText}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
