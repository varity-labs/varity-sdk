import React from 'react';

export interface InitializingScreenProps {
  /**
   * Custom title for the initializing screen
   * @default "Initializing Dashboard..."
   */
  title?: string;
  /**
   * Custom description text
   * @default "Setting up Web3 providers and authentication. This should take just a few seconds."
   */
  description?: string;
  /**
   * Custom steps to show during initialization
   */
  steps?: string[];
}

/**
 * InitializingScreen - Shows while Privy and thirdweb providers initialize
 *
 * This component provides visual feedback during the Privy initialization process,
 * preventing the blank screen issue that occurs without proper loading states.
 *
 * **Production Pattern**: Extracted from generic-template-dashboard production deployment
 *
 * **Design Considerations**:
 * - Professional gradient background (blue to indigo)
 * - Animated spinner with icon for visual interest
 * - Clear messaging about what's happening
 * - Shows expected steps to set user expectations
 * - Optimized for business users (30-60 years old)
 *
 * @example
 * ```tsx
 * import { InitializingScreen } from '@varity-labs/ui-kit';
 *
 * function MyLoadingState() {
 *   return <InitializingScreen />;
 * }
 * ```
 *
 * @example With custom content
 * ```tsx
 * <InitializingScreen
 *   title="Setting up your workspace..."
 *   description="Connecting to blockchain and loading your data."
 *   steps={[
 *     "Connecting to Varity L3",
 *     "Loading your profile",
 *     "Preparing dashboard"
 *   ]}
 * />
 * ```
 */
export function InitializingScreen({
  title = 'Initializing Dashboard...',
  description = 'Setting up Web3 providers and authentication. This should take just a few seconds.',
  steps = [
    'Loading Privy authentication',
    'Connecting to Varity L3',
    'Preparing wallet connection',
  ],
}: InitializingScreenProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        {/* Animated Spinner with Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {/* Zap icon (SVG) */}
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

        {/* Description */}
        <p className="text-gray-600 mb-4">{description}</p>

        {/* Steps */}
        <div className="text-sm text-gray-500 space-y-1">
          {steps.map((step, index) => (
            <p key={index} className="flex items-center gap-2 justify-center">
              {/* Check icon */}
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InitializingScreen;
