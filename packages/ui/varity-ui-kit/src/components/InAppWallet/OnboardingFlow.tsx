/**
 * OnboardingFlow - Complete User Onboarding Wizard
 *
 * Multi-step wizard for onboarding users to Varity L3
 * Steps: Welcome -> Auth -> Wallet Created -> Buy USDC (optional) -> Dashboard
 *
 * @example
 * ```tsx
 * <OnboardingFlow
 *   onComplete={(user) => router.push('/dashboard')}
 *   skipBuyUSDC={false}
 * />
 * ```
 */

import React, { useState } from 'react';
import { useInAppWallet } from './InAppWalletProvider';
import { EmailLoginButton } from './EmailLoginButton';
import { SocialLoginButtons } from './SocialLoginButtons';

interface OnboardingFlowProps {
  onComplete?: (user: any) => void;
  onSkip?: () => void;
  skipBuyUSDC?: boolean;
  companyName?: string;
  companyLogo?: string;
}

type Step = 'welcome' | 'auth' | 'wallet-created' | 'buy-usdc' | 'complete';

export function OnboardingFlow({
  onComplete,
  onSkip,
  skipBuyUSDC = false,
  companyName = 'Varity',
  companyLogo
}: OnboardingFlowProps) {
  const { user, isAuthenticated } = useInAppWallet();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const showBuyUSDC = !skipBuyUSDC;

  const handleComplete = React.useCallback(() => {
    setCurrentStep('complete');
    onComplete?.(user);
  }, [user, onComplete]);

  // Auto-advance to wallet-created when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user && currentStep === 'auth') {
      setCurrentStep('wallet-created');
      setTimeout(() => {
        if (showBuyUSDC) {
          setCurrentStep('buy-usdc');
        } else {
          handleComplete();
        }
      }, 3000); // Show success for 3 seconds
    }
  }, [isAuthenticated, user, currentStep, showBuyUSDC, handleComplete]);

  const handleSkipOnboarding = () => {
    onSkip?.();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            {companyLogo && (
              <img src={companyLogo} alt={companyName} className="h-16 mx-auto" />
            )}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to {companyName}
              </h1>
              <p className="text-lg text-gray-600">
                Get started in 2 minutes - No crypto knowledge required
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">What you'll get:</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">
                    <strong>Your own wallet</strong> - Automatically created with email/social login
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">
                    <strong>Free transactions</strong> - USDC as gas token means low fees
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">
                    <strong>Buy crypto with card</strong> - Use credit card, Apple Pay, or Google Pay
                  </span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setCurrentStep('auth')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>

            <button
              onClick={handleSkipOnboarding}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        );

      case 'auth':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Your Wallet
              </h2>
              <p className="text-gray-600">
                Choose how you&apos;d like to sign in - your wallet will be created automatically
              </p>
            </div>

            <div className="space-y-4">
              <SocialLoginButtons
                providers={['google', 'apple', 'facebook']}
                layout="vertical"
                showDivider={false}
              />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or use email</span>
                </div>
              </div>

              <EmailLoginButton />
            </div>

            <button
              onClick={() => setCurrentStep('welcome')}
              className="w-full text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>
        );

      case 'wallet-created':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-xl">🎉</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Wallet Created Successfully!
              </h2>
              <p className="text-gray-600">
                Your wallet is ready to use
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Wallet Address:</span>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded">
                  {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                </code>
              </div>
              {user?.email && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Redirecting to next step...
            </div>
          </div>
        );

      case 'buy-usdc':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Add Funds to Your Wallet
              </h2>
              <p className="text-gray-600">
                Buy USDC with your credit card to start using the platform
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                  <p className="text-sm text-gray-600">Credit card, Apple Pay, Google Pay</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-all"
              >
                Skip for now
              </button>
              <button
                onClick={() => {
                  // This will be replaced with actual Onramp widget
                  console.log('Opening Onramp...');
                  handleComplete();
                }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Buy USDC
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                You&apos;re All Set!
              </h2>
              <p className="text-gray-600">
                Welcome to {companyName}. Let&apos;s get started!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {['welcome', 'auth', 'wallet-created', ...(showBuyUSDC ? ['buy-usdc'] as const : []), 'complete'].map((step, index) => (
                <div
                  key={step}
                  className={`h-2 flex-1 mx-1 rounded-full transition-all ${
                    ['welcome', 'auth', 'wallet-created', ...(showBuyUSDC ? ['buy-usdc'] as const : []), 'complete'].indexOf(currentStep) >= index
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {renderStep()}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by Varity • Secure • Decentralized
        </p>
      </div>
    </div>
  );
}
