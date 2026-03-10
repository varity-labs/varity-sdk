import React from 'react';

export interface InitTimeoutScreenProps {
  /**
   * Callback when the retry button is clicked
   */
  onRetry: () => void;
  /**
   * Custom title for the timeout screen
   * @default "Initialization Taking Longer Than Expected"
   */
  title?: string;
  /**
   * Custom description text
   */
  description?: string;
  /**
   * Custom troubleshooting tips
   */
  tips?: string[];
}

/**
 * InitTimeoutScreen - Shows if initialization takes longer than 10 seconds
 *
 * This component provides a user-friendly message when Privy initialization
 * takes longer than expected, with troubleshooting tips and retry options.
 *
 * **Production Pattern**: Extracted from generic-template-dashboard production deployment
 *
 * **UX Considerations**:
 * - Non-alarming design (warning color, not error)
 * - Clear troubleshooting steps
 * - Two action options: Retry or Continue Waiting
 * - Professional tone for business users
 *
 * @example
 * ```tsx
 * import { InitTimeoutScreen } from '@varity-labs/ui-kit';
 *
 * function MyTimeoutHandler() {
 *   return (
 *     <InitTimeoutScreen
 *       onRetry={() => window.location.reload()}
 *     />
 *   );
 * }
 * ```
 *
 * @example With custom content
 * ```tsx
 * <InitTimeoutScreen
 *   onRetry={handleRetry}
 *   title="Still loading..."
 *   description="This is taking longer than usual."
 *   tips={[
 *     "Check your connection",
 *     "Try a different browser",
 *   ]}
 * />
 * ```
 */
export function InitTimeoutScreen({
  onRetry,
  title = 'Initialization Taking Longer Than Expected',
  description = 'The authentication services are taking longer than usual to initialize. This might be due to network conditions.',
  tips = [
    'Check your internet connection',
    'Privy services may be experiencing delays',
    'You can wait or try refreshing the page',
  ],
}: InitTimeoutScreenProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        {/* Clock Icon */}
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

        {/* Description */}
        <p className="text-gray-600 mb-4">{description}</p>

        {/* Troubleshooting Tips */}
        <ul className="text-sm text-gray-700 space-y-2 mb-4">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Retry
          </button>
          <button
            onClick={() => {
              /* User chose to continue waiting - do nothing */
            }}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            Continue Waiting
          </button>
        </div>
      </div>
    </div>
  );
}

export default InitTimeoutScreen;
