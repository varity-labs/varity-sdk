import React from 'react';
import { usePrivy, User } from '@privy-io/react-auth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@varity-labs/types';

export interface PrivyLoginButtonProps {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Privy Login Button Component
 *
 * Simple button to trigger Privy authentication modal.
 * Supports email, social logins, and wallet connections.
 *
 * @example
 * ```tsx
 * <PrivyLoginButton
 *   onSuccess={(user) => console.log('Logged in:', user)}
 *   onError={(error) => console.error('Login failed:', error)}
 * >
 *   Sign In
 * </PrivyLoginButton>
 * ```
 */
export function PrivyLoginButton({
  onSuccess,
  onError,
  className = 'px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl',
  children = 'Sign In with Email or Social',
}: PrivyLoginButtonProps): JSX.Element {
  const { ready, authenticated, login, user } = usePrivy();

  const handleLogin = async () => {
    try {
      await login();

      if (user) {
        toast.success('Successfully logged in!');
        onSuccess?.(user);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Privy login error:', errorMessage);
      toast.error(errorMessage || 'Login failed');
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onError?.(errorObj);
    }
  };

  if (!ready) {
    return (
      <button disabled className={`${className} opacity-50 cursor-not-allowed`}>
        Loading...
      </button>
    );
  }

  if (authenticated) {
    return (
      <button disabled className={`${className} opacity-50 cursor-not-allowed`}>
        Already Authenticated
      </button>
    );
  }

  return (
    <button onClick={handleLogin} className={className}>
      {children}
    </button>
  );
}

export default PrivyLoginButton;
