/**
 * Varity Core Backend SDK
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Main entry point for all backend SDK functionality
 */

// Types
export * from './types';

// Services
export { ContractManager, VARITY_L3_CHAIN } from './services/ContractManager';
export type { ContractDeploymentResult } from './services/ContractManager';
export { TemplateDeployer } from './services/TemplateDeployer';
export { ZKMLEngine } from './services/ZKMLEngine';
export { OracleClient } from './services/OracleClient';

// DePIN Clients
export { FilecoinClient } from './depin/FilecoinClient';
export { AkashClient } from './depin/AkashClient';
export { CelestiaClient } from './depin/CelestiaClient';

// Crypto
export { LitProtocolClient, AccessControlBuilder } from './crypto/LitProtocol';
export {
  AccessControlManager,
  VarityAccessPresets,
  validateAccessControl,
  serializeAccessControl,
  deserializeAccessControl
} from './crypto/access-control';
export { MigrationManager, LegacyAESDecryption } from './crypto/migration/migrate-to-lit';

// Utilities
export { logger, sanitizeLogData } from './utils/logger';

// Internal imports for use within this file
import { ContractManager } from './services/ContractManager';
import { TemplateDeployer } from './services/TemplateDeployer';
import { FilecoinClient } from './depin/FilecoinClient';
import { AkashClient } from './depin/AkashClient';
import { CelestiaClient } from './depin/CelestiaClient';
import { LitProtocolClient } from './crypto/LitProtocol';

// Version
export const VERSION = '1.0.0';

/**
 * Thirdweb SDK Integration
 * Export Thirdweb utilities for external use
 */
export {
  createThirdwebClient,
  getContract as getThirdwebContract,
  defineChain,
  type ThirdwebClient,
  type Chain,
} from 'thirdweb';

export {
  privateKeyToAccount,
  type Account as ThirdwebAccount,
} from 'thirdweb/wallets';

export {
  readContract as readThirdwebContract,
  prepareContractCall,
  sendTransaction as sendThirdwebTransaction,
} from 'thirdweb';

export {
  deployContract as deployThirdwebContract,
} from 'thirdweb/deploys';

/**
 * Varity Backend SDK
 * Provides complete backend infrastructure for Varity platform
 */
export class VarityBackend {
  static readonly VERSION = VERSION;

  /**
   * Initialize Varity Backend SDK with configuration
   */
  static async initialize(config: {
    network: 'arbitrum-sepolia' | 'arbitrum-one' | 'varity-l3';
    privateKey?: string;
    thirdwebClientId?: string; // Optional: Enable Thirdweb integration
    filecoinConfig: {
      pinataApiKey: string;
      pinataSecretKey: string;
      gatewayUrl: string;
    };
    akashConfig: {
      rpcEndpoint: string;
      walletMnemonic?: string;
    };
    celestiaConfig: {
      rpcEndpoint: string;
      authToken?: string;
      namespace: string;
      enableZKProofs: boolean;
    };
  }) {
    // Initialize all SDK components
    const networkConfig =
      config.network === 'arbitrum-sepolia'
        ? ContractManager.getArbitrumSepoliaConfig()
        : config.network === 'arbitrum-one'
        ? ContractManager.getArbitrumOneConfig()
        : {
            chainId: 33529,
            name: 'Varity L3 Testnet',
            rpcUrl: process.env.VARITY_L3_RPC_URL || 'https://rpc.varity.network',
            explorerUrl: 'https://explorer.varity.network',
            isTestnet: true,
          };

    const contractManager = new ContractManager(
      networkConfig,
      config.privateKey
    );

    // Initialize Thirdweb if client ID provided
    if (config.thirdwebClientId) {
      contractManager.initializeThirdweb(
        config.thirdwebClientId,
        config.privateKey
      );
    }

    const filecoinClient = new FilecoinClient(config.filecoinConfig);

    const akashClient = new AkashClient({
      ...config.akashConfig,
      defaultResourceConfig: {
        cpu: 2000,
        memory: 4096,
        storage: 50,
      },
    });

    const celestiaClient = new CelestiaClient(config.celestiaConfig);

    const litClient = new LitProtocolClient();
    await litClient.initialize();

    const templateDeployer = new TemplateDeployer(
      contractManager,
      filecoinClient,
      akashClient,
      celestiaClient,
      litClient
    );

    return {
      contractManager,
      filecoinClient,
      akashClient,
      celestiaClient,
      litClient,
      templateDeployer,
      networkConfig,
    };
  }
}

export default VarityBackend;
