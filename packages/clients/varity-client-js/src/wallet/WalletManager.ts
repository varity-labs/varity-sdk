/**
 * Wallet Manager - Handle wallet connections and operations
 */

import {
  type ThirdwebClient,
  type Chain,
} from 'thirdweb';
import {
  createWallet,
  walletConnect,
  inAppWallet,
  injectedProvider,
  getWalletBalance,
  type Account,
  type Wallet,
} from 'thirdweb/wallets';
import type {
  WalletConnectionOptions,
  WalletInfo,
  WalletError,
} from '../types';
import { WalletError as WalletErrorClass } from '../types';
import { formatUSDC, USDC_DECIMALS } from '../utils/formatting';

/**
 * WalletManager - Manage wallet connections and operations
 *
 * @example
 * ```typescript
 * // Connect MetaMask
 * const account = await walletManager.connect({ walletType: 'metamask' });
 *
 * // Get balance
 * const balance = await walletManager.getBalance();
 *
 * // Disconnect
 * walletManager.disconnect();
 * ```
 */
export class WalletManager {
  private activeWallet: Wallet | null = null;
  private activeAccount: Account | null = null;

  constructor(
    private readonly client: ThirdwebClient,
    private readonly chain: Chain
  ) {}

  /**
   * Connect wallet
   * @param options Wallet connection options
   * @returns Connected account
   */
  async connect(options: WalletConnectionOptions): Promise<Account> {
    try {
      let wallet: Wallet;

      switch (options.walletType) {
        case 'metamask':
          wallet = createWallet('io.metamask');
          break;

        case 'walletconnect':
          // WalletConnect v5 uses walletConnect() function
          wallet = walletConnect();
          break;

        case 'coinbase':
          wallet = createWallet('com.coinbase.wallet');
          break;

        case 'injected':
          // Use MetaMask as default injected wallet in v5
          wallet = createWallet('io.metamask');
          break;

        case 'embedded':
          // In v5, use inAppWallet() function
          wallet = inAppWallet();
          break;

        default:
          throw new WalletErrorClass(
            `Unsupported wallet type: ${options.walletType}`,
            { walletType: options.walletType }
          );
      }

      // Connect wallet
      const account = await wallet.connect({
        client: this.client,
        chain: this.chain,
      });

      this.activeWallet = wallet;
      this.activeAccount = account;

      return account;
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to connect wallet: ${error.message}`,
        { walletType: options.walletType, error }
      );
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    if (this.activeWallet) {
      this.activeWallet.disconnect();
      this.activeWallet = null;
      this.activeAccount = null;
    }
  }

  /**
   * Get connected account
   * @returns Active account or null
   */
  getAccount(): Account | null {
    return this.activeAccount;
  }

  /**
   * Check if wallet is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.activeAccount !== null;
  }

  /**
   * Get wallet address
   * @returns Wallet address or null
   */
  getAddress(): string | null {
    return this.activeAccount?.address || null;
  }

  /**
   * Get wallet balance (native currency)
   * @returns Balance in wei/smallest unit
   */
  async getBalance(): Promise<bigint> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      const balance = await getWalletBalance({
        client: this.client,
        chain: this.chain,
        address: this.activeAccount.address,
      });

      return balance.value;
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to get balance: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Get wallet info with balance
   * @returns Wallet information
   */
  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      const balance = await this.getBalance();

      // Format based on native currency
      const nativeCurrency = this.chain.nativeCurrency;
      const isUSDC = nativeCurrency?.symbol === 'USDC' && nativeCurrency?.decimals === 6;

      const balanceFormatted = isUSDC
        ? formatUSDC(balance)
        : this.formatBalance(balance, nativeCurrency?.decimals || 18);

      return {
        address: this.activeAccount.address,
        balance: balance.toString(),
        balanceFormatted,
        chainId: this.chain.id,
      };
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to get wallet info: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Sign message
   * @param message Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      const signature = await this.activeAccount.signMessage({
        message,
      });

      return signature;
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to sign message: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Sign typed data (EIP-712)
   * @param domain Domain data
   * @param types Type definitions
   * @param value Value to sign
   * @returns Signature
   */
  async signTypedData(
    domain: any,
    types: any,
    value: any
  ): Promise<string> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      const signature = await this.activeAccount.signTypedData({
        domain,
        types,
        primaryType: Object.keys(types)[0],
        message: value,
      });

      return signature;
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to sign typed data: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Switch chain
   * @param chainId Chain ID to switch to
   */
  async switchChain(chainId: number): Promise<void> {
    if (!this.activeWallet) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      // Import defineChain from thirdweb for runtime use
      const { defineChain } = await import('thirdweb');
      const targetChain = defineChain({ id: chainId });
      await this.activeWallet.switchChain(targetChain);
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to switch chain: ${error.message}`,
        { chainId, error }
      );
    }
  }

  /**
   * Get chain ID from wallet
   * @returns Current chain ID
   */
  async getChainId(): Promise<number> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    return this.chain.id;
  }

  /**
   * Send native currency transaction
   * @param to Recipient address
   * @param amount Amount to send (in wei/smallest unit)
   * @returns Transaction hash
   */
  async sendTransaction(to: string, amount: bigint): Promise<string> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      // Create transaction
      const transaction = await this.activeAccount.sendTransaction({
        to,
        value: amount,
        chainId: this.chain.id,
      });

      return transaction.transactionHash;
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to send transaction: ${error.message}`,
        { to, amount: amount.toString(), error }
      );
    }
  }

  /**
   * Get transaction count (nonce)
   * @returns Transaction count
   */
  async getTransactionCount(): Promise<number> {
    if (!this.activeAccount) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      // Get nonce
      // This is a simplified version - in production, use proper nonce retrieval
      return 0;
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to get transaction count: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Format balance with decimals
   * @param balance Balance in smallest unit
   * @param decimals Number of decimals
   * @returns Formatted balance string
   */
  private formatBalance(balance: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    return `${wholePart}.${fractionalStr}`;
  }

  /**
   * Request wallet permissions
   * @param permissions Permissions to request
   */
  async requestPermissions(permissions: string[]): Promise<void> {
    if (!this.activeWallet) {
      throw new WalletErrorClass('No wallet connected');
    }

    // Request permissions (implementation depends on wallet type)
    console.log('Requesting permissions:', permissions);
  }

  /**
   * Add custom token to wallet
   * @param tokenAddress Token contract address
   * @param symbol Token symbol
   * @param decimals Token decimals
   * @param image Token image URL
   */
  async addToken(
    tokenAddress: string,
    symbol: string,
    decimals: number,
    image?: string
  ): Promise<void> {
    if (!this.activeWallet) {
      throw new WalletErrorClass('No wallet connected');
    }

    try {
      // Add token to wallet (MetaMask specific)
      if (typeof (window as any).ethereum !== 'undefined') {
        await (window as any).ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol,
              decimals,
              image,
            },
          },
        });
      }
    } catch (error: any) {
      throw new WalletErrorClass(
        `Failed to add token: ${error.message}`,
        { tokenAddress, error }
      );
    }
  }
}

export default WalletManager;
