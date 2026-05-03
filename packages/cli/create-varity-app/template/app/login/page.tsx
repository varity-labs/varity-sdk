'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

let AuthProviderComponent: any = null;
let useAuthHook: (() => { authenticated: boolean; ready: boolean; login: () => void }) | null = null;

try {
  const uiKit = require('@varity-labs/ui-kit');
  AuthProviderComponent = uiKit.AuthProvider;
  useAuthHook = uiKit.useAuth;
} catch {}

function LoginContent() {
  const router = useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks -- conditional on require() success, stable across renders
  const auth = useAuthHook ? useAuthHook() : null;

  useEffect(() => {
    if (auth?.authenticated) {
      router.push('/dashboard');
    }
  }, [auth?.authenticated, router]);

  const handleLogin = () => {
    if (auth?.login) {
      auth.login();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">{APP_NAME}</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Use your email or social account to get started.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {auth ? (
            <button
              onClick={handleLogin}
              disabled={!auth.ready || auth.authenticated}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {!auth.ready
                ? 'Loading...'
                : auth.authenticated
                ? 'Already Signed In'
                : 'Sign In with Email or Social'}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Loading authentication...
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Always wrap in AuthProvider - it uses dev credentials automatically when no appId is provided
  if (AuthProviderComponent) {
    return (
      <AuthProviderComponent
        appId={process.env.NEXT_PUBLIC_VARITY_AUTH_APP_ID}
        loginMethods={['email', 'google']}
        appearance={{ theme: 'light', accentColor: '#2563EB', logo: '/logo.svg' }}
      >
        <LoginContent />
      </AuthProviderComponent>
    );
  }

  // Fallback if ui-kit package isn't installed
  return <LoginContent />;
}
