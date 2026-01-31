import { Router } from 'express';
import { contractsController } from '../controllers/contracts.controller';
import { validate } from '../middleware/validation.middleware';
import { strictRateLimiter } from '../middleware/rateLimit.middleware';

/**
 * Contracts Routes
 * Smart contract deployment, interaction, and IPFS operations
 */
const router: Router = Router();

/**
 * @route   POST /api/v1/contracts/deploy
 * @desc    Deploy a smart contract
 * @access  Private
 */
router.post(
  '/deploy',
  strictRateLimiter,
  validate({
    body: {
      contractType: { type: 'string', required: true },
      name: { type: 'string', required: true },
      symbol: { type: 'string', required: false },
      abi: { type: 'array', required: false },
      bytecode: { type: 'string', required: false },
      constructorArgs: { type: 'array', required: false },
      privateKey: { type: 'string', required: false },
    },
  }),
  contractsController.deployContract
);

/**
 * @route   GET /api/v1/contracts/:address
 * @desc    Get contract details
 * @access  Public
 */
router.get(
  '/:address',
  contractsController.getContract
);

/**
 * @route   POST /api/v1/contracts/:address/read
 * @desc    Read from a smart contract
 * @access  Public
 */
router.post(
  '/:address/read',
  validate({
    body: {
      abi: { type: 'array', required: true },
      functionName: { type: 'string', required: true },
      args: { type: 'array', required: false },
    },
  }),
  contractsController.readContract
);

/**
 * @route   POST /api/v1/contracts/:address/call
 * @desc    Call a smart contract function (write operation)
 * @access  Private
 */
router.post(
  '/:address/call',
  strictRateLimiter,
  validate({
    body: {
      abi: { type: 'array', required: true },
      functionName: { type: 'string', required: true },
      args: { type: 'array', required: false },
      privateKey: { type: 'string', required: false },
    },
  }),
  contractsController.callContract
);

/**
 * @route   GET /api/v1/contracts/:address/events
 * @desc    Query contract events
 * @access  Public
 */
router.get(
  '/:address/events',
  contractsController.getContractEvents
);

/**
 * @route   GET /api/v1/contracts/:address/abi
 * @desc    Get contract ABI (if verified)
 * @access  Public
 */
router.get(
  '/:address/abi',
  contractsController.getContractAbi
);

/**
 * @route   POST /api/v1/contracts/ipfs/upload
 * @desc    Upload data to IPFS
 * @access  Private
 */
router.post(
  '/ipfs/upload',
  strictRateLimiter,
  validate({
    body: {
      data: { required: true },
    },
  }),
  contractsController.uploadToIPFS
);

/**
 * @route   POST /api/v1/contracts/ipfs/download
 * @desc    Download data from IPFS
 * @access  Public
 */
router.post(
  '/ipfs/download',
  validate({
    body: {
      uri: { type: 'string', required: true },
    },
  }),
  contractsController.downloadFromIPFS
);

export default router;
