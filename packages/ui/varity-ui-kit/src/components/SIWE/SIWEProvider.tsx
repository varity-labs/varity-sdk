import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';

/**
 * SIWE Authentication Context
 * Provides Sign-In with Ethereum authentication state and methods
 */

interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

interface AuthUser {
  address: string;
  chainId: number;
  ens?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

interface SIWEProviderProps {
  children: ReactNode;
  apiUrl: string;
  chainId?: number;
  onLoginSuccess?: (user: AuthUser) => void;
  onLoginError?: (error: Error) => void;
  onLogoutSuccess?: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * SIWE Provider Component
 * Manages authentication state and provides login/logout functionality
 */
export const SIWEProvider: React.FC<SIWEProviderProps> = ({
  children,
  apiUrl,
  chainId = 33529, // Varity L3 Chain ID
  onLoginSuccess,
  onLoginError,
  onLogoutSuccess,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    error: null,
  });

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const apiClient: AxiosInstance = axios.create({ baseURL: apiUrl });

  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem('varity_access_token');
    localStorage.removeItem('varity_refresh_token');
    localStorage.removeItem('varity_user');
  }, []);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const accessToken = localStorage.getItem('varity_access_token');
        const refreshToken = localStorage.getItem('varity_refresh_token');
        const userStr = localStorage.getItem('varity_user');

        if (accessToken && refreshToken && userStr) {
          const user = JSON.parse(userStr);
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            accessToken,
            refreshToken,
            error: null,
          });
        }
      } catch (error) {
        console.error('Failed to load stored auth:', error);
        clearStoredAuth();
      }
    };

    loadStoredAuth();
  }, [clearStoredAuth]);

  // Setup axios interceptor for adding auth token
  useEffect(() => {
    if (authState.accessToken) {
      const interceptorId = apiClient.interceptors.request.use(
        (config) => {
          config.headers.Authorization = `Bearer ${authState.accessToken}`;
          return config;
        },
        (error) => Promise.reject(error)
      );

      return () => {
        apiClient.interceptors.request.eject(interceptorId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.accessToken]);

  const saveAuthToStorage = useCallback((accessToken: string, refreshToken: string, user: AuthUser) => {
    localStorage.setItem('varity_access_token', accessToken);
    localStorage.setItem('varity_refresh_token', refreshToken);
    localStorage.setItem('varity_user', JSON.stringify(user));
  }, []);

  /**
   * Login with SIWE
   * 1. Get nonce from backend
   * 2. Sign SIWE message with wallet
   * 3. Submit signature to backend
   * 4. Receive JWT tokens
   */
  const login = useCallback(async () => {
    if (!account || !wallet) {
      const error = new Error('Wallet not connected');
      setAuthState(prev => ({ ...prev, error: error.message }));
      onLoginError?.(error);
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Step 1: Get nonce from backend
      const nonceResponse = await apiClient.post('/api/v1/auth/nonce', {
        address: account.address,
        chainId,
      });

      const siweMessage: SiweMessage = nonceResponse.data.data.message;

      // Step 2: Create EIP-4361 formatted message
      const messageToSign = formatSiweMessage(siweMessage);

      // Step 3: Sign message with wallet (v5 API uses account.signMessage)
      const signature = await account.signMessage({
        message: messageToSign,
      });

      // Step 4: Submit signature to backend for verification
      const loginResponse = await apiClient.post('/api/v1/auth/login', {
        message: siweMessage,
        signature,
      });

      const { accessToken, refreshToken, user } = loginResponse.data.data;

      // Save tokens to localStorage
      saveAuthToStorage(accessToken, refreshToken, user);

      // Update state
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        accessToken,
        refreshToken,
        error: null,
      });

      onLoginSuccess?.(user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        error: errorMessage,
      });
      onLoginError?.(new Error(errorMessage));
      clearStoredAuth();
    }
  }, [account, wallet, chainId, apiClient, onLoginSuccess, onLoginError, saveAuthToStorage, clearStoredAuth]);

  /**
   * Logout
   * Clears authentication state and localStorage
   */
  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint
      if (authState.accessToken) {
        await apiClient.post('/api/v1/auth/logout', {}, {
          headers: { Authorization: `Bearer ${authState.accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of backend response
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        error: null,
      });
      clearStoredAuth();
      onLogoutSuccess?.();
    }
  }, [authState.accessToken, apiClient, clearStoredAuth, onLogoutSuccess]);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async () => {
    if (!authState.refreshToken) {
      return;
    }

    try {
      const response = await apiClient.post('/api/v1/auth/refresh', {
        refreshToken: authState.refreshToken,
      });

      const { accessToken } = response.data.data;

      // Update access token
      localStorage.setItem('varity_access_token', accessToken);
      setAuthState(prev => ({ ...prev, accessToken }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout
      await logout();
    }
  }, [authState.refreshToken, apiClient, logout]);

  // Auto-refresh token every 30 minutes
  useEffect(() => {
    if (authState.isAuthenticated && authState.refreshToken) {
      const interval = setInterval(() => {
        refreshAccessToken();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated, authState.refreshToken, refreshAccessToken]);

  const contextValue: AuthContextValue = {
    ...authState,
    login,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Format SIWE message according to EIP-4361
 */
function formatSiweMessage(message: SiweMessage): string {
  return `${message.domain} wants you to sign in with your Ethereum account:
${message.address}

${message.statement}

URI: ${message.uri}
Version: ${message.version}
Chain ID: ${message.chainId}
Nonce: ${message.nonce}
Issued At: ${message.issuedAt}${message.expirationTime ? `\nExpiration Time: ${message.expirationTime}` : ''}`;
}

/**
 * Custom hook to use SIWE authentication context
 */
export const useSIWE = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSIWE must be used within SIWEProvider');
  }
  return context;
};

export default SIWEProvider;
