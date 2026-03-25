import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  name: string;
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function RadioGroup({
  value,
  onChange,
  options,
  name,
  label,
  orientation = 'vertical',
  disabled = false,
  error,
  className = '',
}: RadioGroupProps) {
  const handleChange = (optionValue: string, optionDisabled?: boolean) => {
    if (!disabled && !optionDisabled) {
      onChange(optionValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, optionValue: string, optionDisabled?: boolean) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange(optionValue, optionDisabled);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {label}
        </label>
      )}

      <div
        role="radiogroup"
        aria-label={label}
        className={`
          flex gap-4
          ${orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}
        `}
      >
        {options.map((option) => {
          const isChecked = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <div key={option.value} className="flex items-start gap-3">
              <div
                role="radio"
                aria-checked={isChecked}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => handleChange(option.value, option.disabled)}
                onKeyDown={(e) => handleKeyDown(e, option.value, option.disabled)}
                className={`
                  flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)]
                  ${
                    error
                      ? 'border-red-500 dark:border-red-400'
                      : isChecked
                        ? 'border-[var(--color-primary-600)]'
                        : 'border-gray-300 dark:border-gray-600'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isChecked && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-600)]" />
                )}
              </div>

              <div className="flex flex-col flex-1">
                <label
                  className={`
                    text-sm font-medium text-gray-900 dark:text-gray-100
                    ${isDisabled ? 'opacity-50' : 'cursor-pointer'}
                  `}
                  onClick={() => handleChange(option.value, option.disabled)}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                )}
              </div>

              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={() => handleChange(option.value, option.disabled)}
                disabled={isDisabled}
                className="sr-only"
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
