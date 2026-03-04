/**
 * PaymentGate Component
 *
 * A paywall component that shows premium content only to users who have purchased.
 * Shows a fallback/paywall UI for non-purchasers.
 *
 * @example
 * ```tsx
 * import { PaymentGate } from '@varity/ui-kit';
 *
 * <PaymentGate
 *   appId={123}
 *   price={9900}
 *   fallback={<LockedContent />}
 * >
 *   <PremiumContent />
 * </PaymentGate>
 * ```
 */

import React from 'react';
import { PaymentGateProps } from './types';
import { useVarityPayment } from './useVarityPayment';
import { PaymentWidget } from './PaymentWidget';

/**
 * PaymentGate - Paywall component for premium content
 *
 * Automatically shows premium content if the user has purchased,
 * otherwise shows the fallback UI with a purchase option.
 */
export const PaymentGate: React.FC<PaymentGateProps> = ({
  appId,
  price,
  fallback,
  children,
  theme = 'dark',
  className = '',
}) => {
  const { hasPurchased, isLoading, pricing } = useVarityPayment({ appId });

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-pulse flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // User has purchased - show premium content
  if (hasPurchased) {
    return <>{children}</>;
  }

  // User has not purchased - show fallback/paywall
  return (
    <div className={className}>
      {/* Fallback Content */}
      {fallback}

      {/* Default unlock button if pricing is available */}
      {pricing?.isActive && (
        <div className="mt-4 text-center">
          <PaymentWidget
            appId={appId}
            price={price}
            theme={theme}
          >
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
              Unlock for ${price ? (price / 100).toFixed(2) : (Number(pricing.priceUsdc) / 1_000_000).toFixed(2)}
            </button>
          </PaymentWidget>
        </div>
      )}
    </div>
  );
};

export default PaymentGate;
