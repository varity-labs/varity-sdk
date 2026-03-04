require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/**
 * Hardhat Configuration for VarityKit Smart Contracts
 *
 * Networks:
 * - localhost: Local development with Hardhat node
 * - arbitrumSepolia: Arbitrum Sepolia testnet (for testing)
 * - varityL3: Varity L3 blockchain (production)
 * - arbitrumOne: Arbitrum One L2 (if needed for settlement)
 */

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";
const VARITY_L3_RPC_URL = process.env.VARITY_L3_RPC_URL || "http://localhost:8545";
const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  networks: {
    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },

    // Hardhat network (default for testing)
    hardhat: {
      chainId: 31337,
      forking: process.env.FORK_MAINNET === "true" ? {
        url: ARBITRUM_SEPOLIA_RPC_URL,
      } : undefined,
    },

    // Arbitrum Sepolia Testnet (L2 testnet)
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL,
      chainId: 421614,
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: 100000000, // 0.1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.arbiscan.io",
          apiKey: ARBISCAN_API_KEY,
        },
      },
    },

    // Varity L3 Blockchain (Arbitrum Orbit)
    varityL3: {
      url: VARITY_L3_RPC_URL,
      chainId: parseInt(process.env.VARITY_L3_CHAIN_ID || "33529"),
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: "auto",
      timeout: 60000,
    },

    // Arbitrum One L2 (if needed)
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [DEPLOYER_PRIVATE_KEY],
      gasPrice: "auto",
    },
  },

  // Etherscan/Arbiscan verification
  etherscan: {
    apiKey: {
      arbitrumSepolia: ARBISCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      // Varity L3 may need custom verification setup
    },
    customChains: [
      {
        network: "varityL3",
        chainId: parseInt(process.env.VARITY_L3_CHAIN_ID || "33529"),
        urls: {
          apiURL: process.env.VARITY_L3_EXPLORER_API || "http://localhost:4000/api",
          browserURL: process.env.VARITY_L3_EXPLORER_URL || "http://localhost:4000",
        },
      },
    ],
  },

  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },

  // Paths configuration
  paths: {
    sources: "./src",
    tests: "../tests/contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  // Mocha test configuration
  mocha: {
    timeout: 60000,
  },
};
