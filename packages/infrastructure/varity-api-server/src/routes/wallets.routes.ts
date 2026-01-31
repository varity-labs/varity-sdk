import { Router } from 'express';
import { walletsController } from '../controllers/wallets.controller';

/**
 * Wallets Routes
 * Wallet balance, NFTs, and transaction history
 */
const router: Router = Router();

/**
 * @route   GET /api/v1/wallets/:address/balance
 * @desc    Get wallet balance
 * @access  Public
 */
router.get(
  '/:address/balance',
  walletsController.getBalance
);

/**
 * @route   GET /api/v1/wallets/:address/nfts
 * @desc    Get wallet NFTs
 * @access  Public
 */
router.get(
  '/:address/nfts',
  walletsController.getNFTs
);

/**
 * @route   GET /api/v1/wallets/:address/transactions
 * @desc    Get wallet transaction history
 * @access  Public
 */
router.get(
  '/:address/transactions',
  walletsController.getTransactions
);

/**
 * @route   GET /api/v1/wallets/:address/tokens
 * @desc    Get wallet token balances
 * @access  Public
 */
router.get(
  '/:address/tokens',
  walletsController.getTokenBalances
);

/**
 * @route   POST /api/v1/wallets/:address/send
 * @desc    Send transaction from wallet
 * @access  Private
 */
router.post(
  '/:address/send',
  walletsController.sendTransaction
);

export default router;
