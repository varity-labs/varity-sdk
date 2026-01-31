import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware';
import { thirdwebService } from '../services/thirdweb.service';
import { logger } from '../config/logger.config';

/**
 * Contracts Controller
 * Handles smart contract deployment, reading, and writing via Thirdweb
 */
export class ContractsController {
  /**
   * Deploy a smart contract
   * POST /api/v1/contracts/deploy
   *
   * Request Body:
   * {
   *   "contractType": "ERC721" | "ERC20" | "ERC1155" | "custom",
   *   "name": "MyContract",
   *   "symbol": "MYC", (optional)
   *   "abi": [...], (required for custom contracts)
   *   "bytecode": "0x...", (required for custom contracts)
   *   "constructorArgs": [...], (optional)
   *   "privateKey": "0x..." (optional - uses service default if not provided)
   * }
   */
  deployContract = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contractType, name, symbol, abi, bytecode, constructorArgs, privateKey } = req.body;

    if (!contractType || !name) {
      throw new ValidationError('Contract type and name are required');
    }

    // Validate required fields for custom contracts
    if (contractType === 'custom') {
      if (!abi || !bytecode) {
        throw new ValidationError('ABI and bytecode are required for custom contracts');
      }
    }

    // Initialize Thirdweb service with private key if provided
    if (privateKey) {
      await thirdwebService.initialize(privateKey);
    } else if (!thirdwebService.isReady()) {
      throw new ValidationError('Private key required for contract deployment');
    }

    try {
      // For standard contract types, you would fetch pre-built ABIs/bytecode
      // For this implementation, we'll require custom contracts with ABI/bytecode
      if (contractType !== 'custom') {
        throw new ValidationError(
          'Standard contract types (ERC721, ERC20, ERC1155) coming soon. Use contractType: "custom" with ABI and bytecode.'
        );
      }

      const result = await thirdwebService.deployContract({
        name,
        abi,
        bytecode,
        constructorArgs,
      });

      logger.info('Contract deployed via API', {
        user: req.user?.address,
        contractName: name,
        address: result.address,
      });

      res.status(201).json({
        success: true,
        data: {
          address: result.address,
          deployed: result.deployed,
          method: result.method,
          transactionHash: result.transactionHash,
          contractType,
          name,
          chainId: 33529,
          network: 'Varity L3 Testnet',
        },
      });
    } catch (error: any) {
      logger.error('Contract deployment failed', error);
      throw new Error(`Contract deployment failed: ${error.message}`);
    }
  });

  /**
   * Get contract details
   * GET /api/v1/contracts/:address
   */
  getContract = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid contract address is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const contract = await thirdwebService.getContract(address);

      res.status(200).json({
        success: true,
        data: {
          address,
          chainId: 33529,
          network: 'Varity L3 Testnet',
          contract: {
            address: contract.address,
            chain: contract.chain,
          },
        },
      });
    } catch (error: any) {
      logger.error('Failed to get contract', { address, error });
      throw new NotFoundError(`Contract not found at address ${address}`);
    }
  });

  /**
   * Read from a smart contract
   * POST /api/v1/contracts/:address/read
   *
   * Request Body:
   * {
   *   "abi": [...],
   *   "functionName": "balanceOf",
   *   "args": ["0x..."]
   * }
   */
  readContract = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    const { abi, functionName, args } = req.body;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid contract address is required');
    }

    if (!abi || !functionName) {
      throw new ValidationError('ABI and function name are required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const result = await thirdwebService.readContract({
        address,
        abi,
        functionName,
        args,
      });

      logger.info('Contract read successful', {
        user: req.user?.address,
        address,
        functionName,
      });

      res.status(200).json({
        success: true,
        data: {
          result,
          address,
          functionName,
          chainId: 33529,
        },
      });
    } catch (error: any) {
      logger.error('Contract read failed', { address, functionName, error });
      throw new Error(`Contract read failed: ${error.message}`);
    }
  });

  /**
   * Call a smart contract function (write operation)
   * POST /api/v1/contracts/:address/call
   *
   * Request Body:
   * {
   *   "abi": [...],
   *   "functionName": "transfer",
   *   "args": ["0x...", "1000"],
   *   "privateKey": "0x..." (optional)
   * }
   */
  callContract = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    const { abi, functionName, args, privateKey } = req.body;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid contract address is required');
    }

    if (!abi || !functionName) {
      throw new ValidationError('ABI and function name are required');
    }

    // Initialize with private key if provided
    if (privateKey) {
      await thirdwebService.initialize(privateKey);
    } else if (!thirdwebService.isReady()) {
      throw new ValidationError('Private key required for contract write operations');
    }

    try {
      const result = await thirdwebService.writeContract({
        address,
        abi,
        functionName,
        args,
      });

      logger.info('Contract call successful', {
        user: req.user?.address,
        address,
        functionName,
        transactionHash: result.transactionHash,
      });

      res.status(200).json({
        success: true,
        data: {
          transactionHash: result.transactionHash,
          address,
          functionName,
          chainId: 33529,
        },
      });
    } catch (error: any) {
      logger.error('Contract call failed', { address, functionName, error });
      throw new Error(`Contract call failed: ${error.message}`);
    }
  });

  /**
   * Upload data to IPFS
   * POST /api/v1/contracts/ipfs/upload
   *
   * Request Body:
   * {
   *   "data": { ... } | "string" | File
   * }
   */
  uploadToIPFS = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { data } = req.body;

    if (!data) {
      throw new ValidationError('Data is required for IPFS upload');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const uri = await thirdwebService.uploadToIPFS(data);

      logger.info('IPFS upload successful', {
        user: req.user?.address,
        uri,
      });

      res.status(200).json({
        success: true,
        data: {
          uri,
          ipfsHash: uri.split('://')[1],
        },
      });
    } catch (error: any) {
      logger.error('IPFS upload failed', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  });

  /**
   * Download data from IPFS
   * POST /api/v1/contracts/ipfs/download
   *
   * Request Body:
   * {
   *   "uri": "ipfs://..."
   * }
   */
  downloadFromIPFS = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { uri } = req.body;

    if (!uri) {
      throw new ValidationError('URI is required for IPFS download');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const data = await thirdwebService.downloadFromIPFS(uri);

      logger.info('IPFS download successful', {
        user: req.user?.address,
        uri,
      });

      res.status(200).json({
        success: true,
        data: {
          data,
          uri,
        },
      });
    } catch (error: any) {
      logger.error('IPFS download failed', { uri, error });
      throw new Error(`IPFS download failed: ${error.message}`);
    }
  });

  /**
   * Get contract events
   * GET /api/v1/contracts/:address/events
   *
   * Query Parameters:
   * - fromBlock: Starting block number (optional)
   * - toBlock: Ending block number (optional)
   * - eventName: Filter by event name (optional)
   */
  getContractEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    const { fromBlock, toBlock, eventName } = req.query;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid contract address is required');
    }

    if (!thirdwebService.isReady()) {
      await thirdwebService.initialize();
    }

    try {
      const events = await thirdwebService.getContractEvents({
        address,
        fromBlock: fromBlock ? Number(fromBlock) : undefined,
        toBlock: toBlock ? Number(toBlock) : 'latest',
        eventName: eventName as string | undefined,
      });

      logger.info('Contract events retrieved', {
        user: req.user?.address,
        address,
        eventCount: events.length,
      });

      res.status(200).json({
        success: true,
        data: {
          address,
          events,
          count: events.length,
          fromBlock,
          toBlock,
          eventName,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get contract events', { address, error });
      throw new Error(`Failed to get contract events: ${error.message}`);
    }
  });

  /**
   * Get contract ABI
   * GET /api/v1/contracts/:address/abi
   */
  getContractAbi = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Valid contract address is required');
    }

    try {
      // This would typically fetch from a block explorer API or verified contracts database
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        data: {
          address,
          verified: false,
          message: 'ABI retrieval from block explorer coming soon. Please provide ABI manually for now.',
        },
      });
    } catch (error: any) {
      logger.error('Failed to get contract ABI', { address, error });
      throw new Error(`Failed to get contract ABI: ${error.message}`);
    }
  });
}

export const contractsController = new ContractsController();
export default contractsController;
