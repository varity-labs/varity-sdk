import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useSIWE } from './SIWEProvider';
import { SIWEButton } from './SIWEButton';

/**
 * SIWE Modal Component
 * Full-screen authentication modal with SIWE flow
 */

interface SIWEModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  title?: string;
  description?: string;
  logoUrl?: string;
  onSuccess?: () => void;
  theme?: 'light' | 'dark';
  requireAuth?: boolean;
}

export const SIWEModal: React.FC<SIWEModalProps> = ({
  isOpen,
  onClose,
  clientId,
  title = 'Sign In to Varity',
  description = 'Connect your wallet and sign the message to authenticate',
  logoUrl,
  onSuccess,
  theme = 'dark',
  requireAuth = false,
}) => {
  const { isAuthenticated } = useSIWE();
  const account = useActiveAccount();
  const [showSuccess, setShowSuccess] = useState(false);

  // Close modal when authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setShowSuccess(false);
      }, 2000);
    }
  }, [isAuthenticated, isOpen, onSuccess, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={!requireAuth ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${bgColor} ${textColor} border ${borderColor}`}>
        {/* Close Button (if not required) */}
        {!requireAuth && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="p-8">
          {/* Logo */}
          {logoUrl && (
            <div className="flex justify-center mb-6">
              <img src={logoUrl} alt="Logo" className="h-16 w-auto" />
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>

          {/* Description */}
          <p className={`text-center mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </p>

          {/* Success State */}
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-green-500">Successfully Authenticated!</p>
            </div>
          ) : (
            <>
              {/* Connection Steps */}
              <div className="space-y-4 mb-8">
                <Step
                  number={1}
                  title="Connect Wallet"
                  description="Connect your Ethereum wallet"
                  isComplete={!!account}
                  theme={theme}
                />
                <Step
                  number={2}
                  title="Sign Message"
                  description="Sign the authentication message"
                  isComplete={isAuthenticated}
                  isActive={!!account && !isAuthenticated}
                  theme={theme}
                />
                <Step
                  number={3}
                  title="Access Dashboard"
                  description="Start using the platform"
                  isComplete={isAuthenticated}
                  theme={theme}
                />
              </div>

              {/* SIWE Button */}
              <div className="flex justify-center">
                <SIWEButton
                  clientId={clientId}
                  theme={theme}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onLoginComplete={() => {
                    setShowSuccess(true);
                  }}
                />
              </div>
            </>
          )}

          {/* Security Notice */}
          <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Secure Authentication
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  Your wallet signature is used to verify ownership. We never have access to your private keys.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Authentication Step Component
 */
interface StepProps {
  number: number;
  title: string;
  description: string;
  isComplete?: boolean;
  isActive?: boolean;
  theme: 'light' | 'dark';
}

const Step: React.FC<StepProps> = ({ number, title, description, isComplete, isActive, theme }) => {
  const bgColor = isComplete
    ? 'bg-green-500'
    : isActive
    ? 'bg-blue-500'
    : theme === 'dark'
    ? 'bg-gray-700'
    : 'bg-gray-300';

  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="flex items-center gap-4">
      {/* Number/Check */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold`}>
        {isComplete ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className={`font-semibold ${isComplete || isActive ? 'text-current' : textColor}`}>{title}</p>
        <p className={`text-sm ${textColor}`}>{description}</p>
      </div>
    </div>
  );
};

export default SIWEModal;
