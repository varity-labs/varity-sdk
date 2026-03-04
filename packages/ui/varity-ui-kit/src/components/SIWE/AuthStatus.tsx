import React from 'react';
import { useSIWE } from './SIWEProvider';
import { useActiveAccount } from 'thirdweb/react';

/**
 * Auth Status Component
 * Displays current authentication status and user information
 */

interface AuthStatusProps {
  className?: string;
  theme?: 'light' | 'dark';
  showAddress?: boolean;
  showChainId?: boolean;
  compact?: boolean;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({
  className = '',
  theme = 'dark',
  showAddress = true,
  showChainId = true,
  compact = false,
}) => {
  const { isAuthenticated, user, isLoading } = useSIWE();
  const account = useActiveAccount();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Checking authentication...
        </span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`} />
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Wallet not connected
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Not authenticated
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
          {formatAddress(user?.address || '')}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Authenticated
        </span>
      </div>
      {showAddress && user?.address && (
        <div className="flex items-center gap-2 text-sm">
          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
            Address:
          </span>
          <code className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            {formatAddress(user.address)}
          </code>
        </div>
      )}
      {showChainId && user?.chainId && (
        <div className="flex items-center gap-2 text-sm">
          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
            Chain ID:
          </span>
          <code className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            {user.chainId}
          </code>
        </div>
      )}
    </div>
  );
};

/**
 * Format Ethereum address for display
 */
function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export default AuthStatus;
