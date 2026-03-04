/**
 * EmailLoginButton - Email OTP Authentication Button
 *
 * Provides email passwordless authentication using Thirdweb In-App Wallets
 * Users receive a one-time password via email for verification
 *
 * @example
 * ```tsx
 * <EmailLoginButton
 *   onSuccess={(user) => console.log('Logged in:', user)}
 *   buttonClassName="custom-button-class"
 * />
 * ```
 */

import React, { useState } from 'react';
import { useInAppWallet } from './InAppWalletProvider';
import { getErrorMessage } from '@varity-labs/types';

interface EmailLoginButtonProps {
  onSuccess?: (user: string) => void;
  onError?: (error: Error) => void;
  buttonClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  buttonText?: string;
  loadingText?: string;
}

export function EmailLoginButton({
  onSuccess,
  onError,
  buttonClassName = '',
  inputClassName = '',
  placeholder = 'Enter your email',
  buttonText = 'Continue with Email',
  loadingText = 'Sending code...'
}: EmailLoginButtonProps) {
  const { loginWithEmail, isLoading } = useInAppWallet();
  const [email, setEmail] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail) {
      onError?.(new Error('Invalid email address'));
      return;
    }

    try {
      await loginWithEmail(email);
      onSuccess?.(email);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onError?.(errorObj);
    }
  };

  const defaultButtonClass = `
    w-full px-6 py-3
    bg-gradient-to-r from-indigo-600 to-purple-600
    hover:from-indigo-700 hover:to-purple-700
    text-white font-medium rounded-lg
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
    shadow-lg hover:shadow-xl
  `;

  const defaultInputClass = `
    w-full px-4 py-3
    border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    outline-none transition-all
  `;

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className={buttonClassName || defaultButtonClass}
        disabled={isLoading}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {buttonText}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <input
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder={placeholder}
        className={inputClassName || defaultInputClass}
        disabled={isLoading}
        autoFocus
        required
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowInput(false);
            setEmail('');
          }}
          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          disabled={isLoading}
        >
          Back
        </button>

        <button
          type="submit"
          className={buttonClassName || defaultButtonClass}
          disabled={isLoading || !isValidEmail}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {loadingText}
            </>
          ) : (
            'Send Code'
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        We&apos;ll send a verification code to your email
      </p>
    </form>
  );
}
