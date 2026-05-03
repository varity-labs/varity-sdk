import React, { useState, useEffect, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { InitializingScreen } from './InitializingScreen';
import { InitTimeoutScreen } from './InitTimeoutScreen';

export interface ReadyGateProps {
  /**
   * The content to render once Privy is ready
   */
  children: ReactNode;
  /**
   * Timeout in milliseconds before showing the timeout screen
   * @default 10000 (10 seconds)
   */
  timeout?: number;
  /**
   * Custom initializing screen component
   */
  initializingScreen?: ReactNode;
  /**
   * Custom timeout screen component
   */
  timeoutScreen?: ReactNode;
}

/**
 * PrivyReadyGate - Waits for Privy to be ready before rendering children
 *
 * This component prevents the 15-second blank screen issue by showing a loading screen
 * while Privy initializes. If initialization takes longer than the timeout (default 10s),
 * it shows a timeout screen with retry options.
 *
 * **Production Pattern**: Extracted from generic-template-dashboard production deployment
 *
 * **Problem it solves**:
 * - Without this gate, users see a blank screen for 5-15 seconds during Privy initialization
 * - Reduces user confusion and abandonment during authentication setup
 * - Provides clear feedback and recovery options if initialization hangs
 *
 * @example
 * ```tsx
 * import { PrivyReadyGate, VarityPrivyProvider } from '@varity-labs/ui-kit';
 *
 * function App() {
 *   return (
 *     <VarityPrivyProvider appId="your-privy-app-id">
 *       <PrivyReadyGate>
 *         <YourApp />
 *       </PrivyReadyGate>
 *     </VarityPrivyProvider>
 *   );
 * }
 * ```
 *
 * @example With custom timeout
 * ```tsx
 * <PrivyReadyGate timeout={5000}>
 *   <YourApp />
 * </PrivyReadyGate>
 * ```
 *
 * @example With custom screens
 * ```tsx
 * <PrivyReadyGate
 *   initializingScreen={<CustomLoadingScreen />}
 *   timeoutScreen={<CustomTimeoutScreen />}
 * >
 *   <YourApp />
 * </PrivyReadyGate>
 * ```
 */
export function ReadyGate({
  children,
  timeout = 10000,
  initializingScreen,
  timeoutScreen,
}: ReadyGateProps): JSX.Element {
  const { ready } = usePrivy();
  const [showTimeoutScreen, setShowTimeoutScreen] = useState(false);

  useEffect(() => {
    // Set timeout for specified duration
    const timeoutId = setTimeout(() => {
      if (!ready) {
        setShowTimeoutScreen(true);
      }
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [ready, timeout]);

  // If Privy is ready, render children immediately
  if (ready) {
    return <>{children}</>;
  }

  // If timed out, show timeout screen (but continue waiting in background)
  if (showTimeoutScreen) {
    if (timeoutScreen) {
      return <>{timeoutScreen}</>;
    }
    return (
      <InitTimeoutScreen
        onRetry={() => {
          setShowTimeoutScreen(false);
        }}
      />
    );
  }

  // Show loading screen while waiting for Privy
  if (initializingScreen) {
    return <>{initializingScreen}</>;
  }
  return <InitializingScreen />;
}

export default ReadyGate;
