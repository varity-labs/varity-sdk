/**
 * Privy Authentication Components
 *
 * Components for email/social authentication with Privy.
 * Ideal for non-crypto native users who don't have wallets.
 *
 * Production Patterns: Extracted from generic-template-dashboard
 */

export { PrivyLoginButton } from './PrivyLoginButton';
export type { PrivyLoginButtonProps } from './PrivyLoginButton';

export { PrivyUserProfile } from './PrivyUserProfile';
export type { PrivyUserProfileProps } from './PrivyUserProfile';

export { PrivyProtectedRoute } from './PrivyProtectedRoute';
export type { PrivyProtectedRouteProps } from './PrivyProtectedRoute';

// Production patterns for Privy initialization
export { PrivyReadyGate } from './PrivyReadyGate';
export type { PrivyReadyGateProps } from './PrivyReadyGate';

export { InitializingScreen } from './InitializingScreen';
export type { InitializingScreenProps } from './InitializingScreen';

export { InitTimeoutScreen } from './InitTimeoutScreen';
export type { InitTimeoutScreenProps } from './InitTimeoutScreen';
