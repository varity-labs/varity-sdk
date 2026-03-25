import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  showValue?: boolean;
  striped?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  variant = 'primary',
  size = 'md',
  showValue = false,
  striped = false,
  label,
  className = '',
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
  };

  const variantClasses = {
    primary: 'bg-[var(--color-primary-600)]',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  return (
    <div className={className}>
      {showValue && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {clampedValue}%
          </span>
        </div>
      )}

      <div
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${sizeClasses[size]}
        `}
      >
        <div
          className={`
            h-full transition-all duration-300 ease-out rounded-full relative overflow-hidden
            ${variantClasses[variant]}
          `}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-label={label || `Progress: ${clampedValue}%`}
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {striped && (
            <div
              className="absolute inset-0 h-full w-full"
              style={{
                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
                backgroundSize: '1rem 1rem',
                animation: 'progress-stripes 1s linear infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
