/**
 * React Hooks for Varity Client
 *
 * Provides easy-to-use React hooks for blockchain interactions
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { VarityClient } from '../VarityClient';
import type {
  VarityClientConfig,
  WalletConnectionOptions,
  WalletInfo,
  ContractReadOptions,
  ContractWriteOptions,
  SIWESignatureResult,
  SIWESession,
  StorageUploadOptions,
  StorageUploadResult,
} from '../types';
import type { Account } from 'thirdweb/wallets';

/**
 * useVarityClient - Create and manage Varity client instance
 *
 * @example
 * ```typescript
 * function App() {
 *   const client = useVarityClient({ chain: 'varity-l3' });
 *
 *   return <div>Chain: {client.getChainName()}</div>;
 * }
 * ```
 */
export function useVarityClient(config?: VarityClientConfig) {
  const clientRef = useRef<VarityClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = new VarityClient(config);
  }

  useEffect(() => {
    return () => {
      clientRef.current?.dispose();
    };
  }, []);

  return clientRef.current;
}

/**
 * useVarityWallet - Manage wallet connection and state
 *
 * @example
 * ```typescript
 * function WalletButton() {
 *   const { connect, disconnect, isConnected, account, balance } = useVarityWallet(client);
 *
 *   if (isConnected) {
 *     return <button onClick={disconnect}>Disconnect ({balance})</button>;
 *   }
 *
 *   return <button onClick={() => connect({ walletType: 'metamask' })}>Connect</button>;
 * }
 * ```
 */
export function useVarityWallet(client: VarityClient) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(
    async (options: WalletConnectionOptions) => {
      setIsConnecting(true);
      setError(null);

      try {
        const connectedAccount = await client.wallet.connect(options);
        setAccount(connectedAccount);
        setIsConnected(true);

        // Get wallet info
        const info = await client.wallet.getWalletInfo();
        setWalletInfo(info);
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [client]
  );

  const disconnect = useCallback(() => {
    client.wallet.disconnect();
    setAccount(null);
    setIsConnected(false);
    setWalletInfo(null);
  }, [client]);

  const refreshBalance = useCallback(async () => {
    if (isConnected) {
      const info = await client.wallet.getWalletInfo();
      setWalletInfo(info);
    }
  }, [client, isConnected]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    account,
    walletInfo,
    address: walletInfo?.address || null,
    balance: walletInfo?.balanceFormatted || '0',
    chainId: walletInfo?.chainId || null,
    refreshBalance,
    error,
  };
}

/**
 * useVarityBalance - Track wallet balance with auto-refresh
 *
 * @example
 * ```typescript
 * function BalanceDisplay() {
 *   const { balance, isLoading, refresh } = useVarityBalance(client);
 *
 *   return (
 *     <div>
 *       Balance: {balance}
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVarityBalance(
  client: VarityClient,
  autoRefresh: boolean = true,
  refreshInterval: number = 10000
) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!client.wallet.isConnected()) {
      setBalance('0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await client.wallet.getWalletInfo();
      setBalance(info.balanceFormatted);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBalance();

    if (autoRefresh) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, autoRefresh, refreshInterval]);

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  };
}

/**
 * useVarityContract - Interact with smart contracts
 *
 * @example
 * ```typescript
 * function TokenBalance() {
 *   const { read, write, isLoading } = useVarityContract(client, account);
 *
 *   const balance = read({
 *     address: '0x...',
 *     abi: ERC20_ABI,
 *     functionName: 'balanceOf',
 *     args: ['0x...']
 *   });
 *
 *   return <div>Balance: {balance}</div>;
 * }
 * ```
 */
export function useVarityContract(client: VarityClient, account: Account | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const read = useCallback(
    async (options: ContractReadOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.contracts.read(options);
        return result;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const write = useCallback(
    async (options: ContractWriteOptions) => {
      if (!account) {
        throw new Error('No wallet connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.contracts.write(options, account);
        return result;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, account]
  );

  return {
    read,
    write,
    isLoading,
    error,
  };
}

/**
 * useVarityAuth - Manage SIWE authentication
 *
 * @example
 * ```typescript
 * function AuthButton() {
 *   const { signIn, signOut, isAuthenticated, session } = useVarityAuth(client, account);
 *
 *   if (isAuthenticated) {
 *     return <button onClick={signOut}>Sign Out</button>;
 *   }
 *
 *   return <button onClick={signIn}>Sign In with Ethereum</button>;
 * }
 * ```
 */
export function useVarityAuth(client: VarityClient, account: Account | null) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<SIWESession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(
    async (statement?: string) => {
      if (!account) {
        throw new Error('No wallet connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate SIWE message
        const message = await client.auth.generateMessage({
          address: account.address,
          statement: statement || 'Sign in to Varity',
        });

        // Sign message
        const result = await client.auth.signMessage(message, account);

        // Create session
        const newSession = await client.auth.createSession(result);
        setSession(newSession);
        setIsAuthenticated(true);

        return newSession;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client, account]
  );

  const signOut = useCallback(() => {
    if (account) {
      client.auth.deleteSession(account.address);
    }
    setSession(null);
    setIsAuthenticated(false);
  }, [client, account]);

  // Check for existing session on mount
  useEffect(() => {
    if (account) {
      const existingSession = client.auth.getSession(account.address);
      if (existingSession) {
        setSession(existingSession);
        setIsAuthenticated(true);
      }
    }
  }, [client, account]);

  return {
    signIn,
    signOut,
    isAuthenticated,
    session,
    isLoading,
    error,
  };
}

/**
 * useVarityStorage - Upload and download from IPFS
 *
 * @example
 * ```typescript
 * function FileUpload() {
 *   const { upload, isUploading, uploadProgress } = useVarityStorage(client);
 *
 *   const handleUpload = async (file: File) => {
 *     const result = await upload(file);
 *     console.log('Uploaded to:', result.gateway);
 *   };
 *
 *   return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />;
 * }
 * ```
 */
export function useVarityStorage(client: VarityClient) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File | Blob | Buffer | string, options?: StorageUploadOptions) => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const result = await client.storage.upload(file, {
          ...options,
          onProgress: (progress) => {
            setUploadProgress(progress);
            options?.onProgress?.(progress);
          },
        });

        setUploadProgress(100);
        return result;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [client]
  );

  const download = useCallback(
    async (cid: string) => {
      setError(null);

      try {
        const data = await client.storage.download(cid);
        return data;
      } catch (err: any) {
        setError(err);
        throw err;
      }
    },
    [client]
  );

  const uploadJSON = useCallback(
    async (data: any, options?: StorageUploadOptions) => {
      setIsUploading(true);
      setError(null);

      try {
        const result = await client.storage.uploadJSON(data, options);
        return result;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [client]
  );

  return {
    upload,
    download,
    uploadJSON,
    isUploading,
    uploadProgress,
    error,
  };
}

/**
 * useVarityChain - Monitor chain information
 *
 * @example
 * ```typescript
 * function ChainInfo() {
 *   const { chainId, chainName, isVarityL3 } = useVarityChain(client);
 *
 *   return <div>Connected to: {chainName} (ID: {chainId})</div>;
 * }
 * ```
 */
export function useVarityChain(client: VarityClient) {
  const config = useMemo(() => client.getConfig(), [client]);

  return {
    chainId: config.chainId,
    chainName: config.chainName,
    rpcUrl: config.rpcUrl,
    nativeCurrency: config.nativeCurrency,
    isVarityL3: config.isVarityL3,
  };
}
