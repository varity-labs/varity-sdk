import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@varity-labs/types';

export interface PrivyUserProfileProps {
  showLogoutButton?: boolean;
  onLogout?: () => void;
  className?: string;
}

/**
 * Privy User Profile Component
 *
 * Displays authenticated user information including:
 * - Email or social account
 * - Embedded wallet address
 * - Account type
 * - Logout functionality
 *
 * @example
 * ```tsx
 * <PrivyUserProfile
 *   showLogoutButton={true}
 *   onLogout={() => console.log('User logged out')}
 * />
 * ```
 */
export function PrivyUserProfile({
  showLogoutButton = true,
  onLogout,
  className = 'max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg',
}: PrivyUserProfileProps): JSX.Element | null {
  const { ready, authenticated, user, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();

  const handleLogout = async () => {
    try {
      await privyLogout();
      toast.success('Successfully logged out');
      onLogout?.();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Logout error:', errorMessage);
      toast.error('Logout failed');
    }
  };

  if (!ready || !authenticated || !user) {
    return null;
  }

  // Get primary login method
  const email = user.email?.address;
  const google = user.google?.email;
  const twitter = user.twitter?.username;
  const discord = user.discord?.username;
  const github = user.github?.username;

  // Get wallet address
  const primaryWallet = wallets[0];
  const walletAddress = primaryWallet?.address;

  // Determine account type
  let accountType = 'Wallet';
  let accountIdentifier = walletAddress;

  if (email) {
    accountType = 'Email';
    accountIdentifier = email;
  } else if (google) {
    accountType = 'Google';
    accountIdentifier = google;
  } else if (twitter) {
    accountType = 'Twitter';
    accountIdentifier = `@${twitter}`;
  } else if (discord) {
    accountType = 'Discord';
    accountIdentifier = discord;
  } else if (github) {
    accountType = 'GitHub';
    accountIdentifier = github;
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>

      <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">Account Type:</span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {accountType}
          </span>
        </div>

        {accountIdentifier && (
          <div className="flex justify-between items-start">
            <span className="text-gray-600 font-medium">Account:</span>
            <span className="text-right font-medium text-gray-900 break-all max-w-xs">
              {accountIdentifier}
            </span>
          </div>
        )}

        {walletAddress && (
          <div className="flex justify-between items-start">
            <span className="text-gray-600 font-medium">Wallet:</span>
            <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </code>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-medium">User ID:</span>
          <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
            {user.id.slice(0, 8)}...
          </code>
        </div>

        {user.createdAt && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Joined:</span>
            <span className="text-sm text-gray-700">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {showLogoutButton && (
        <button
          onClick={handleLogout}
          className="w-full mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          Logout
        </button>
      )}
    </div>
  );
}

export default PrivyUserProfile;
