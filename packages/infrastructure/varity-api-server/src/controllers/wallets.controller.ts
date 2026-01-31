import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { thirdwebService } from '../services/thirdweb.service';
import { logger } from '../config/logger.config';

/**
 * Wallets Controller
 * Handles wallet balance, NFTs, tokens, and transaction operations
 */
export class WalletsController {
  /**
   * Get wallet balance
   * GET /api/v1/wallets/:address/balance
   */
  getBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid wallet address is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const balance = await thirdwebService.getBalance(address);

      // Convert bigint balance to human-readable format
      // Balance is in wei (18 decimals for ETH/native token)
      const balanceBigInt = BigInt(balance.toString());
      const decimals = 18;
      const divisor = BigInt(10 ** decimals);
      const displayBalance = (Number(balanceBigInt) / Number(divisor)).toFixed(6);

      logger.info('Wallet balance retrieved', {
        user: req.user?.address,
        walletAddress: address,
        balance: balance.toString(),
      });

      res.status(200).json({
        success: true,
        data: {
          address,
          balance: balance.toString(),
          displayBalance,
          symbol: 'ETH',
          decimals,
          chainId: 33529,
          currency: 'ETH',
        },
      });
    } catch (error: any) {
      logger.error('Failed to get wallet balance', { address, error });
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  });

  /**
   * Get wallet NFTs
   * GET /api/v1/wallets/:address/nfts
   *
   * Query Parameters:
   * - limit: Number of NFTs to return (default: 50)
   * - offset: Pagination offset (default: 0)
   */
  getNFTs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid wallet address is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const nfts = await thirdwebService.getNFTs(address, { limit, offset });

      logger.info('Wallet NFTs retrieved', {
        user: req.user?.address,
        walletAddress: address,
        nftCount: nfts.length,
      });

      res.status(200).json({
        success: true,
        data: {
          address,
          nfts,
          count: nfts.length,
          limit,
          offset,
          chainId: 33529,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get wallet NFTs', { address, error });
      throw new Error(`Failed to get wallet NFTs: ${error.message}`);
    }
  });

  /**
   * Get wallet transactions
   * GET /api/v1/wallets/:address/transactions
   *
   * Query Parameters:
   * - limit: Number of transactions to return (default: 50)
   * - offset: Pagination offset (default: 0)
   */
  getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid wallet address is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const transactions = await thirdwebService.getTransactionHistory(address, {
        limit,
        offset,
      });

      logger.info('Wallet transactions retrieved', {
        user: req.user?.address,
        walletAddress: address,
        transactionCount: transactions.length,
      });

      res.status(200).json({
        success: true,
        data: {
          address,
          transactions,
          count: transactions.length,
          limit,
          offset,
          chainId: 33529,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get wallet transactions', { address, error });
      throw new Error(`Failed to get wallet transactions: ${error.message}`);
    }
  });

  /**
   * Get wallet token balances
   * GET /api/v1/wallets/:address/tokens
   */
  getTokenBalances = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid wallet address is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const tokens = await thirdwebService.getTokenBalances(address);

      logger.info('Wallet token balances retrieved', {
        user: req.user?.address,
        walletAddress: address,
        tokenCount: tokens.length,
      });

      res.status(200).json({
        success: true,
        data: {
          address,
          tokens,
          count: tokens.length,
          chainId: 33529,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get wallet token balances', { address, error });
      throw new Error(`Failed to get wallet token balances: ${error.message}`);
    }
  });

  /**
   * Send transaction from wallet
   * POST /api/v1/wallets/:address/send
   *
   * Request Body:
   * {
   *   "to": "0x...",
   *   "amount": "1.5",
   *   "token": "0x..." (optional - ERC20 token address),
   *   "privateKey": "0x..."
   * }
   */
  sendTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    const { to, amount, token, privateKey } = req.body;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid wallet address is required');
    }

    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid recipient address is required');
    }

    if (!amount || isNaN(parseFloat(amount))) {
      throw new ValidationError('Valid amount is required');
    }

    if (!privateKey) {
      throw new ValidationError('Private key is required for sending transactions');
    }

    // Initialize with private key
    await thirdwebService.initialize(privateKey);

    try {
      const result = await thirdwebService.sendTransaction({
        from: address,
        to,
        amount,
        token,
      });

      logger.info('Transaction sent successfully', {
        user: req.user?.address,
        from: address,
        to,
        amount,
        transactionHash: result.transactionHash,
      });

      res.status(200).json({
        success: true,
        data: {
          transactionHash: result.transactionHash,
          from: address,
          to,
          amount,
          token: token || 'USDC',
          chainId: 33529,
        },
      });
    } catch (error: any) {
      logger.error('Failed to send transaction', { address, to, amount, error });
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  });
}

export const walletsController = new WalletsController();
export default walletsController;
