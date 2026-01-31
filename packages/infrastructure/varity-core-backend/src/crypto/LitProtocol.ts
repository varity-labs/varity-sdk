/**
 * Lit Protocol Client - Production Encryption and Access Control
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Implements wallet-based encryption for Varity's 3-layer storage architecture
 * using Lit Protocol SDK for decentralized access control
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork, LIT_RPC } from '@lit-protocol/constants';
import {
  createSiweMessage,
  generateAuthSig,
  LitAbility,
  LitActionResource,
} from '@lit-protocol/auth-helpers';
import * as LitJsSdk from '@lit-protocol/encryption';
import { ethers } from 'ethers';
import {
  LitEncryptionConfig,
  AccessControlCondition,
  StorageError,
} from '../types';
import logger from '../utils/logger';

export interface EncryptionResult {
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: AccessControlCondition[];
}

export interface DecryptionResult {
  decryptedData: string;
}

export interface AuthSignature {
  sig: string;
  derivedVia: string;
  signedMessage: string;
  address: string;
}

/**
 * Access Control Condition Builder
 */
export class AccessControlBuilder {
  private conditions: any[] = [];
  private operators: string[] = [];

  /**
   * Add wallet ownership condition
   */
  walletOwnership(walletAddress: string, chain: string = 'ethereum'): this {
    this.conditions.push({
      conditionType: 'evmBasic',
      contractAddress: '',
      standardContractType: '',
      chain,
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: walletAddress.toLowerCase(),
      },
    });
    return this;
  }

  /**
   * Add NFT ownership condition
   */
  nftOwnership(
    contractAddress: string,
    tokenId: string,
    chain: string = 'ethereum'
  ): this {
    this.conditions.push({
      conditionType: 'evmBasic',
      contractAddress,
      standardContractType: 'ERC721',
      chain,
      method: 'ownerOf',
      parameters: [tokenId],
      returnValueTest: {
        comparator: '=',
        value: ':userAddress',
      },
    });
    return this;
  }

  /**
   * Add ERC-20 token balance condition
   */
  tokenBalance(
    contractAddress: string,
    minBalance: string,
    chain: string = 'ethereum'
  ): this {
    this.conditions.push({
      conditionType: 'evmBasic',
      contractAddress,
      standardContractType: 'ERC20',
      chain,
      method: 'balanceOf',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '>=',
        value: minBalance,
      },
    });
    return this;
  }

  /**
   * Add time-based condition
   */
  timelock(expirationTimestamp: number, chain: string = 'ethereum'): this {
    this.conditions.push({
      conditionType: 'evmBasic',
      contractAddress: '',
      standardContractType: '',
      chain,
      method: 'eth_getBlockByNumber',
      parameters: ['latest'],
      returnValueTest: {
        comparator: '<=',
        value: expirationTimestamp.toString(),
      },
    });
    return this;
  }

  /**
   * Add custom contract call condition
   */
  customContract(
    contractAddress: string,
    method: string,
    parameters: any[],
    returnValueTest: { comparator: string; value: string },
    chain: string = 'ethereum'
  ): this {
    this.conditions.push({
      conditionType: 'evmContract',
      contractAddress,
      functionName: method,
      functionParams: parameters,
      functionAbi: {
        type: 'function',
        name: method,
        inputs: [],
        outputs: [],
      },
      chain,
      returnValueTest,
    });
    return this;
  }

  /**
   * Add OR operator between conditions
   */
  or(): this {
    if (this.conditions.length > 0) {
      this.operators.push('or');
    }
    return this;
  }

  /**
   * Add AND operator between conditions
   */
  and(): this {
    if (this.conditions.length > 0) {
      this.operators.push('and');
    }
    return this;
  }

  /**
   * Build final access control conditions array
   */
  build(): any[] {
    if (this.conditions.length === 0) {
      throw new Error('At least one access control condition is required');
    }

    if (this.conditions.length === 1) {
      return this.conditions;
    }

    // Interleave conditions with operators
    const result: any[] = [];
    for (let i = 0; i < this.conditions.length; i++) {
      result.push(this.conditions[i]);
      if (i < this.operators.length) {
        result.push({ operator: this.operators[i] });
      }
    }

    return result;
  }
}

/**
 * Production Lit Protocol Client
 */
export class LitProtocolClient {
  private litNodeClient: LitNodeClient | null = null;
  private initialized: boolean = false;
  private network: LitNetwork = LitNetwork.DatilTest; // Use DatilTest for testing, Datil for production

  constructor(network?: LitNetwork) {
    if (network) {
      this.network = network;
    }
    logger.info('LitProtocolClient initializing...', { network: this.network });
  }

  /**
   * Initialize Lit Protocol SDK and connect to network
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        logger.info('Lit Protocol client already initialized');
        return;
      }

      logger.info('Connecting to Lit Protocol network...', {
        network: this.network,
      });

      // Initialize Lit Node Client
      this.litNodeClient = new LitNodeClient({
        litNetwork: this.network,
        debug: false,
      });

      // Connect to Lit Network
      await this.litNodeClient.connect();

      this.initialized = true;

      logger.info('Lit Protocol client initialized successfully', {
        network: this.network,
        ready: await this.litNodeClient.ready,
      });
    } catch (error: any) {
      logger.error('Failed to initialize Lit Protocol', {
        error: error.message,
        stack: error.stack,
      });
      throw new StorageError('Failed to initialize Lit Protocol', error);
    }
  }

  /**
   * Ensure client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.litNodeClient) {
      await this.initialize();
    }
  }

  /**
   * Generate authentication signature for wallet
   */
  async generateAuthSignature(
    privateKey: string,
    chain: string = 'ethereum'
  ): Promise<AuthSignature> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const address = await wallet.getAddress();

      // Create SIWE message
      const domain = 'varity.ai';
      const origin = 'https://varity.ai';
      const statement =
        'Sign this message to authenticate with Lit Protocol for Varity encryption';

      const expirationTime = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 7
      ).toISOString(); // 7 days

      const siweMessage = await createSiweMessage({
        walletAddress: address,
        nonce: await this.litNodeClient!.getLatestBlockhash(),
        domain,
        origin,
        statement,
        expirationTime,
        resources: [
          {
            resource: new LitActionResource('*'),
            ability: LitAbility.LitActionExecution,
          },
        ],
      });

      // Sign the message
      const signature = await wallet.signMessage(siweMessage);

      const authSig: AuthSignature = {
        sig: signature,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: siweMessage,
        address: address.toLowerCase(),
      };

      logger.info('Authentication signature generated', {
        address: authSig.address,
      });

      return authSig;
    } catch (error: any) {
      logger.error('Failed to generate auth signature', {
        error: error.message,
      });
      throw new StorageError('Failed to generate auth signature', error);
    }
  }

  /**
   * Encrypt data with Lit Protocol access control
   */
  async encryptData(
    data: string,
    accessControlConditions: any[],
    chain: string = 'ethereum'
  ): Promise<EncryptionResult> {
    try {
      await this.ensureInitialized();

      logger.info('Encrypting data with Lit Protocol...', {
        dataSize: data.length,
        conditionsCount: accessControlConditions.length,
        chain,
      });

      // Encrypt the string using Lit Protocol
      const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
        {
          accessControlConditions,
          dataToEncrypt: data,
        },
        this.litNodeClient!
      );

      logger.info('Data encrypted successfully', {
        ciphertextLength: ciphertext.length,
        dataToEncryptHash,
      });

      return {
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
      };
    } catch (error: any) {
      logger.error('Encryption failed', {
        error: error.message,
        stack: error.stack,
      });
      throw new StorageError('Failed to encrypt data with Lit Protocol', error);
    }
  }

  /**
   * Decrypt data with Lit Protocol (requires authentication)
   */
  async decryptData(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: any[],
    authSig: AuthSignature,
    chain: string = 'ethereum'
  ): Promise<DecryptionResult> {
    try {
      await this.ensureInitialized();

      logger.info('Decrypting data with Lit Protocol...', {
        ciphertextLength: ciphertext.length,
        dataToEncryptHash,
        walletAddress: authSig.address,
        chain,
      });

      // Decrypt the string using Lit Protocol
      const decryptedString = await LitJsSdk.decryptToString(
        {
          accessControlConditions,
          ciphertext,
          dataToEncryptHash,
          authSig,
          chain,
        },
        this.litNodeClient!
      );

      logger.info('Data decrypted successfully', {
        decryptedSize: decryptedString.length,
      });

      return {
        decryptedData: decryptedString,
      };
    } catch (error: any) {
      logger.error('Decryption failed', {
        error: error.message,
        stack: error.stack,
        walletAddress: authSig.address,
      });

      // Check if access denied
      if (
        error.message.includes('not authorized') ||
        error.message.includes('access denied')
      ) {
        throw new StorageError(
          'Access denied: wallet does not meet access control conditions',
          error
        );
      }

      throw new StorageError('Failed to decrypt data with Lit Protocol', error);
    }
  }

  /**
   * Encrypt buffer data (for file encryption)
   */
  async encryptBuffer(
    buffer: Buffer,
    accessControlConditions: any[],
    chain: string = 'ethereum'
  ): Promise<EncryptionResult> {
    const base64Data = buffer.toString('base64');
    return this.encryptData(base64Data, accessControlConditions, chain);
  }

  /**
   * Decrypt to buffer (for file decryption)
   */
  async decryptToBuffer(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: any[],
    authSig: AuthSignature,
    chain: string = 'ethereum'
  ): Promise<Buffer> {
    const result = await this.decryptData(
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
      authSig,
      chain
    );
    return Buffer.from(result.decryptedData, 'base64');
  }

  /**
   * Create access control conditions for Varity Internal Storage (Layer 1)
   */
  createVarityInternalConditions(
    adminWallets: string[],
    chain: string = 'ethereum'
  ): any[] {
    if (adminWallets.length === 0) {
      throw new Error('At least one admin wallet is required');
    }

    // Create OR conditions for multiple admin wallets
    const builder = new AccessControlBuilder();
    adminWallets.forEach((wallet, index) => {
      builder.walletOwnership(wallet, chain);
      if (index < adminWallets.length - 1) {
        builder.or();
      }
    });

    return builder.build();
  }

  /**
   * Create access control conditions for Industry RAG Storage (Layer 2)
   */
  createIndustryRagConditions(
    industryRegistryContract: string,
    industry: string,
    chain: string = 'ethereum'
  ): any[] {
    // Industry members can access through registry contract
    return new AccessControlBuilder()
      .customContract(
        industryRegistryContract,
        'isIndustryMember',
        [':userAddress', industry],
        { comparator: '=', value: 'true' },
        chain
      )
      .build();
  }

  /**
   * Create access control conditions for Customer Data (Layer 3)
   */
  createCustomerDataConditions(
    customerWallet: string,
    emergencyWallets: string[] = [],
    chain: string = 'ethereum'
  ): any[] {
    const builder = new AccessControlBuilder();

    // Primary customer wallet
    builder.walletOwnership(customerWallet, chain);

    // Add emergency admin wallets with OR
    emergencyWallets.forEach((wallet) => {
      builder.or().walletOwnership(wallet, chain);
    });

    return builder.build();
  }

  /**
   * Create time-limited access conditions
   */
  createTemporaryAccessConditions(
    walletAddress: string,
    expirationTimestamp: number,
    chain: string = 'ethereum'
  ): any[] {
    return new AccessControlBuilder()
      .walletOwnership(walletAddress, chain)
      .and()
      .timelock(expirationTimestamp, chain)
      .build();
  }

  /**
   * Create NFT-gated access conditions
   */
  createNFTGatedConditions(
    nftContract: string,
    tokenId: string,
    chain: string = 'ethereum'
  ): any[] {
    return new AccessControlBuilder()
      .nftOwnership(nftContract, tokenId, chain)
      .build();
  }

  /**
   * Verify if wallet meets access control conditions (simulation)
   */
  async verifyAccess(
    walletAddress: string,
    accessControlConditions: any[]
  ): Promise<boolean> {
    try {
      // This is a simplified check - in production, Lit Protocol handles this
      for (const condition of accessControlConditions) {
        if (condition.operator) continue; // Skip operators

        if (condition.returnValueTest) {
          const testValue = condition.returnValueTest.value;
          const comparator = condition.returnValueTest.comparator;

          // Check wallet address match
          if (
            testValue.toLowerCase() === walletAddress.toLowerCase() &&
            comparator === '='
          ) {
            return true;
          }
        }
      }

      return false;
    } catch (error: any) {
      logger.error('Access verification failed', {
        error: error.message,
        walletAddress,
      });
      return false;
    }
  }

  /**
   * Disconnect from Lit Protocol network
   */
  async disconnect(): Promise<void> {
    try {
      if (this.litNodeClient) {
        await this.litNodeClient.disconnect();
        this.initialized = false;
        logger.info('Disconnected from Lit Protocol network');
      }
    } catch (error: any) {
      logger.error('Failed to disconnect from Lit Protocol', {
        error: error.message,
      });
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo(): { network: LitNetwork; initialized: boolean } {
    return {
      network: this.network,
      initialized: this.initialized,
    };
  }

  /**
   * Estimate decryption cost
   */
  estimateDecryptionCost(decryptionsPerMonth: number): number {
    // Lit Protocol charges approximately $0.0001 per decryption request
    const costPerDecryption = 0.0001;
    return decryptionsPerMonth * costPerDecryption;
  }
}

export default LitProtocolClient;
