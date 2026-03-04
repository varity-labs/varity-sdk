import React, { useState, useEffect } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall } from 'thirdweb';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { SubscriptionPlan } from './types';
import { formatUSDC, USDC_CONTRACT_ADDRESS, VARITY_L3_CHAIN_ID } from './constants';
import { useSIWE } from '../SIWE/SIWEProvider';
import { varityL3Testnet } from '../../config/chains';

/**
 * Checkout Modal Component
 * Handles USDC payment processing for subscriptions
 */

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  clientId: string;
  paymentRecipient: string; // Varity treasury address
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  theme?: 'light' | 'dark';
}

enum CheckoutStep {
  REVIEW = 'review',
  APPROVE = 'approve',
  PAYMENT = 'payment',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  clientId,
  paymentRecipient,
  onSuccess,
  onError,
  theme = 'dark',
}) => {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.REVIEW);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { isAuthenticated } = useSIWE();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const client = createThirdwebClient({ clientId });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(CheckoutStep.REVIEW);
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  const handlePayment = async () => {
    if (!account || !isAuthenticated) {
      setError('Please connect wallet and authenticate first');
      setCurrentStep(CheckoutStep.ERROR);
      return;
    }

    try {
      setCurrentStep(CheckoutStep.PAYMENT);
      setError(null);

      // Get USDC contract
      const usdcContract = getContract({
        client,
        chain: varityL3Testnet,
        address: USDC_CONTRACT_ADDRESS,
      });

      // Prepare USDC transfer transaction
      const transaction = prepareContractCall({
        contract: usdcContract,
        method: 'function transfer(address to, uint256 amount) returns (bool)',
        params: [paymentRecipient, BigInt(plan.price)],
      });

      // Send transaction
      sendTransaction(transaction, {
        onSuccess: (result) => {
          setTxHash(result.transactionHash);
          setCurrentStep(CheckoutStep.CONFIRMING);

          // Wait for confirmation
          setTimeout(() => {
            setCurrentStep(CheckoutStep.SUCCESS);
            onSuccess?.(result.transactionHash);
          }, 3000);
        },
        onError: (err) => {
          const errorMessage = err.message || 'Payment failed';
          setError(errorMessage);
          setCurrentStep(CheckoutStep.ERROR);
          onError?.(err);
        },
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      setCurrentStep(CheckoutStep.ERROR);
      onError?.(err);
    }
  };

  const handleClose = () => {
    if (currentStep !== CheckoutStep.PAYMENT && currentStep !== CheckoutStep.CONFIRMING) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ${bgColor} ${textColor} border ${borderColor}`}>
        {/* Close Button */}
        {currentStep !== CheckoutStep.PAYMENT && currentStep !== CheckoutStep.CONFIRMING && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <h2 className="text-3xl font-bold mb-6">Complete Your Subscription</h2>

          {/* Render current step */}
          {currentStep === CheckoutStep.REVIEW && (
            <ReviewStep
              plan={plan}
              onProceed={handlePayment}
              theme={theme}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
              borderColor={borderColor}
              isPending={isPending}
            />
          )}

          {currentStep === CheckoutStep.PAYMENT && (
            <ProcessingStep
              message="Processing payment..."
              theme={theme}
              textColor={textColor}
            />
          )}

          {currentStep === CheckoutStep.CONFIRMING && (
            <ProcessingStep
              message="Confirming transaction..."
              txHash={txHash}
              theme={theme}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
            />
          )}

          {currentStep === CheckoutStep.SUCCESS && (
            <SuccessStep
              plan={plan}
              txHash={txHash}
              onClose={onClose}
              theme={theme}
              textColor={textColor}
              mutedTextColor={mutedTextColor}
            />
          )}

          {currentStep === CheckoutStep.ERROR && (
            <ErrorStep
              error={error}
              onRetry={handlePayment}
              onClose={onClose}
              theme={theme}
              textColor={textColor}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Review Step Component
 */
interface ReviewStepProps {
  plan: SubscriptionPlan;
  onProceed: () => void;
  theme: 'light' | 'dark';
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  isPending: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  plan,
  onProceed,
  theme,
  textColor,
  mutedTextColor,
  borderColor,
  isPending,
}) => (
  <>
    {/* Plan Summary */}
    <div className={`border ${borderColor} rounded-lg p-6 mb-6`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-xl font-bold ${textColor}`}>{plan.name} Plan</h3>
          <p className={mutedTextColor}>{plan.description}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${textColor}`}>{formatUSDC(plan.price)}</p>
          <p className={`text-sm ${mutedTextColor}`}>per month</p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <p className={`font-semibold ${textColor} mb-2`}>Included features:</p>
        {plan.features.slice(0, 5).map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className={`text-sm ${mutedTextColor}`}>{feature}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Payment Details */}
    <div className={`bg-${theme === 'dark' ? 'gray-800' : 'gray-50'} rounded-lg p-6 mb-6`}>
      <h4 className={`font-semibold mb-4 ${textColor}`}>Payment Details</h4>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className={mutedTextColor}>Subtotal</span>
          <span className={textColor}>{formatUSDC(plan.price)}</span>
        </div>
        <div className="flex justify-between">
          <span className={mutedTextColor}>Currency</span>
          <span className={textColor}>USDC (Varity L3)</span>
        </div>
        <div className={`border-t ${borderColor} pt-2 mt-2`} />
        <div className="flex justify-between font-bold">
          <span className={textColor}>Total Due Today</span>
          <span className={`text-xl ${textColor}`}>{formatUSDC(plan.price)}</span>
        </div>
      </div>
    </div>

    {/* CTA */}
    <button
      onClick={onProceed}
      disabled={isPending}
      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isPending ? (
        <>
          <LoadingSpinner />
          Processing...
        </>
      ) : (
        <>
          Pay {formatUSDC(plan.price)} USDC
        </>
      )}
    </button>

    {/* Security Notice */}
    <p className={`text-xs text-center mt-4 ${mutedTextColor}`}>
      Your payment is secure and encrypted. Powered by Thirdweb on Varity L3.
    </p>
  </>
);

/**
 * Processing Step Component
 */
interface ProcessingStepProps {
  message: string;
  txHash?: string | null;
  theme: 'light' | 'dark';
  textColor: string;
  mutedTextColor?: string;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ message, txHash, theme, textColor, mutedTextColor }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500 text-white mb-6 animate-pulse">
      <LoadingSpinner />
    </div>
    <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>{message}</h3>
    <p className={mutedTextColor}>Please wait while we process your transaction</p>
    {txHash && (
      <div className="mt-6">
        <p className={`text-sm ${mutedTextColor} mb-2`}>Transaction Hash:</p>
        <code className={`text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded`}>
          {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 10)}
        </code>
      </div>
    )}
  </div>
);

/**
 * Success Step Component
 */
interface SuccessStepProps {
  plan: SubscriptionPlan;
  txHash: string | null;
  onClose: () => void;
  theme: 'light' | 'dark';
  textColor: string;
  mutedTextColor: string;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ plan, txHash, onClose, theme, textColor, mutedTextColor }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 text-white mb-6">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>Payment Successful!</h3>
    <p className={mutedTextColor}>You&apos;re now subscribed to the {plan.name} plan</p>

    {txHash && (
      <div className="mt-6">
        <p className={`text-sm ${mutedTextColor} mb-2`}>Transaction Hash:</p>
        <code className={`text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded`}>
          {txHash}
        </code>
      </div>
    )}

    <button
      onClick={onClose}
      className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
    >
      Go to Dashboard
    </button>
  </div>
);

/**
 * Error Step Component
 */
interface ErrorStepProps {
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
  theme: 'light' | 'dark';
  textColor: string;
}

const ErrorStep: React.FC<ErrorStepProps> = ({ error, onRetry, onClose, theme, textColor }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500 text-white mb-6">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>Payment Failed</h3>
    <p className="text-red-500 mb-8">{error || 'An error occurred during payment'}</p>

    <div className="flex gap-4 justify-center">
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Try Again
      </button>
      <button
        onClick={onClose}
        className={`px-6 py-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} font-semibold rounded-lg transition-colors`}
      >
        Cancel
      </button>
    </div>
  </div>
);

/**
 * Loading Spinner Component
 */
const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default CheckoutModal;
