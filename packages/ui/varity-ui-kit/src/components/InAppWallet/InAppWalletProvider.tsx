/**
 * InAppWalletProvider - Thirdweb In-App Wallet Provider for Varity L3
 *
 * Provides email/social authentication with custodial wallet management
 * Supports: Email OTP, Google, Apple, Facebook, Discord, Twitter
 *
 * @example
 * ```tsx
 * <InAppWalletProvider clientId="your-client-id">
 *   <YourApp />
 * </InAppWalletProvider>
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ThirdwebProvider } from 'thirdweb/react';
import { useActiveAccount, useConnect } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@varity-labs/types';

interface User {
  email?: string;
  walletAddress?: string;
  userId: string;
  name?: string;
  profileImage?: string;
  authMethod: 'email' | 'google' | 'apple' | 'facebook' | 'discord' | 'twitter';
}

export interface InAppWalletContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  wallet: ReturnType<typeof inAppWallet> | null;
}

const InAppWalletContext = createContext<InAppWalletContextType | undefined>(undefined);

interface InAppWalletProviderProps {
  children: React.ReactNode;
  clientId: string;
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: Error) => void;
  onLogout?: () => void;
}

/**
 * Internal component that uses Thirdweb hooks
 */
function InAppWalletManager({
  children,
  onLoginSuccess,
  onLoginError,
  onLogout,
  client
}: Omit<InAppWalletProviderProps, 'clientId'> & { client: ReturnType<typeof createThirdwebClient> }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<ReturnType<typeof inAppWallet> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { connect } = useConnect();
  const activeAccount = useActiveAccount();

  const isAuthenticated = !!activeAccount;

  // Update user when account changes
  useEffect(() => {
    if (activeAccount) {
      const walletAddress = activeAccount.address;
      const userData: User = {
        walletAddress,
        userId: walletAddress,
        authMethod: 'email', // Default, will be updated based on actual method
      };
      setUser(userData);
      onLoginSuccess?.(userData);
    } else {
      setUser(null);
    }
  }, [activeAccount, onLoginSuccess]);

  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const wallet = inAppWallet();
      setWallet(wallet);

      // Use connect hook with v5 API
      await connect(async () => {
        await wallet.connect({
          client,
          strategy: 'email' as const,
          email,
        });
        return wallet;
      });

      toast.success(`Welcome! Check ${email} for verification code.`);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Email login error:', errorMessage);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onLoginError?.(errorObj);
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  }, [connect, client, onLoginError]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const wallet = inAppWallet();
      setWallet(wallet);

      await connect(async () => {
        await wallet.connect({
          client,
          strategy: 'google',
        });
        return wallet;
      });

      toast.success('Successfully logged in with Google!');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Google login error:', errorMessage);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onLoginError?.(errorObj);
      toast.error('Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  }, [connect, client, onLoginError]);

  const loginWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      const wallet = inAppWallet();
      setWallet(wallet);

      await connect(async () => {
        await wallet.connect({
          client,
          strategy: 'apple',
        });
        return wallet;
      });

      toast.success('Successfully logged in with Apple!');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Apple login error:', errorMessage);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onLoginError?.(errorObj);
      toast.error('Failed to login with Apple');
    } finally {
      setIsLoading(false);
    }
  }, [connect, client, onLoginError]);

  const loginWithFacebook = useCallback(async () => {
    setIsLoading(true);
    try {
      const wallet = inAppWallet();
      setWallet(wallet);

      await connect(async () => {
        await wallet.connect({
          client,
          strategy: 'facebook',
        });
        return wallet;
      });

      toast.success('Successfully logged in with Facebook!');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Facebook login error:', errorMessage);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onLoginError?.(errorObj);
      toast.error('Failed to login with Facebook');
    } finally {
      setIsLoading(false);
    }
  }, [connect, client, onLoginError]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (wallet) {
        await wallet.disconnect();
      }
      setUser(null);
      setWallet(null);
      onLogout?.();
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Logout error:', errorMessage);
      toast.error('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  }, [wallet, onLogout]);

  const value: InAppWalletContextType = {
    user,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
    loginWithFacebook,
    logout,
    wallet,
  };

  return (
    <InAppWalletContext.Provider value={value}>
      {children}
    </InAppWalletContext.Provider>
  );
}

/**
 * Main provider component
 */
export function InAppWalletProvider({
  children,
  clientId,
  onLoginSuccess,
  onLoginError,
  onLogout
}: InAppWalletProviderProps) {
  const client = React.useMemo(
    () => createThirdwebClient({ clientId }),
    [clientId]
  );

  return (
    <ThirdwebProvider>
      <InAppWalletManager
        client={client}
        onLoginSuccess={onLoginSuccess}
        onLoginError={onLoginError}
        onLogout={onLogout}
      >
        {children}
      </InAppWalletManager>
    </ThirdwebProvider>
  );
}

/**
 * Hook to use In-App Wallet context
 */
export function useInAppWallet() {
  const context = useContext(InAppWalletContext);
  if (context === undefined) {
    throw new Error('useInAppWallet must be used within InAppWalletProvider');
  }
  return context;
}
