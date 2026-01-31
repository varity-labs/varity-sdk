/**
 * Varity SDK v1 - Network Configuration
 *
 * Manages network settings and contract addresses for different networks.
 */

import { NetworkConfig, Network } from './types'

/**
 * Network configurations for Varity SDK
 * Contract addresses will be populated after deployment
 */
export const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  'arbitrum-sepolia': {
    chainId: 421614, // Arbitrum Sepolia testnet chain ID
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    contracts: {
      MerchantRegistry: process.env.MERCHANT_REGISTRY_ARBITRUM_SEPOLIA || '',
      TransactionVault: process.env.TRANSACTION_VAULT_ARBITRUM_SEPOLIA || '',
      RepPerformance: process.env.REP_PERFORMANCE_ARBITRUM_SEPOLIA || '',
      ResidualCalculator: process.env.RESIDUAL_CALCULATOR_ARBITRUM_SEPOLIA || '',
      AccessControlRegistry: process.env.ACCESS_CONTROL_ARBITRUM_SEPOLIA || '',
      DataProofRegistry: process.env.DATA_PROOF_REGISTRY_ARBITRUM_SEPOLIA || '',
      VarityWalletFactory: process.env.WALLET_FACTORY_ARBITRUM_SEPOLIA || ''
    }
  },
  'arbitrum-l3-testnet': {
    chainId: 33529, // Varity L3 Testnet (Arbitrum Orbit on Conduit)
    rpcUrl: process.env.ARBITRUM_L3_TESTNET_RPC || 'https://rpc-varity-testnet-rroe52pwjp.t.conduit.xyz',
    explorerUrl: 'https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz',
    contracts: {
      MerchantRegistry: process.env.MERCHANT_REGISTRY_L3_TESTNET || '',
      TransactionVault: process.env.TRANSACTION_VAULT_L3_TESTNET || '',
      RepPerformance: process.env.REP_PERFORMANCE_L3_TESTNET || '',
      ResidualCalculator: process.env.RESIDUAL_CALCULATOR_L3_TESTNET || '',
      AccessControlRegistry: process.env.ACCESS_CONTROL_L3_TESTNET || '',
      DataProofRegistry: process.env.DATA_PROOF_REGISTRY_L3_TESTNET || '',
      VarityWalletFactory: process.env.WALLET_FACTORY_L3_TESTNET || ''
    }
  },
  'arbitrum-l3-mainnet': {
    chainId: 1000000, // Placeholder - will be updated with actual L3 mainnet
    rpcUrl: process.env.ARBITRUM_L3_MAINNET_RPC || '',
    explorerUrl: 'https://explorer.varity.io',
    contracts: {
      MerchantRegistry: process.env.MERCHANT_REGISTRY_L3_MAINNET || '',
      TransactionVault: process.env.TRANSACTION_VAULT_L3_MAINNET || '',
      RepPerformance: process.env.REP_PERFORMANCE_L3_MAINNET || '',
      ResidualCalculator: process.env.RESIDUAL_CALCULATOR_L3_MAINNET || '',
      AccessControlRegistry: process.env.ACCESS_CONTROL_L3_MAINNET || '',
      DataProofRegistry: process.env.DATA_PROOF_REGISTRY_L3_MAINNET || '',
      VarityWalletFactory: process.env.WALLET_FACTORY_L3_MAINNET || ''
    }
  }
}

/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG = {
  network: 'arbitrum-sepolia' as Network,
  apiEndpoint: process.env.VARITY_API_ENDPOINT || 'https://api.varity.io',
  timeout: 30000 // 30 seconds
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network: Network): NetworkConfig {
  const config = NETWORK_CONFIGS[network]
  if (!config) {
    throw new Error(`Unsupported network: ${network}`)
  }
  return config
}

/**
 * Validate contract addresses are configured
 */
export function validateContractAddresses(network: Network): void {
  const config = getNetworkConfig(network)
  const missingContracts: string[] = []

  Object.entries(config.contracts).forEach(([name, address]) => {
    if (!address || address === '') {
      missingContracts.push(name)
    }
  })

  if (missingContracts.length > 0) {
    throw new Error(
      `Missing contract addresses for ${network}: ${missingContracts.join(', ')}\n` +
      `Please set environment variables or deploy contracts to this network.`
    )
  }
}

/**
 * Backend API endpoints
 */
export const API_ENDPOINTS = {
  storage: {
    pin: '/api/v1/storage/pin',
    retrieve: '/api/v1/storage/retrieve',
    unpin: '/api/v1/storage/unpin'
  },
  celestia: {
    submit: '/api/v1/celestia/submit',
    retrieve: '/api/v1/celestia/retrieve',
    submitBatch: '/api/v1/celestia/submit-batch'
  },
  llm: {
    query: '/api/v1/llm/query',
    queryWithRAG: '/api/v1/llm/query-rag'
  },
  config: {
    contracts: '/api/v1/config/contracts',
    networks: '/api/v1/config/networks'
  }
}

/**
 * Storage layer configuration
 */
export const STORAGE_CONFIG = {
  // Default storage backend
  defaultBackend: 'filecoin-ipfs' as const,

  // Filecoin/IPFS configuration
  pinata: {
    gateway: 'https://gateway.pinata.cloud/ipfs/',
    api: 'https://api.pinata.cloud'
  },

  // Celestia Data Availability
  celestia: {
    namespacePrefix: 'varity-',
    testnetRPC: process.env.CELESTIA_TESTNET_RPC || 'https://rpc-mocha.pops.one'
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000
  },

  // Multi-tier storage default configuration
  multiTier: {
    hotTier: {
      backend: 'filecoin-ipfs' as const,
      replication: 3,
      costPerGB: 0.001, // $0.001 per GB per month
      accessLatency: 50 // 50ms average
    },
    coldTier: {
      backend: 'filecoin-ipfs' as const,
      replication: 2,
      costPerGB: 0.0005, // $0.0005 per GB per month
      accessLatency: 200 // 200ms average
    },
    autoTiering: {
      enabled: true,
      policy: 'access-based' as const,
      checkInterval: 24, // Check every 24 hours
      rules: [
        {
          name: 'Demote to cold after 30 days',
          description: 'Move hot tier objects to cold tier if not accessed for 30 days',
          condition: {
            type: 'last_accessed' as const,
            operator: 'gt' as const,
            value: 30,
            unit: 'days' as const
          },
          action: {
            moveTo: 'cold' as const,
            notify: false
          },
          priority: 1,
          enabled: true
        },
        {
          name: 'Promote frequently accessed',
          description: 'Move cold tier objects to hot tier if accessed more than 5 times',
          condition: {
            type: 'access_count' as const,
            operator: 'gte' as const,
            value: 5,
            unit: 'accesses' as const
          },
          action: {
            moveTo: 'hot' as const,
            notify: false
          },
          priority: 2,
          enabled: true
        }
      ]
    }
  }
}
