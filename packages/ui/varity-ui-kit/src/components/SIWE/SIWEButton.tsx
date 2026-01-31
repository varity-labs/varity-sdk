import React, { useState } from 'react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { useSIWE } from './SIWEProvider';

/**
 * SIWE Button Component
 * Combines wallet connection with SIWE authentication
 */

interface SIWEButtonProps {
  clientId: string;
  className?: string;
  loginText?: string;
  logoutText?: string;
  connectWalletText?: string;
  loadingText?: string;
  onLoginStart?: () => void;
  onLoginComplete?: () => void;
  onLogoutComplete?: () => void;
  theme?: 'light' | 'dark';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const SIWEButton: React.FC<SIWEButtonProps> = ({
  clientId,
  className = '',
  loginText = 'Sign In with Ethereum',
  logoutText = 'Sign Out',
  connectWalletText = 'Connect Wallet',
  loadingText = 'Signing in...',
  onLoginStart,
  onLoginComplete,
  onLogoutComplete,
  theme = 'dark',
  variant = 'primary',
  size = 'md',
}) => {
  const { isAuthenticated, isLoading, login, logout, error } = useSIWE();
  const account = useActiveAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  const client = createThirdwebClient({ clientId });

  // Handle SIWE login
  const handleLogin = async () => {
    setIsProcessing(true);
    onLoginStart?.();
    try {
      await login();
      onLoginComplete?.();
    } catch (error) {
      console.error('SIWE login failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      await logout();
      onLogoutComplete?.();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const variantStyles = {
      primary: theme === 'dark'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: theme === 'dark'
        ? 'bg-gray-700 hover:bg-gray-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      outline: theme === 'dark'
        ? 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
        : 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  // If wallet is not connected, show connect button
  if (!account) {
    return (
      <div className={className}>
        <ConnectButton
          client={client}
          theme={theme}
          connectButton={{
            label: connectWalletText,
          }}
        />
      </div>
    );
  }

  // If authenticated, show sign out button
  if (isAuthenticated) {
    return (
      <button
        onClick={handleLogout}
        disabled={isProcessing}
        className={getButtonStyles()}
      >
        {isProcessing ? (
          <>
            <LoadingSpinner />
            {loadingText}
          </>
        ) : (
          <>
            <CheckIcon />
            {logoutText}
          </>
        )}
      </button>
    );
  }

  // If wallet connected but not authenticated, show SIWE button
  return (
    <div className="space-y-2">
      <button
        onClick={handleLogin}
        disabled={isLoading || isProcessing}
        className={getButtonStyles()}
      >
        {isLoading || isProcessing ? (
          <>
            <LoadingSpinner />
            {loadingText}
          </>
        ) : (
          <>
            <EthereumIcon />
            {loginText}
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};

/**
 * Loading Spinner Icon
 */
const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Ethereum Icon
 */
const EthereumIcon: React.FC = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 256 417"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fillOpacity=".602" />
    <path d="M127.962 0L0 212.32l127.962 75.639V0z" />
    <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fillOpacity=".602" />
    <path d="M127.962 416.905v-104.72L0 236.585z" />
    <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fillOpacity=".2" />
    <path d="M0 212.32l127.96 75.638v-133.8z" fillOpacity=".602" />
  </svg>
);

/**
 * Check Icon
 */
const CheckIcon: React.FC = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default SIWEButton;
