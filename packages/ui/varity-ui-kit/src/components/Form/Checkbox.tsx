import React, { useId } from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  error?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  error,
  className = '',
}: CheckboxProps) {
  const checkboxId = useId();
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <div
          role="checkbox"
          id={checkboxId}
          aria-checked={indeterminate ? 'mixed' : checked}
          aria-disabled={disabled}
          aria-labelledby={label ? `${checkboxId}-label` : undefined}
          tabIndex={disabled ? -1 : 0}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
          className={`
            flex items-center justify-center w-5 h-5 rounded border-2 transition-all
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)]
            ${
              error
                ? 'border-red-500 dark:border-red-400'
                : checked || indeterminate
                  ? 'bg-[var(--color-primary-600)] border-[var(--color-primary-600)]'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {indeterminate ? (
            <Minus className="w-3 h-3 text-white" />
          ) : checked ? (
            <Check className="w-3 h-3 text-white" />
          ) : null}
        </div>

        {(label || description) && (
          <div className="flex flex-col flex-1">
            {label && (
              <label
                id={`${checkboxId}-label`}
                htmlFor={checkboxId}
                className={`
                  text-sm font-medium text-gray-900 dark:text-gray-100
                  ${disabled ? 'opacity-50' : 'cursor-pointer'}
                `}
                onClick={handleChange}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
