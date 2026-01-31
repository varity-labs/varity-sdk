import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { thirdwebService } from '../services/thirdweb.service';
import { envConfig } from '../config/env.config';
import { logger } from '../config/logger.config';

/**
 * Chains Controller
 * Provides chain information for Varity L3 Testnet
 */
export class ChainsController {
  /**
   * Get Varity L3 chain configuration
   * GET /api/v1/chains
   *
   * Returns complete chain configuration including:
   * - Chain ID (33529)
   * - RPC URLs
   * - Block explorer URLs
   * - Native token (USDC with 6 decimals)
   * - Network details
   */
  getChainInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Initialize Thirdweb service if not ready
    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const chainInfo = thirdwebService.getChainInfo();

      // Enhance with additional Varity-specific information
      const varietyChainInfo = {
        chainId: 33529,
        name: 'Varity L3 Testnet',
        shortName: 'varity-l3',
        network: 'varity-testnet',

        // Native currency is USDC (6 decimals - CRITICAL!)
        nativeCurrency: {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6, // CRITICAL: USDC uses 6 decimals, not 18!
        },

        // RPC endpoints
        rpc: {
          primary: envConfig.arbitrum.rpcUrl,
          public: [
            envConfig.arbitrum.rpcUrl,
          ],
          websocket: [
            envConfig.arbitrum.rpcUrl.replace('http', 'ws'),
          ],
        },

        // Block explorers
        blockExplorers: chainInfo.blockExplorers || {
          default: {
            name: 'Varity Explorer',
            url: 'https://explorer.varity.network',
          },
        },

        // Network type
        testnet: true,

        // Parent chains
        parent: {
          chain: 'arbitrum-one',
          chainId: 42161,
          type: 'L2',
        },

        // Settlement layer
        settlement: {
          layer: 'Arbitrum One',
          chainId: 42161,
          finalLayer: 'Ethereum',
          finalChainId: 1,
        },

        // Additional Varity features
        features: {
          dataAvailability: 'Celestia',
          encryption: 'Lit Protocol',
          storage: 'Filecoin/IPFS',
          compute: 'Akash Network',
          thirdwebSupport: true,
        },

        // Smart contract addresses (examples - replace with actual deployed contracts)
        contracts: {
          // These would be your deployed core contracts
          // Example:
          // multisig: '0x...',
          // treasury: '0x...',
          // governance: '0x...',
        },

        // Gas estimation
        gas: {
          standard: 21000,
          token: 'USDC',
          estimatedCostPerTx: '0.001', // in USDC
        },

        // Chain metadata
        metadata: {
          createdAt: '2025-01-14',
          version: '1.0.0',
          status: 'testnet',
          documentation: 'https://docs.varity.network',
        },
      };

      logger.info('Chain info retrieved', {
        user: req.user?.address,
        chainId: varietyChainInfo.chainId,
      });

      res.status(200).json({
        success: true,
        data: varietyChainInfo,
      });
    } catch (error: any) {
      logger.error('Failed to get chain info', error);
      throw new Error(`Failed to get chain info: ${error.message}`);
    }
  });

  /**
   * Get supported chains (currently just Varity L3)
   * GET /api/v1/chains/supported
   */
  getSupportedChains = asyncHandler(async (req: AuthRequest, res: Response) => {
    const supportedChains = [
      {
        chainId: 33529,
        name: 'Varity L3 Testnet',
        symbol: 'USDC',
        decimals: 6,
        testnet: true,
        active: true,
      },
      // Future chains can be added here
      // {
      //   chainId: 33530,
      //   name: 'Varity L3 Mainnet',
      //   symbol: 'USDC',
      //   decimals: 6,
      //   testnet: false,
      //   active: false,
      // },
    ];

    res.status(200).json({
      success: true,
      data: {
        chains: supportedChains,
        count: supportedChains.length,
      },
    });
  });

  /**
   * Validate chain ID
   * POST /api/v1/chains/validate
   *
   * Request Body:
   * {
   *   "chainId": 33529
   * }
   */
  validateChainId = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chainId } = req.body;

    if (!chainId) {
      res.status(400).json({
        success: false,
        error: 'Chain ID is required',
      });
      return;
    }

    const isValid = chainId === 33529; // Only Varity L3 Testnet is supported
    const isTestnet = chainId === 33529;

    res.status(200).json({
      success: true,
      data: {
        chainId,
        valid: isValid,
        testnet: isTestnet,
        name: isValid ? 'Varity L3 Testnet' : 'Unknown',
        supported: isValid,
      },
    });
  });

  /**
   * Get chain by ID
   * GET /api/v1/chains/:chainId
   */
  getChainById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chainId = parseInt(req.params.chainId, 10);

    if (isNaN(chainId)) {
      throw new Error('Invalid chain ID');
    }

    if (chainId !== 33529) {
      res.status(404).json({
        success: false,
        error: `Chain ${chainId} not supported. Only Varity L3 Testnet (33529) is supported.`,
      });
      return;
    }

    // Return the same info as getChainInfo
    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    const chainInfo = thirdwebService.getChainInfo();

    res.status(200).json({
      success: true,
      data: {
        chainId: 33529,
        name: 'Varity L3 Testnet',
        nativeCurrency: {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
        },
        rpc: envConfig.arbitrum.rpcUrl,
        blockExplorers: chainInfo.blockExplorers,
        testnet: true,
      },
    });
  });

  /**
   * Get block information
   * GET /api/v1/chains/:chainId/block/:blockNumber
   */
  getBlock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chainId = parseInt(req.params.chainId, 10);
    const blockNumber = req.params.blockNumber;

    if (chainId !== 33529) {
      throw new Error('Chain not supported');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const block = await thirdwebService.getBlock(blockNumber);

      res.status(200).json({
        success: true,
        data: {
          block,
          chainId,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get block', { chainId, blockNumber, error });
      throw new Error(`Failed to get block: ${error.message}`);
    }
  });

  /**
   * Get transaction information
   * GET /api/v1/chains/:chainId/tx/:hash
   */
  getTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chainId = parseInt(req.params.chainId, 10);
    const { hash } = req.params;

    if (chainId !== 33529) {
      throw new Error('Chain not supported');
    }

    if (!hash || !hash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new Error('Valid transaction hash is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const transaction = await thirdwebService.getTransaction(hash);

      res.status(200).json({
        success: true,
        data: {
          transaction,
          chainId,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get transaction', { chainId, hash, error });
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  });

  /**
   * Get current gas prices
   * GET /api/v1/chains/:chainId/gas
   */
  getGasPrice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chainId = parseInt(req.params.chainId, 10);

    if (chainId !== 33529) {
      throw new Error('Chain not supported');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const gasPrice = await thirdwebService.getGasPrice();

      res.status(200).json({
        success: true,
        data: {
          gasPrice,
          chainId,
          currency: 'USDC',
          decimals: 6,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get gas price', { chainId, error });
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  });
}

export const chainsController = new ChainsController();
export default chainsController;
