/**
 * Varity UI Kit - Wallet Components
 *
 * Smart wallet components for ERC-4337 account abstraction
 */

export {
  SmartWalletProvider,
  useSmartWallet,
  SmartWalletConnectButton,
  GaslessBadge,
  type SmartWalletConfig,
} from './SmartWalletProvider';

export {
  VARITY_SMART_WALLET_CONTRACTS,
  CONDUIT_BUNDLER_CONFIG,
  PAYMASTER_CONFIG,
  DEFAULT_GAS_BUDGET,
  getDefaultSmartWalletConfig,
  getBundlerUrl,
  areContractsDeployed,
} from './config';

export {
  SimpleSmartWallet,
  type SimpleSmartWalletProps,
} from './SimpleSmartWallet';
