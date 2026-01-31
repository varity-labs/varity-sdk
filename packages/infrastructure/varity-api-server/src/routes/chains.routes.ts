import { Router } from 'express';
import { chainsController } from '../controllers/chains.controller';
import { validate } from '../middleware/validation.middleware';

/**
 * Chains Routes
 * Chain information, validation, and block/transaction queries
 */
const router: Router = Router();

/**
 * @route   GET /api/v1/chains
 * @desc    Get Varity L3 chain information
 * @access  Public
 */
router.get(
  '/',
  chainsController.getChainInfo
);

/**
 * @route   GET /api/v1/chains/supported
 * @desc    Get list of supported chains
 * @access  Public
 */
router.get(
  '/supported',
  chainsController.getSupportedChains
);

/**
 * @route   POST /api/v1/chains/validate
 * @desc    Validate a chain ID
 * @access  Public
 */
router.post(
  '/validate',
  validate({
    body: {
      chainId: { type: 'number', required: true },
    },
  }),
  chainsController.validateChainId
);

/**
 * @route   GET /api/v1/chains/:chainId
 * @desc    Get specific chain details
 * @access  Public
 */
router.get(
  '/:chainId',
  chainsController.getChainById
);

/**
 * @route   GET /api/v1/chains/:chainId/block/:blockNumber
 * @desc    Get block information
 * @access  Public
 */
router.get(
  '/:chainId/block/:blockNumber',
  chainsController.getBlock
);

/**
 * @route   GET /api/v1/chains/:chainId/tx/:hash
 * @desc    Get transaction information
 * @access  Public
 */
router.get(
  '/:chainId/tx/:hash',
  chainsController.getTransaction
);

/**
 * @route   GET /api/v1/chains/:chainId/gas
 * @desc    Get current gas prices
 * @access  Public
 */
router.get(
  '/:chainId/gas',
  chainsController.getGasPrice
);

export default router;
