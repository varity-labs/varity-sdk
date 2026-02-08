/**
 * PaymentWidget Components
 *
 * Mandatory components for developer apps to charge end-users.
 * All payments go through the VarityPayments contract with 90/10 revenue split.
 *
 * @example
 * ```tsx
 * import { PaymentWidget, PaymentGate, useVarityPayment } from '@varity/ui-kit';
 *
 * // Simple button wrapper
 * <PaymentWidget appId={123} price={9900}>
 *   <button>Buy Premium</button>
 * </PaymentWidget>
 *
 * // Paywall for content
 * <PaymentGate appId={123} fallback={<LockedUI />}>
 *   <PremiumContent />
 * </PaymentGate>
 *
 * // Custom implementation with hook
 * const { hasPurchased, purchase } = useVarityPayment({ appId: 123 });
 * ```
 */

// Components
export { PaymentWidget } from './PaymentWidget';
export { PaymentGate } from './PaymentGate';

// Hooks
export { useVarityPayment } from './useVarityPayment';

// Types
export type {
  PaymentWidgetProps,
  PaymentGateProps,
  UseVarityPaymentReturn,
  UseVarityPaymentOptions,
  AppPricing,
  PaymentType,
} from './types';

// Constants
export {
  VARITY_PAYMENTS_ADDRESS,
  VARITY_TREASURY_ADDRESS,
  PLATFORM_FEE_BPS,
  VARITY_PAYMENTS_ABI,
} from './types';
