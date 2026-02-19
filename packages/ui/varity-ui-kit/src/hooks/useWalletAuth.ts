/**
 * Wallet Authentication Hook
 *
 * Provides wallet-based authentication with session management.
 * Integrates with Privy for seamless authentication and backend session tokens.
 *
 * This hook handles:
 * - Wallet signature authentication
 * - Session token management
 * - Auto-login when Privy authenticates
 * - Session refresh and expiration handling
 * - Multi-device session management
 *
 * @packageDocumentation
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useActiveAccount } from 'thirdweb/react';

/**
 * Wallet session information
 */
export interface WalletSession {
  sessionToken: string;
  walletAddress: string;
  expiresAt: number;
  expiresIn: number;
}

/**
 * Session information from the backend
 */
export interface SessionInfo {
  wallet_address: string;
  session_token: string;
  created_at: number;
  expires_at: number;
  metadata: Record<string, unknown>;
}

/**
 * Return type for useWalletAuth hook
 */
export interface UseWalletAuthReturn {
  // Authentication state
  /** Whether the user is authenticated with a valid session */
  isAuthenticated: boolean;
  /** The current session token */
  sessionToken: string | null;
  /** The authenticated wallet address */
  walletAddress: string | null;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** Authentication error message if any */
  authError: string | null;

  // Session management
  /** List of active sessions across devices */
  sessions: SessionInfo[];

  // Actions
  /** Initiate login with wallet signature */
  login: () => Promise<void>;
  /** Logout and invalidate session */
  logout: () => Promise<void>;
  /** Refresh session expiration */
  refreshSession: () => Promise<void>;
  /** Get all active sessions */
  getSessions: () => Promise<void>;
  /** Logout from a specific session */
  logoutFromSession: (sessionToken: string) => Promise<void>;
  /** Logout from all devices */
  logoutFromAllDevices: () => Promise<void>;
  /** Add additional wallet to session (multi-wallet support) */
  addWallet: (newWalletAddress: string) => Promise<void>;

  // Utility
  /** Get axios-like fetch with auth headers */
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

/**
 * Configuration for useWalletAuth hook
 */
export interface UseWalletAuthConfig {
  /** Base URL for the API (default: from env or localhost:8000) */
  apiBaseUrl?: string;
  /** Auto-login when Privy authenticates (default: true) */
  autoLogin?: boolean;
  /** Auto-refresh session interval in minutes (default: 30) */
  refreshIntervalMinutes?: number;
  /** Callback when session changes */
  onSessionChange?: (session: WalletSession | null) => void;
  /** Callback when auth error occurs */
  onAuthError?: (error: string) => void;
}

/**
 * useWalletAuth - Wallet-based authentication with session management
 *
 * This hook provides complete wallet authentication functionality:
 * - Signs in using wallet signature (EIP-191)
 * - Manages session tokens with auto-refresh
 * - Handles multi-device sessions
 * - Integrates with Privy for embedded wallets
 *
 * @example
 * ```tsx
 * import { useWalletAuth } from '@varity-labs/ui-kit';
 *
 * function MyComponent() {
 *   const {
 *     isAuthenticated,
 *     walletAddress,
 *     login,
 *     logout,
 *     authFetch,
 *   } = useWalletAuth({
 *     apiBaseUrl: 'https://api.example.com',
 *   });
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={login}>Sign In</button>;
 *   }
 *
 *   const fetchData = async () => {
 *     // authFetch automatically includes session token
 *     const response = await authFetch('/api/v1/data');
 *     return response.json();
 *   };
 *
 *   return <p>Connected: {walletAddress}</p>;
 * }
 * ```
 */
export function useWalletAuth(config: UseWalletAuthConfig = {}): UseWalletAuthReturn {
  const {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:8000',
    autoLogin = true,
    refreshIntervalMinutes = 30,
    onSessionChange,
    onAuthError,
  } = config;

  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const activeAccount = useActiveAccount();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  // Get wallet address from Privy or thirdweb
  const address = wallets?.[0]?.address || activeAccount?.address;

  /**
   * Verify session is still valid
   */
  const verifySession = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/session`, {
        headers: {
          'X-Session-Token': token,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }, [apiBaseUrl]);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('wallet_session_token');
    const storedAddress = localStorage.getItem('wallet_address');

    if (storedToken && storedAddress) {
      setSessionToken(storedToken);
      setWalletAddress(storedAddress);

      // Verify session is still valid
      verifySession(storedToken).catch(() => {
        // Session invalid, clear storage
        localStorage.removeItem('wallet_session_token');
        localStorage.removeItem('wallet_address');
        setSessionToken(null);
        setWalletAddress(null);
      });
    }
  }, [verifySession]);

  /**
   * Sign message with wallet
   */
  const signMessage = useCallback(async (message: string): Promise<string> => {
    // Try Privy wallet first
    const privyWallet = wallets?.[0];

    if (privyWallet && 'signMessage' in privyWallet) {
      try {
        // Privy wallets support signMessage directly
        const signature = await (privyWallet as { signMessage: (msg: string) => Promise<string> }).signMessage(message);
        return signature;
      } catch (error) {
        console.error('Privy wallet signing failed', error);
        throw error;
      }
    }

    // Fall back to thirdweb active account
    if (activeAccount && 'signMessage' in activeAccount) {
      try {
        const signature = await activeAccount.signMessage({ message });
        return signature;
      } catch (error) {
        console.error('Thirdweb wallet signing failed', error);
        throw error;
      }
    }

    throw new Error('No wallet available for signing');
  }, [wallets, activeAccount]);

  /**
   * Login with wallet signature
   */
  const login = useCallback(async () => {
    if (!address) {
      const error = 'No wallet connected';
      setAuthError(error);
      onAuthError?.(error);
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Step 1: Get authentication message
      const messageResponse = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to get authentication message');
      }

      const { message, nonce } = await messageResponse.json();

      // Step 2: Sign message with wallet
      const signature = await signMessage(message);

      // Step 3: Login with signature
      const loginResponse = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          signature,
          message,
          nonce,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || errorData.detail || 'Authentication failed');
      }

      const session: WalletSession = await loginResponse.json();

      // Store session
      setSessionToken(session.sessionToken);
      setWalletAddress(session.walletAddress);
      localStorage.setItem('wallet_session_token', session.sessionToken);
      localStorage.setItem('wallet_address', session.walletAddress);

      onSessionChange?.(session);
      console.log('Wallet authentication successful');
    } catch (error) {
      console.error('Wallet authentication failed', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      onAuthError?.(errorMessage);

      // Clear any existing session
      setSessionToken(null);
      setWalletAddress(null);
      localStorage.removeItem('wallet_session_token');
      localStorage.removeItem('wallet_address');
    } finally {
      setIsAuthenticating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, apiBaseUrl, onSessionChange, onAuthError, signMessage]);

  /**
   * Logout and invalidate session
   */
  const logout = useCallback(async () => {
    if (!sessionToken) return;

    try {
      await fetch(`${apiBaseUrl}/api/v1/wallet/auth/logout`, {
        method: 'POST',
        headers: {
          'X-Session-Token': sessionToken,
        },
      });
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      // Clear session regardless of API success
      setSessionToken(null);
      setWalletAddress(null);
      localStorage.removeItem('wallet_session_token');
      localStorage.removeItem('wallet_address');
      onSessionChange?.(null);
    }
  }, [sessionToken, apiBaseUrl, onSessionChange]);

  /**
   * Refresh session expiration
   */
  const refreshSession = useCallback(async () => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/refresh`, {
        method: 'POST',
        headers: {
          'X-Session-Token': sessionToken,
        },
      });

      if (!response.ok) {
        throw new Error('Session refresh failed');
      }

      const session: WalletSession = await response.json();
      console.log('Session refreshed', { expiresAt: new Date(session.expiresAt * 1000) });
    } catch (error) {
      console.error('Session refresh failed', error);
      // Session might be expired, logout
      await logout();
    }
  }, [sessionToken, apiBaseUrl, logout]);

  /**
   * Get all active sessions
   */
  const getSessions = useCallback(async () => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/sessions`, {
        headers: {
          'X-Session-Token': sessionToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get sessions');
      }

      const sessionsData: SessionInfo[] = await response.json();
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to get sessions', error);
    }
  }, [sessionToken, apiBaseUrl]);

  /**
   * Logout from specific session
   */
  const logoutFromSession = useCallback(
    async (targetSessionToken: string) => {
      if (!sessionToken) return;

      try {
        await fetch(`${apiBaseUrl}/api/v1/wallet/auth/sessions/${targetSessionToken}`, {
          method: 'DELETE',
          headers: {
            'X-Session-Token': sessionToken,
          },
        });

        console.log('Session invalidated');

        // If we logged out our own session, clear local state
        if (targetSessionToken === sessionToken) {
          await logout();
        } else {
          // Refresh sessions list
          await getSessions();
        }
      } catch (error) {
        console.error('Failed to invalidate session', error);
      }
    },
    [sessionToken, apiBaseUrl, logout, getSessions]
  );

  /**
   * Logout from all devices
   */
  const logoutFromAllDevices = useCallback(async () => {
    if (!sessionToken) return;

    try {
      await fetch(`${apiBaseUrl}/api/v1/wallet/auth/sessions`, {
        method: 'DELETE',
        headers: {
          'X-Session-Token': sessionToken,
        },
      });

      console.log('Logged out from all devices');

      // Clear local session
      await logout();
    } catch (error) {
      console.error('Failed to logout from all devices', error);
    }
  }, [sessionToken, apiBaseUrl, logout]);

  /**
   * Add additional wallet to session (multi-wallet support)
   */
  const addWallet = useCallback(
    async (newWalletAddress: string) => {
      if (!sessionToken) return;

      try {
        // Get authentication message for new wallet
        const messageResponse = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: newWalletAddress }),
        });

        if (!messageResponse.ok) {
          throw new Error('Failed to get authentication message');
        }

        const { message, nonce } = await messageResponse.json();

        // Sign message with new wallet
        const signature = await signMessage(message);

        // Add wallet to session
        const response = await fetch(`${apiBaseUrl}/api/v1/wallet/auth/add-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({
            new_wallet_address: newWalletAddress,
            signature,
            message,
            nonce,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add wallet');
        }

        console.log('Wallet added successfully');
      } catch (error) {
        console.error('Failed to add wallet', error);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionToken, apiBaseUrl, signMessage]
  );

  /**
   * Fetch with auth headers
   */
  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      if (sessionToken) {
        headers.set('X-Session-Token', sessionToken);
      }
      return fetch(input, { ...init, headers });
    },
    [sessionToken]
  );

  // Auto-login when Privy authenticates
  useEffect(() => {
    if (autoLogin && ready && authenticated && address && !sessionToken && !isAuthenticating) {
      console.log('Auto-logging in with wallet', { address });
      login().catch((e) => console.error('Auto-login failed', e));
    }
  }, [autoLogin, ready, authenticated, address, sessionToken, isAuthenticating, login]);

  // Auto-refresh session
  useEffect(() => {
    if (!sessionToken) return;

    const intervalId = setInterval(
      () => {
        refreshSession().catch((e) => console.error('Auto-refresh failed', e));
      },
      refreshIntervalMinutes * 60 * 1000
    );

    return () => clearInterval(intervalId);
  }, [sessionToken, refreshSession, refreshIntervalMinutes]);

  return {
    // Authentication state
    isAuthenticated: !!sessionToken && !!walletAddress,
    sessionToken,
    walletAddress,
    isAuthenticating,
    authError,

    // Session management
    sessions,

    // Actions
    login,
    logout,
    refreshSession,
    getSessions,
    logoutFromSession,
    logoutFromAllDevices,
    addWallet,

    // Utility
    authFetch,
  };
}

export default useWalletAuth;
