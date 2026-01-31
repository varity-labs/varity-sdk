import React, { useEffect, useState } from 'react';
import { useSIWE } from './SIWEProvider';
import { SIWEModal } from './SIWEModal';

/**
 * Protected Route Component
 * Wrapper for routes that require authentication
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  clientId: string;
  onUnauthorized?: () => void;
  requireAuth?: boolean;
  loadingComponent?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo,
  clientId,
  onUnauthorized,
  requireAuth = true,
  loadingComponent,
}) => {
  const { isAuthenticated, isLoading } = useSIWE();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && requireAuth) {
      if (redirectTo) {
        window.location.href = redirectTo;
      } else if (onUnauthorized) {
        onUnauthorized();
      } else {
        setShowAuthModal(true);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, onUnauthorized]);

  // Show loading state
  if (isLoading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <DefaultLoadingScreen />
    );
  }

  // Show unauthorized fallback
  if (!isAuthenticated && requireAuth) {
    return (
      <>
        {fallback || (
          <DefaultUnauthorizedScreen
            onLogin={() => setShowAuthModal(true)}
          />
        )}
        <SIWEModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          clientId={clientId}
          requireAuth={requireAuth}
          onSuccess={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Default Loading Screen
 */
const DefaultLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

/**
 * Default Unauthorized Screen
 */
const DefaultUnauthorizedScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center max-w-md px-4">
      <div className="mb-8">
        <svg
          className="w-20 h-20 text-gray-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
      <p className="text-gray-400 mb-8">
        You need to sign in with your Ethereum wallet to access this page.
      </p>
      <button
        onClick={onLogin}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Sign In with Ethereum
      </button>
    </div>
  </div>
);

export default ProtectedRoute;
