/**
 * SIWE (Sign-In with Ethereum) Components
 * EIP-4361 compliant authentication components for Web3 applications
 */

export { SIWEProvider, useSIWE } from './SIWEProvider';
export { SIWEButton } from './SIWEButton';
export { SIWEModal } from './SIWEModal';
export { ProtectedRoute } from './ProtectedRoute';
export { AuthStatus } from './AuthStatus';

// Re-export types
export type { default as SIWEProviderProps } from './SIWEProvider';
export type { default as SIWEButtonProps } from './SIWEButton';
export type { default as SIWEModalProps } from './SIWEModal';
export type { default as ProtectedRouteProps } from './ProtectedRoute';
export type { default as AuthStatusProps } from './AuthStatus';
