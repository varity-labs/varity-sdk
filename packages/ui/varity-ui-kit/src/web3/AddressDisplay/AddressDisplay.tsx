import React, { useState } from 'react';
import { formatAddress } from '../../config/chains';

export interface AddressDisplayProps {
  address: string;
  format?: 'short' | 'full';
  copyable?: boolean;
  linkToExplorer?: boolean;
  className?: string;
}

/**
 * Address Display Component
 *
 * Formats and displays Ethereum addresses with optional features:
 * - Copy to clipboard
 * - Link to block explorer
 * - Short or full format
 *
 * @example
 * ```tsx
 * import { AddressDisplay } from '@varity-labs/ui-kit';
 *
 * function Transaction() {
 *   return (
 *     <AddressDisplay
 *       address="0x1234567890abcdef1234567890abcdef12345678"
 *       format="short"
 *       copyable
 *       linkToExplorer
 *     />
 *   );
 * }
 * ```
 */
export function AddressDisplay({
  address,
  format = 'short',
  copyable = true,
  linkToExplorer = false,
  className = '',
}: AddressDisplayProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const displayAddress = format === 'short' ? formatAddress(address) : address;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <span className={`truncate-address ${className}`}>
      {displayAddress}
    </span>
  );

  return (
    <div className="inline-flex items-center gap-2">
      {linkToExplorer ? (
        <a
          href={`https://sepolia.arbiscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-varity-primary hover:text-varity-primary/80 underline"
        >
          {content}
        </a>
      ) : (
        content
      )}

      {copyable && (
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title={copied ? 'Copied!' : 'Copy address'}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
