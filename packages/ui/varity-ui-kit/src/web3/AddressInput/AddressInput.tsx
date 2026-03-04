import React, { useState } from 'react';
import { isAddress } from 'viem';

export interface AddressInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

/**
 * Address Input Component
 *
 * Input field for Ethereum addresses with validation:
 * - Real-time address validation
 * - Visual feedback for valid/invalid addresses
 * - Error states
 *
 * @example
 * ```tsx
 * import { AddressInput } from '@varity-labs/ui-kit';
 *
 * function SendForm() {
 *   const [recipient, setRecipient] = useState('');
 *
 *   return (
 *     <AddressInput
 *       value={recipient}
 *       onChange={(value, isValid) => setRecipient(value)}
 *       label="Recipient Address"
 *       placeholder="0x..."
 *     />
 *   );
 * }
 * ```
 */
export function AddressInput({
  value,
  onChange,
  label,
  placeholder = '0x...',
  error,
  className = '',
}: AddressInputProps): JSX.Element {
  const [touched, setTouched] = useState(false);

  const isValidAddress = value ? isAddress(value) : false;
  const showError = touched && value && !isValidAddress;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const isValid = newValue ? isAddress(newValue) : false;
    onChange(newValue, isValid);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`input pr-10 font-mono ${
            showError || error
              ? 'border-red-500 focus:ring-red-500'
              : isValidAddress
              ? 'border-green-500 focus:ring-green-500'
              : ''
          }`}
        />

        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValidAddress ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : touched ? (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : null}
          </div>
        )}
      </div>

      {(showError || error) && (
        <p className="text-sm text-red-500">
          {error || 'Invalid Ethereum address'}
        </p>
      )}
    </div>
  );
}
