import React, { useState } from 'react';
import { parseUSDC, formatUSDC } from '../../config/chains';

export interface AmountInputProps {
  value: string;
  onChange: (value: string, valueBigInt: bigint) => void;
  max?: bigint;
  showMax?: boolean;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

/**
 * Amount Input Component
 *
 * Input field for USDC amounts with proper 6-decimal handling:
 * - Validates numeric input
 * - Formats to 6 decimals
 * - Max button for full balance
 * - Error states
 *
 * @example
 * ```tsx
 * import { AmountInput } from '@varity-labs/ui-kit';
 *
 * function SendForm() {
 *   const [amount, setAmount] = useState('');
 *
 *   return (
 *     <AmountInput
 *       value={amount}
 *       onChange={(value, valueBigInt) => setAmount(value)}
 *       max={BigInt(1000000000)} // 1000 USDC
 *       showMax
 *       label="Amount to send"
 *       placeholder="0.00"
 *     />
 *   );
 * }
 * ```
 */
export function AmountInput({
  value,
  onChange,
  max,
  showMax = true,
  label,
  placeholder = '0.00',
  error,
  className = '',
}: AmountInputProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty string
    if (inputValue === '') {
      onChange('', BigInt(0));
      return;
    }

    // Validate numeric input with up to 6 decimals
    const regex = /^\d*\.?\d{0,6}$/;
    if (!regex.test(inputValue)) {
      return;
    }

    try {
      const valueBigInt = parseUSDC(inputValue);
      onChange(inputValue, valueBigInt);
    } catch (err) {
      // Invalid input, don't update
    }
  };

  const handleMax = () => {
    if (max) {
      const maxValue = formatUSDC(max, 6);
      onChange(maxValue, max);
    }
  };

  const isOverMax = max && value ? parseUSDC(value) > max : false;

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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`input pr-20 ${error || isOverMax ? 'border-red-500 focus:ring-red-500' : ''}`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {Boolean(showMax && max) && (
            <button
              type="button"
              onClick={handleMax}
              className="text-xs text-varity-primary hover:text-varity-primary/80 font-medium"
            >
              MAX
            </button>
          )}
          <span className="text-sm text-gray-500">USDC</span>
        </div>
      </div>

      {(error || isOverMax) && (
        <p className="text-sm text-red-500">
          {error || 'Amount exceeds maximum'}
        </p>
      )}

      {Boolean(max && value && !error && !isOverMax) && (
        <p className="text-xs text-gray-500">
          Maximum: {max ? formatUSDC(max, 2).toString() : ''} USDC
        </p>
      )}
    </div>
  );
}
