/**
 * SocialLoginButtons - Social OAuth Authentication Buttons
 *
 * Provides one-click social login via Google, Apple, Facebook
 * Automatically creates custodial wallets for users
 *
 * @example
 * ```tsx
 * <SocialLoginButtons
 *   providers={['google', 'apple', 'facebook']}
 *   onSuccess={(user) => console.log('Logged in:', user)}
 * />
 * ```
 */

import React from 'react';
import { useInAppWallet } from './InAppWalletProvider';
import { getErrorMessage } from '@varity-labs/types';

type SocialProvider = 'google' | 'apple' | 'facebook' | 'discord' | 'twitter';

interface SocialLoginButtonsProps {
  providers?: SocialProvider[];
  onSuccess?: (provider: SocialProvider) => void;
  onError?: (error: Error) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  showDivider?: boolean;
  dividerText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  apple: {
    name: 'Apple',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
    bgColor: 'bg-black hover:bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-black',
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bgColor: 'bg-[#1877F2] hover:bg-[#166FE5]',
    textColor: 'text-white',
    borderColor: 'border-[#1877F2]',
  },
  discord: {
    name: 'Discord',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
      </svg>
    ),
    bgColor: 'bg-[#5865F2] hover:bg-[#4752C4]',
    textColor: 'text-white',
    borderColor: 'border-[#5865F2]',
  },
  twitter: {
    name: 'Twitter',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
    bgColor: 'bg-[#1DA1F2] hover:bg-[#1A8CD8]',
    textColor: 'text-white',
    borderColor: 'border-[#1DA1F2]',
  },
};

export function SocialLoginButtons({
  providers = ['google', 'apple', 'facebook'],
  onSuccess,
  onError,
  layout = 'vertical',
  showDivider = true,
  dividerText = 'or continue with',
  size = 'md',
}: SocialLoginButtonsProps) {
  const { loginWithGoogle, loginWithApple, loginWithFacebook, isLoading } = useInAppWallet();

  const handleLogin = async (provider: SocialProvider) => {
    try {
      switch (provider) {
        case 'google':
          await loginWithGoogle();
          break;
        case 'apple':
          await loginWithApple();
          break;
        case 'facebook':
          await loginWithFacebook();
          break;
        default:
          throw new Error(`Provider ${provider} not implemented`);
      }
      onSuccess?.(provider);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error(`${provider} login error:`, errorMessage);
      const errorObj = error instanceof Error ? error : new Error(errorMessage);
      onError?.(errorObj);
    }
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const layoutClasses = {
    horizontal: 'flex flex-row gap-3',
    vertical: 'flex flex-col gap-3',
    grid: 'grid grid-cols-2 gap-3',
  };

  return (
    <div className="w-full">
      {showDivider && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">{dividerText}</span>
          </div>
        </div>
      )}

      <div className={layoutClasses[layout]}>
        {providers.map((provider) => {
          const config = providerConfig[provider];
          if (!config) return null;

          return (
            <button
              key={provider}
              onClick={() => handleLogin(provider)}
              disabled={isLoading}
              className={`
                ${config.bgColor}
                ${config.textColor}
                ${sizeClasses[size]}
                border ${config.borderColor}
                rounded-lg font-medium
                flex items-center justify-center gap-2
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-sm hover:shadow-md
              `}
            >
              {isLoading ? (
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
              ) : (
                config.icon
              )}
              <span>Continue with {config.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
