/**
 * PaymentWidget Types
 * For developer apps to charge end-users with 90/10 revenue split
 */

/**
 * Payment type for app purchases
 */
export type PaymentType = 'one-time' | 'subscription';

/**
 * App pricing information from VarityPayments contract
 */
export interface AppPricing {
  /** Price in USDC (6 decimals, e.g., 99_000000 = $99) */
  priceUsdc: bigint;
  /** Developer wallet address */
  developer: string;
  /** Whether this is a subscription */
  isSubscription: boolean;
  /** Billing interval in days (for subscriptions) */
  intervalDays: number;
  /** Whether pricing is active */
  isActive: boolean;
}

/**
 * PaymentWidget component props
 */
export interface PaymentWidgetProps {
  /** App ID from Varity App Registry (required) */
  appId: number;
  /**
   * Price in cents for display (e.g., 9900 = $99.00)
   * If not provided, will fetch from contract
   */
  price?: number;
  /** Payment type: one-time or subscription */
  type?: PaymentType;
  /** Billing interval in days (for subscriptions, default: 30) */
  intervalDays?: number;
  /** Callback after successful payment */
  onSuccess?: (txHash: string) => void;
  /** Callback when payment is cancelled */
  onCancel?: () => void;
  /** Callback on payment error */
  onError?: (error: Error) => void;
  /** Theme variant */
  theme?: 'light' | 'dark';
  /** Custom class name */
  className?: string;
  /** Trigger element (button, link, etc.) */
  children: React.ReactNode;
  /** Disable the widget */
  disabled?: boolean;
}

/**
 * PaymentGate component props
 */
export interface PaymentGateProps {
  /** App ID from Varity App Registry */
  appId: number;
  /** Price in cents for the unlock button */
  price?: number;
  /** Content to show when not purchased (paywall) */
  fallback: React.ReactNode;
  /** Premium content to show when purchased */
  children: React.ReactNode;
  /** Theme variant */
  theme?: 'light' | 'dark';
  /** Custom class name */
  className?: string;
}

/**
 * useVarityPayment hook return type
 */
export interface UseVarityPaymentReturn {
  /** Whether the current user has purchased this app */
  hasPurchased: boolean;
  /** Loading state for purchase check */
  isLoading: boolean;
  /** Whether a purchase is in progress */
  isPurchasing: boolean;
  /** Error message if any */
  error: string | null;
  /** App pricing information */
  pricing: AppPricing | null;
  /** Trigger a purchase */
  purchase: () => Promise<string | null>;
  /** Refresh purchase status */
  refresh: () => Promise<void>;
}

/**
 * useVarityPayment hook options
 */
export interface UseVarityPaymentOptions {
  /** App ID to check purchase status for */
  appId: number;
  /** Auto-fetch pricing on mount */
  autoFetch?: boolean;
}

/**
 * VarityPayments contract address on Arbitrum One (mainnet)
 * Set NEXT_PUBLIC_VARITY_PAYMENTS_ADDRESS env var after deploying to Arb One.
 */
export const VARITY_PAYMENTS_ADDRESS = (
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VARITY_PAYMENTS_ADDRESS
    ? process.env.NEXT_PUBLIC_VARITY_PAYMENTS_ADDRESS
    : '0x0568cf3b5b9c94542aa8d32eb51ffa38912fc48c'
) as `0x${string}`;

/**
 * Varity Treasury address (receives 10% platform fee)
 */
export const VARITY_TREASURY_ADDRESS = '0xA0b83bBeF45FeE8c8E158b25b736E05eBd51b793' as const;

/**
 * Platform fee in basis points (10% = 1000 bps)
 */
export const PLATFORM_FEE_BPS = 1000;

/**
 * VarityPayments contract ABI (camelCase - Stylus SDK conversion)
 */
export const VARITY_PAYMENTS_ABI = [
  // Read functions
  {
    name: 'getAppPricing',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'appId', type: 'uint64' }],
    outputs: [
      { name: 'priceUsdc', type: 'uint64' },
      { name: 'developer', type: 'address' },
      { name: 'isSubscription', type: 'bool' },
      { name: 'intervalDays', type: 'uint64' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  {
    name: 'hasUserPurchased',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'appId', type: 'uint64' },
      { name: 'buyer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getTreasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getUsdcAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // Write functions — nonpayable (ERC-20 USDC transferFrom pattern)
  // Users must approve() USDC spending before calling purchaseApp
  {
    name: 'purchaseApp',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'appId', type: 'uint64' }],
    outputs: [],
  },
  {
    name: 'setAppPrice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'appId', type: 'uint64' },
      { name: 'priceUsdc', type: 'uint64' },
      { name: 'isSubscription', type: 'bool' },
      { name: 'intervalDays', type: 'uint64' },
    ],
    outputs: [],
  },
] as const;
