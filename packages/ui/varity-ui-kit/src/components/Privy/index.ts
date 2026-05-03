/**
 * Authentication Components
 *
 * Components for email/social authentication.
 * Ideal for non-crypto native users who don't have wallets.
 *
 * Production Patterns: Extracted from generic-template-dashboard
 */

export { LoginButton } from './PrivyLoginButton';
export type { LoginButtonProps } from './PrivyLoginButton';

export { UserProfile } from './PrivyUserProfile';
export type { UserProfileProps } from './PrivyUserProfile';

export { ProtectedRoute } from './PrivyProtectedRoute';
export type { ProtectedRouteProps } from './PrivyProtectedRoute';

// Production patterns for auth initialization
export { ReadyGate } from './PrivyReadyGate';
export type { ReadyGateProps } from './PrivyReadyGate';

export { InitializingScreen } from './InitializingScreen';
export type { InitializingScreenProps } from './InitializingScreen';

export { InitTimeoutScreen } from './InitTimeoutScreen';
export type { InitTimeoutScreenProps } from './InitTimeoutScreen';
