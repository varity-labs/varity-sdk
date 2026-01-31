import React, { useState, useRef, useEffect } from 'react';
import { useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';
import { formatAddress } from '../../config/chains';
import { WalletBalance } from '../WalletBalance/WalletBalance';

export interface WalletDropdownProps {
  onDisconnect?: () => void;
  className?: string;
}

/**
 * Wallet Dropdown Menu Component
 *
 * Displays a dropdown menu with wallet information and actions:
 * - Address
 * - Balance
 * - Copy address
 * - View on explorer
 * - Disconnect
 *
 * @example
 * ```tsx
 * import { WalletDropdown } from '@varity-labs/ui-kit';
 *
 * function Header() {
 *   return (
 *     <WalletDropdown
 *       onDisconnect={() => console.log('Disconnected')}
 *     />
 *   );
 * }
 * ```
 */
export function WalletDropdown({
  onDisconnect,
  className = '',
}: WalletDropdownProps): JSX.Element | null {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const address = account?.address;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!account || !address) {
    return null;
  }

  const handleDisconnect = async () => {
    if (wallet) {
      await disconnect(wallet);
    }
    setIsOpen(false);
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    // Could add toast notification here
    setIsOpen(false);
  };

  const viewOnExplorer = () => {
    window.open(`https://sepolia.arbiscan.io/address/${address}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-varity-primary to-varity-secondary flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {address.slice(2, 4).toUpperCase()}
          </span>
        </div>
        <span className="truncate-address">{formatAddress(address)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</p>
            <WalletBalance showSymbol decimals={2} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Address</p>
            <p className="truncate-address text-sm">{formatAddress(address, 10, 8)}</p>
          </div>

          <div className="py-1">
            <button
              onClick={copyAddress}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy address
            </button>

            <button
              onClick={viewOnExplorer}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on explorer
            </button>

            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
