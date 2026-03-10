import React, { ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export interface PrivyProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * Privy Protected Route Component
 *
 * Wraps content that requires authentication.
 * Shows login prompt if user is not authenticated.
 *
 * @example
 * ```tsx
 * <PrivyProtectedRoute>
 *   <DashboardContent />
 * </PrivyProtectedRoute>
 * ```
 */
export function PrivyProtectedRoute({
  children,
  fallback,
  loadingComponent,
}: PrivyProtectedRouteProps): JSX.Element {
  const { ready, authenticated, login } = usePrivy();

  // Loading state
  if (!ready) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show fallback or default login prompt
  if (!authenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access this content
          </p>

          <button
            onClick={login}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - show protected content
  return <>{children}</>;
}

export default PrivyProtectedRoute;
