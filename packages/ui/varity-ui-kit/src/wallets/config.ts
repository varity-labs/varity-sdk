/**
 * Smart Wallet Configuration for Varity L3
 *
 * Contains contract addresses, bundler endpoints, and paymaster configuration
 * for ERC-4337 Account Abstraction on Varity L3 Testnet (Chain ID 33529)
 *
 * IMPORTANT: These contracts need to be deployed to Varity L3
 * Currently deployed on Arbitrum Sepolia - migration required
 */

import { varityL3Testnet } from '@varity-labs/sdk';

/**
 * Contract Addresses for Varity L3
 *
 * ✅ DEPLOYED (January 13, 2026) - Ready for use!
 * Deployed by: 0x20B7d1426649D9a573ba7Fd10592456264220cbF
 * Explorer: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz
 */
export const VARITY_SMART_WALLET_CONTRACTS = {
  /**
   * VarityWalletFactory - Creates smart wallets for users
   * ✅ Deployed: Varity L3 (Chain ID 33529)
   * Verified: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/address/0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71
   */
  factoryAddress: '0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71' as const,

  /**
   * SimplifiedPaymaster - Sponsors gas for transactions
   * ✅ Deployed: Varity L3 (Chain ID 33529)
   * ✅ Funded: $5 USDC in Conduit paymaster balance
   * Verified: https://explorer-varity-testnet-rroe52pwjp.t.conduit.xyz/address/0xeF467aef91d4e626C7e56967779069bEF22c4453
   */
  paymasterAddress: '0xeF467aef91d4e626C7e56967779069bEF22c4453' as const,

  /**
   * ERC-4337 EntryPoint (standard address across all chains)
   * v0.6: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
   * v0.7: 0x0000000071727De22E5E9d8BAf0edAc6f37da032
   */
  entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as const, // v0.6 (default)
} as const;

/**
 * Conduit Bundler Configuration
 *
 * ✅ CONFIGURED - Conduit Account Abstraction bundler for Varity L3
 * Paymaster Balance: $5 USDC (funded and ready)
 * Chain ID: 33529
 */
export const CONDUIT_BUNDLER_CONFIG = {
  /**
   * Conduit AA Bundler RPC endpoint for Varity L3
   * ✅ Active with $5 USDC paymaster balance
   * Source: Conduit Dashboard → Account Abstraction Tab
   */
  bundlerUrl: `https://aa.conduit.xyz/api/v3/60cd06d8-a734-453c-84e9-5387c315ee2e/chain/33529` as const,

  /**
   * Environment variable override (optional)
   * Use this if you want to switch bundler endpoints
   */
  managedBundlerUrl: process.env.NEXT_PUBLIC_CONDUIT_BUNDLER_URL || '',
} as const;

/**
 * Paymaster Configuration
 *
 * Gas sponsorship settings for Varity L3
 */
export const PAYMASTER_CONFIG = {
  /**
   * Enable gas sponsorship by default
   */
  enabled: true,

  /**
   * Paymaster URL (optional - uses thirdweb's if not provided)
   * Can also use custom paymaster URL from Conduit/Pimlico
   */
  paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || undefined,

  /**
   * Gas policy - which operations to sponsor
   */
  policy: {
    /**
     * Sponsor all transactions (recommended for MVP)
     */
    sponsorAll: true,

    /**
     * Maximum gas limit to sponsor (in wei)
     * Default: 500,000 gas units
     */
    maxGasLimit: '500000',

    /**
     * Whitelist of contract addresses to sponsor
     * Empty = sponsor all
     */
    allowedContracts: [] as string[],
  },
} as const;

/**
 * Default gas budget for new wallets (in USDC with 6 decimals)
 * Example: 10 USDC = 10_000_000 (10 * 10^6)
 */
export const DEFAULT_GAS_BUDGET = 10_000_000; // 10 USDC

/**
 * Default Smart Wallet Configuration
 *
 * Use this as a starting point for SmartWalletProvider
 *
 * @example
 * ```tsx
 * import { DEFAULT_SMART_WALLET_CONFIG } from './wallets/config';
 *
 * <SmartWalletProvider config={DEFAULT_SMART_WALLET_CONFIG}>
 *   <App />
 * </SmartWalletProvider>
 * ```
 */
export function getDefaultSmartWalletConfig(client: any) {
  return {
    client,
    chain: varityL3Testnet,
    gasless: PAYMASTER_CONFIG,
    factoryAddress: VARITY_SMART_WALLET_CONTRACTS.factoryAddress,
    accountVersion: '0.6' as const, // ERC-4337 version
  };
}

/**
 * Deployment Status Checklist
 *
 * ✅ = Complete | ⏳ = In Progress | ⬜ = Not Started
 *
 * ✅ 1. Deploy SimplifiedPaymaster.sol to Varity L3
 *    - Deployed: 0xeF467aef91d4e626C7e56967779069bEF22c4453
 *    - Date: January 13, 2026
 *    - Verified on Varity L3 Explorer
 *
 * ✅ 2. Deploy VarityWalletFactory.sol to Varity L3
 *    - Deployed: 0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71
 *    - Date: January 13, 2026
 *    - Verified on Varity L3 Explorer
 *
 * ⏳ 3. Initialize factory with paymaster address
 *    - Call: factory.initialize(paymasterAddress, DEFAULT_GAS_BUDGET)
 *    - Status: Needs verification (may already be done)
 *
 * ✅ 4. Fund paymaster with USDC
 *    - Funded: $5 USDC via Conduit paymaster balance
 *    - Status: Active and ready for gas sponsorship
 *
 * ✅ 5. Configure Conduit Bundler
 *    - Bundler URL: https://aa.conduit.xyz/api/v3/60cd06d8-a734-453c-84e9-5387c315ee2e/chain/33529
 *    - Updated in CONDUIT_BUNDLER_CONFIG
 *
 * ⏳ 6. Test complete flow
 *    - Connect wallet → Deploy smart wallet → Send gasless transaction
 *    - Status: Ready for testing (SmartWalletProvider 95% complete)
 *
 * **Next Steps**:
 * - Verify factory initialization (step 3)
 * - Run end-to-end integration test (step 6)
 * - Monitor paymaster balance during testing
 */

/**
 * Helper: Get bundler URL
 *
 * Returns the appropriate bundler URL based on environment
 */
export function getBundlerUrl(): string {
  // Use managed bundler URL if set (from Conduit dashboard)
  if (CONDUIT_BUNDLER_CONFIG.managedBundlerUrl) {
    return CONDUIT_BUNDLER_CONFIG.managedBundlerUrl;
  }

  // Fall back to default Conduit bundler endpoint
  return CONDUIT_BUNDLER_CONFIG.bundlerUrl;
}

/**
 * Helper: Check if contracts are deployed
 *
 * ✅ Contracts are deployed to Varity L3 (as of January 13, 2026)
 * Returns true (contracts are ready to use)
 */
export function areContractsDeployed(): boolean {
  // Contracts deployed on January 13, 2026
  // Factory: 0x85AB92708CB4d921f5c2BdCCd7f2D0813a380f71
  // Paymaster: 0xeF467aef91d4e626C7e56967779069bEF22c4453
  return true;
}
