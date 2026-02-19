import React, { useId } from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleProps) {
  const toggleId = useId();
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
  };

  const circleSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const circleTranslate = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
  };

  return (
    <div className={`flex ${description ? 'items-start' : 'items-center'} gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        aria-disabled={disabled}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)]
          ${sizeClasses[size]}
          ${checked ? 'bg-[var(--color-primary-600)]' : 'bg-gray-200 dark:bg-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${description ? 'mt-0.5' : ''}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out
            ${circleSize[size]}
            ${checked ? circleTranslate[size] : 'translate-x-0.5'}
          `}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              id={`${toggleId}-label`}
              htmlFor={toggleId}
              className={`
                text-sm font-medium text-gray-900 dark:text-gray-100
                ${disabled ? 'opacity-50' : 'cursor-pointer'}
              `}
              onClick={handleToggle}
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
  );
}
