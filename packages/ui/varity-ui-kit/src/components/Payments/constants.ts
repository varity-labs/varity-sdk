/**
 * Payment Constants
 * Subscription plans, pricing, and USDC configuration
 */

import { SubscriptionPlan, SubscriptionTier } from './types';

/**
 * Varity L3 Chain Configuration
 */
export const VARITY_L3_CHAIN_ID = 33529;
export const USDC_CONTRACT_ADDRESS = '0x...'; // TODO: Replace with actual USDC address on Varity L3
export const USDC_DECIMALS = 6;

/**
 * Subscription Plans
 * Prices in USDC (with 6 decimals)
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    description: 'Perfect for small businesses getting started',
    price: 99_000000, // $99 USDC (6 decimals)
    priceDisplay: '$99/month',
    features: [
      '1 AI Dashboard',
      'Up to 5 users',
      '10 GB storage',
      'Community support',
      'Basic analytics',
      'Email notifications',
    ],
    maxUsers: 5,
    maxDashboards: 1,
    maxStorage: 10,
    supportLevel: 'community',
    isPopular: false,
    isRecommended: false,
  },
  {
    id: 'professional',
    tier: SubscriptionTier.PROFESSIONAL,
    name: 'Professional',
    description: 'Advanced features for growing businesses',
    price: 499_000000, // $499 USDC (6 decimals)
    priceDisplay: '$499/month',
    features: [
      'Up to 5 AI Dashboards',
      'Up to 25 users',
      '100 GB storage',
      'Priority email support',
      'Advanced analytics',
      'Custom integrations',
      'API access',
      'White-label branding',
    ],
    maxUsers: 25,
    maxDashboards: 5,
    maxStorage: 100,
    supportLevel: 'priority',
    isPopular: true,
    isRecommended: true,
  },
  {
    id: 'enterprise',
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'Full-featured solution for large organizations',
    price: 2999_000000, // $2,999 USDC (6 decimals)
    priceDisplay: '$2,999/month',
    features: [
      'Unlimited AI Dashboards',
      'Unlimited users',
      'Unlimited storage',
      'Dedicated support manager',
      'Enterprise analytics',
      'Custom development',
      'SLA guarantee (99.99%)',
      'Full white-label',
      'On-premise deployment',
      'Custom contracts',
    ],
    maxUsers: undefined,
    maxDashboards: undefined,
    maxStorage: undefined,
    supportLevel: 'dedicated',
    isPopular: false,
    isRecommended: false,
  },
];

/**
 * Get subscription plan by ID
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

/**
 * Get subscription plan by tier
 */
export function getSubscriptionPlanByTier(tier: SubscriptionTier): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
}

/**
 * Format USDC amount for display
 * Converts from 6 decimal representation to human-readable
 */
export function formatUSDC(amount: number): string {
  return `$${(amount / 1_000000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert human amount to USDC contract amount
 * e.g., 99 -> 99_000000 (6 decimals)
 */
export function toUSDCAmount(humanAmount: number): number {
  return Math.floor(humanAmount * 1_000000);
}

/**
 * Convert USDC contract amount to human amount
 * e.g., 99_000000 -> 99
 */
export function fromUSDCAmount(contractAmount: number): number {
  return contractAmount / 1_000000;
}

/**
 * Payment API Endpoints
 */
export const PAYMENT_ENDPOINTS = {
  CREATE_CHECKOUT: '/api/v1/payments/checkout',
  GET_SUBSCRIPTION: '/api/v1/payments/subscription',
  CANCEL_SUBSCRIPTION: '/api/v1/payments/subscription/cancel',
  RESUME_SUBSCRIPTION: '/api/v1/payments/subscription/resume',
  UPGRADE_SUBSCRIPTION: '/api/v1/payments/subscription/upgrade',
  DOWNGRADE_SUBSCRIPTION: '/api/v1/payments/subscription/downgrade',
  GET_INVOICES: '/api/v1/payments/invoices',
  GET_USAGE: '/api/v1/payments/usage',
  WEBHOOK: '/api/v1/webhooks/payments',
};

/**
 * Trial Period Configuration
 */
export const TRIAL_PERIOD_DAYS = 14;
export const TRIAL_ENABLED = true;
