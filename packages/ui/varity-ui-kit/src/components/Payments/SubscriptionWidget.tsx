import React, { useState } from 'react';
import { SubscriptionPlan, SubscriptionTier } from './types';
import { SUBSCRIPTION_PLANS, formatUSDC } from './constants';

/**
 * Subscription Widget Component
 * Displays subscription plans with feature comparison
 */

interface SubscriptionWidgetProps {
  currentPlan?: SubscriptionTier;
  onSelectPlan: (planId: string) => void;
  theme?: 'light' | 'dark';
  showAnnualToggle?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const SubscriptionWidget: React.FC<SubscriptionWidgetProps> = ({
  currentPlan,
  onSelectPlan,
  theme = 'dark',
  showAnnualToggle = false,
  className = '',
  isLoading = false,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  const calculateAnnualPrice = (monthlyPrice: number): number => {
    // 20% discount for annual billing
    return Math.floor(monthlyPrice * 12 * 0.8);
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className={`text-4xl font-bold mb-4 ${textColor}`}>
          Choose Your Plan
        </h2>
        <p className={`text-lg ${mutedTextColor}`}>
          Select the perfect plan for your business needs
        </p>
      </div>

      {/* Billing Period Toggle */}
      {showAnnualToggle && (
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors relative ${
              billingPeriod === 'annual'
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlan === plan.tier}
            onSelect={() => onSelectPlan(plan.id)}
            billingPeriod={billingPeriod}
            calculateAnnualPrice={calculateAnnualPrice}
            theme={theme}
            bgColor={bgColor}
            textColor={textColor}
            mutedTextColor={mutedTextColor}
            borderColor={borderColor}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Feature Comparison Link */}
      <div className="text-center mt-12">
        <button className={`${mutedTextColor} hover:text-blue-500 underline transition-colors`}>
          View detailed feature comparison
        </button>
      </div>
    </div>
  );
};

/**
 * Individual Plan Card Component
 */
interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelect: () => void;
  billingPeriod: 'monthly' | 'annual';
  calculateAnnualPrice: (monthlyPrice: number) => number;
  theme: 'light' | 'dark';
  bgColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  isLoading: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  onSelect,
  billingPeriod,
  calculateAnnualPrice,
  theme,
  bgColor,
  textColor,
  mutedTextColor,
  borderColor,
  isLoading,
}) => {
  const displayPrice = billingPeriod === 'annual'
    ? calculateAnnualPrice(plan.price)
    : plan.price;

  const pricePerMonth = billingPeriod === 'annual'
    ? formatUSDC(displayPrice / 12)
    : formatUSDC(displayPrice);

  const totalPrice = formatUSDC(displayPrice);

  const cardBg = plan.isRecommended
    ? theme === 'dark'
      ? 'bg-gradient-to-br from-blue-900 to-gray-900'
      : 'bg-gradient-to-br from-blue-50 to-white'
    : theme === 'dark'
    ? 'bg-gray-800'
    : 'bg-white';

  const cardBorder = plan.isRecommended
    ? 'border-blue-500'
    : borderColor;

  return (
    <div
      className={`relative rounded-2xl border-2 ${cardBorder} ${cardBg} p-8 shadow-xl transition-transform hover:scale-105`}
    >
      {/* Recommended Badge */}
      {plan.isRecommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Recommended
          </span>
        </div>
      )}

      {/* Popular Badge */}
      {plan.isPopular && !plan.isRecommended && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>{plan.name}</h3>

      {/* Plan Description */}
      <p className={`mb-6 ${mutedTextColor}`}>{plan.description}</p>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${textColor}`}>
            {pricePerMonth}
          </span>
          <span className={mutedTextColor}>/month</span>
        </div>
        {billingPeriod === 'annual' && (
          <p className={`text-sm mt-1 ${mutedTextColor}`}>
            {totalPrice} billed annually
          </p>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={onSelect}
        disabled={isCurrentPlan || isLoading}
        className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 ${
          isCurrentPlan
            ? theme === 'dark'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : plan.isRecommended
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : theme === 'dark'
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            Processing...
          </span>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          'Select Plan'
        )}
      </button>

      {/* Features List */}
      <div className="space-y-3">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <svg
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                plan.isRecommended ? 'text-blue-500' : 'text-green-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className={`text-sm ${mutedTextColor}`}>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default SubscriptionWidget;
