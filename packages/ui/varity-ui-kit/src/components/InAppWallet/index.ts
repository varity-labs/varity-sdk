/**
 * In-App Wallet Components Export
 *
 * Thirdweb In-App Wallets for seamless Web2 user onboarding
 * - Email OTP authentication
 * - Social OAuth (Google, Apple, Facebook, Discord, Twitter)
 * - Automatic custodial wallet creation
 * - Complete onboarding flow
 */

export { InAppWalletProvider, useInAppWallet } from './InAppWalletProvider';
export { EmailLoginButton } from './EmailLoginButton';
export { SocialLoginButtons } from './SocialLoginButtons';
export { OnboardingFlow } from './OnboardingFlow';

// Export types
export type { InAppWalletContextType } from './InAppWalletProvider';
