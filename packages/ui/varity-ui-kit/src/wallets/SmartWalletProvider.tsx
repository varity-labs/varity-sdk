/**
 * Smart Wallet Provider - ERC-4337 Account Abstraction
 *
 * Provides gasless transactions and improved UX through smart contract wallets
 * Powered by thirdweb's smart wallet infrastructure
 *
 * Features:
 * - Gasless transactions (sponsored by app)
 * - Social login recovery
 * - Batch transactions
 * - Session keys
 * - Multi-sig support
 * - Programmable wallet logic
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { ThirdwebClient, Chain } from 'thirdweb';
import type { Account } from 'thirdweb/wallets';

/**
 * Smart Wallet configuration
 */
export interface SmartWalletConfig {
  /**
   * thirdweb client instance
   */
  client: ThirdwebClient;

  /**
   * Chain to operate on
   */
  chain: Chain;

  /**
   * Gas sponsorship configuration
   */
  gasless?: {
    /**
     * Enable gas sponsorship
     */
    enabled: boolean;

    /**
     * Paymaster URL (optional - uses thirdweb's if not provided)
     */
    paymasterUrl?: string;

    /**
     * Gas policy (which operations to sponsor)
     */
    policy?: {
      /**
       * Sponsor all transactions
       */
      sponsorAll?: boolean;

      /**
       * Sponsor up to this gas limit
       */
      maxGasLimit?: string;

      /**
       * Whitelist of contract addresses to sponsor
       */
      allowedContracts?: string[];
    };
  };

  /**
   * Factory contract address (for deploying smart wallets)
   */
  factoryAddress?: string;

  /**
   * Account abstraction version
   */
  accountVersion?: '0.6' | '0.7';

  /**
   * App tracking for gas billing
   *
   * When provided, tracks gas usage per app for billing purposes.
   * Required for production apps using Varity paymaster.
   */
  appIdentifier?: {
    /**
     * Unique app ID from Varity App Store
     */
    appId: string;

    /**
     * Developer's wallet address for billing
     */
    developerWallet: string;

    /**
     * App name (optional, for logging)
     */
    appName?: string;
  };

  /**
   * Gas tracking configuration
   */
  gasTracking?: {
    /**
     * Enable/disable gas tracking (default: true if appIdentifier provided)
     */
    enabled?: boolean;

    /**
     * API endpoint for gas tracking (default: https://api.varity.so)
     */
    apiUrl?: string;
  };
}

/**
 * Smart Wallet context
 */
interface SmartWalletContextType {
  /**
   * Smart wallet account
   */
  account?: Account;

  /**
   * Whether smart wallet is connected
   */
  isConnected: boolean;

  /**
   * Whether gasless transactions are enabled
   */
  isGasless: boolean;

  /**
   * Connect smart wallet
   */
  connect: (signer: Account) => Promise<void>;

  /**
   * Disconnect smart wallet
   */
  disconnect: () => void;

  /**
   * Send a gasless transaction
   */
  sendTransaction: (tx: {
    to: string;
    data: string;
    value?: string;
  }) => Promise<string>;

  /**
   * Send batch transactions
   */
  sendBatchTransaction: (txs: {
    to: string;
    data: string;
    value?: string;
  }[]) => Promise<string>;

  /**
   * Get smart wallet address
   */
  getAddress: () => string | undefined;

  /**
   * Check if wallet is deployed
   */
  isDeployed: boolean;

  /**
   * Deploy smart wallet
   */
  deployWallet: () => Promise<string>;
}

/**
 * Smart Wallet context
 */
const SmartWalletContext = createContext<SmartWalletContextType | undefined>(undefined);

/**
 * Smart Wallet Provider Props
 */
export interface SmartWalletProviderProps {
  /**
   * Smart wallet configuration
   */
  config: SmartWalletConfig;

  /**
   * Children components
   */
  children: ReactNode;
}

/**
 * Smart Wallet Provider Component
 *
 * Wrap your app with this provider to enable ERC-4337 smart wallets
 *
 * @example
 * ```tsx
 * <SmartWalletProvider config={{ client, chain, gasless: { enabled: true } }}>
 *   <App />
 * </SmartWalletProvider>
 * ```
 */
export function SmartWalletProvider({ config, children }: SmartWalletProviderProps) {
  const [account, setAccount] = useState<Account | undefined>();
  const [isDeployed, setIsDeployed] = useState(false);

  const isConnected = !!account;
  const isGasless = config.gasless?.enabled || false;

  /**
   * Connect smart wallet
   */
  const connect = async (signer: Account) => {
    try {
      console.log('Connecting smart wallet with signer:', signer.address);

      // Import smart wallet functions dynamically to avoid issues
      const { smartWallet } = await import('thirdweb/wallets');

      // Create smart wallet instance
      // Note: Conduit bundler handles paymaster automatically when sponsorGas is true
      const wallet = smartWallet({
        chain: config.chain,
        factoryAddress: config.factoryAddress,
        sponsorGas: config.gasless?.enabled || false,
        ...(config.gasless?.paymasterUrl && {
          overrides: {
            bundlerUrl: config.gasless.paymasterUrl,
          },
        }),
      });

      // Connect with the provided signer as personal account
      const smartAccount = await wallet.connect({
        client: config.client,
        personalAccount: signer,
      });

      // Check if the smart wallet is deployed on-chain
      try {
        // Get the smart wallet address
        const smartWalletAddress = smartAccount.address;

        // Check if there's code at the address (deployed contract)
        const { eth_getCode, getRpcClient } = await import('thirdweb/rpc');
        const rpcRequest = getRpcClient({ client: config.client, chain: config.chain });
        const bytecode = await eth_getCode(rpcRequest, {
          address: smartWalletAddress,
        });

        setIsDeployed(bytecode !== undefined && bytecode !== '0x' && bytecode !== '0x0');
        console.log('Smart wallet deployed:', bytecode !== undefined && bytecode !== '0x');
      } catch (error) {
        console.warn('Could not check wallet deployment status:', error);
        setIsDeployed(false);
      }

      setAccount(smartAccount);
      console.log('Smart wallet connected successfully:', smartAccount.address);
    } catch (error) {
      console.error('Failed to connect smart wallet:', error);
      throw new Error(`Smart wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Disconnect smart wallet
   */
  const disconnect = () => {
    setAccount(undefined);
    setIsDeployed(false);
  };

  /**
   * Send a gasless transaction
   */
  const sendTransaction = async (tx: {
    to: string;
    data: string;
    value?: string;
  }): Promise<string> => {
    if (!account) {
      throw new Error('Smart wallet not connected');
    }

    try {
      console.log('Sending transaction:', { to: tx.to, gasless: isGasless });

      // Import thirdweb transaction functions
      const { prepareTransaction, sendTransaction: send } = await import('thirdweb');

      // Prepare the transaction (synchronous in thirdweb v5)
      const transaction = prepareTransaction({
        client: config.client,
        chain: config.chain,
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : 0n,
      });

      // Send transaction through smart account
      // Gas sponsorship is automatically handled if sponsorGas was enabled
      const result = await send({
        transaction,
        account,
      });

      // Wait for the transaction hash to be resolved
      const txHash = await result.transactionHash;
      console.log('Transaction sent successfully:', txHash);

      // Track gas usage if app identifier is provided
      if (config.appIdentifier && (config.gasTracking?.enabled !== false)) {
        // Import gas tracking functions (don't await - track in background)
        trackGasUsageInBackground(txHash);
      }

      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Track gas usage in background (non-blocking)
   */
  const trackGasUsageInBackground = async (txHash: string) => {
    try {
      // Dynamically import gas tracking to avoid bundle bloat
      const { trackTransactionGasUsage } = await import('@varity-labs/sdk/tracking');

      if (!config.appIdentifier || !account) {
        return;
      }

      // Track in background - don't wait for completion
      trackTransactionGasUsage(
        config.client,
        config.chain,
        txHash,
        config.appIdentifier.appId,
        config.appIdentifier.developerWallet,
        account.address,
        {
          apiUrl: config.gasTracking?.apiUrl,
          enabled: config.gasTracking?.enabled !== false,
        }
      ).catch(error => {
        // Log error but don't throw - tracking failure shouldn't affect user flow
        console.warn('[SmartWallet] Failed to track gas usage:', error);
      });
    } catch (error) {
      console.warn('[SmartWallet] Gas tracking module not available:', error);
    }
  };

  /**
   * Send batch transactions
   */
  const sendBatchTransaction = async (txs: {
    to: string;
    data: string;
    value?: string;
  }[]): Promise<string> => {
    if (!account) {
      throw new Error('Smart wallet not connected');
    }

    try {
      console.log('Sending batch transaction:', txs.length, 'operations');

      // Import thirdweb functions
      const { prepareTransaction, sendBatchTransaction: sendBatch } = await import('thirdweb');

      // Prepare all transactions (synchronous in thirdweb v5)
      const transactions = txs.map(tx =>
        prepareTransaction({
          client: config.client,
          chain: config.chain,
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: tx.value ? BigInt(tx.value) : 0n,
        })
      );

      // Send batch through smart account
      const result = await sendBatch({
        transactions,
        account,
      });

      // Wait for the transaction hash to be resolved
      const txHash = await result.transactionHash;
      console.log('Batch transaction sent successfully:', txHash);

      // Track gas usage if app identifier is provided
      if (config.appIdentifier && (config.gasTracking?.enabled !== false)) {
        // Track in background
        trackGasUsageInBackground(txHash);
      }

      return txHash;
    } catch (error) {
      console.error('Batch transaction failed:', error);
      throw new Error(`Batch transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Get smart wallet address
   */
  const getAddress = (): string | undefined => {
    return account?.address;
  };

  /**
   * Deploy smart wallet
   */
  const deployWallet = async (): Promise<string> => {
    if (!account) {
      throw new Error('Smart wallet not connected');
    }

    if (isDeployed) {
      console.log('Wallet already deployed');
      return account.address;
    }

    try {
      console.log('Deploying smart wallet...');

      // Import thirdweb functions
      const { prepareContractCall, sendTransaction: send, getContract } = await import('thirdweb');

      // If factory address is provided, use it to deploy
      if (config.factoryAddress) {
        // Get the factory contract
        const factory = getContract({
          client: config.client,
          chain: config.chain,
          address: config.factoryAddress,
        });

        // Prepare deployment transaction
        // Note: This assumes the factory has a deploy() or similar method
        // Adjust based on actual VarityWalletFactory implementation
        const deployTx = prepareContractCall({
          contract: factory,
          method: 'function createWallet(address owner, bytes32 salt) returns (address)',
          params: [account.address, `0x${Date.now().toString(16).padStart(64, '0')}`],
        });

        // Send deployment transaction
        const result = await send({
          transaction: deployTx,
          account,
        });

        console.log('Wallet deployed via factory:', result.transactionHash);
        setIsDeployed(true);
        return result.transactionHash;
      } else {
        // Deploy by sending a simple transaction to trigger deployment
        // Smart wallet will deploy on first transaction
        const { prepareTransaction } = await import('thirdweb');

        const deployTx = prepareTransaction({
          client: config.client,
          chain: config.chain,
          to: account.address, // Send to self
          value: 0n,
        });

        const result = await send({
          transaction: deployTx,
          account,
        });

        console.log('Wallet deployed via self-transaction:', result.transactionHash);
        setIsDeployed(true);
        return result.transactionHash;
      }
    } catch (error) {
      console.error('Wallet deployment failed:', error);
      throw new Error(`Wallet deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const value: SmartWalletContextType = {
    account,
    isConnected,
    isGasless,
    connect,
    disconnect,
    sendTransaction,
    sendBatchTransaction,
    getAddress,
    isDeployed,
    deployWallet,
  };

  return (
    <SmartWalletContext.Provider value={value}>
      {children}
    </SmartWalletContext.Provider>
  );
}

/**
 * Hook to use Smart Wallet context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sendTransaction, isGasless } = useSmartWallet();
 *
 *   const handleClick = async () => {
 *     const txHash = await sendTransaction({
 *       to: '0x...',
 *       data: '0x...',
 *     });
 *   };
 *
 *   return <div>Gasless: {isGasless ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useSmartWallet(): SmartWalletContextType {
  const context = useContext(SmartWalletContext);

  if (!context) {
    throw new Error('useSmartWallet must be used within SmartWalletProvider');
  }

  return context;
}

/**
 * Smart Wallet Connect Button Component
 *
 * Pre-built button to connect smart wallet
 */
export function SmartWalletConnectButton({
  onConnect,
  onError,
}: {
  onConnect?: () => void;
  onError?: (error: Error) => void;
}) {
  const { disconnect, isConnected, getAddress } = useSmartWallet();

  const handleClick = async () => {
    try {
      if (isConnected) {
        disconnect();
      } else {
        // TODO: Trigger wallet connection flow
        // This would integrate with Privy, thirdweb Connect, or other auth
        console.log('Connect wallet...');
        onConnect?.();
      }
    } catch (error) {
      console.error('Smart wallet connection error:', error);
      onError?.(error as Error);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '12px 24px',
        backgroundColor: isConnected ? '#ef4444' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {isConnected ? `Disconnect (${getAddress()?.slice(0, 6)}...)` : 'Connect Smart Wallet'}
    </button>
  );
}

/**
 * Gasless Badge Component
 *
 * Shows gasless transaction status
 */
export function GaslessBadge() {
  const { isGasless } = useSmartWallet();

  if (!isGasless) {
    return null;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        backgroundColor: '#10b981',
        color: 'white',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      <span style={{ fontSize: '10px' }}>⚡</span>
      Gasless
    </div>
  );
}
