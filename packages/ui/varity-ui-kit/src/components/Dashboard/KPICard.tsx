import React, { ReactNode } from 'react';

export interface KPICardProps {
  /** Title of the KPI */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Trend indicator (positive, negative, or neutral) */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value (e.g., "+12%") */
  trendValue?: string;
  /** Whether the card is loading */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Card variant */
  variant?: 'default' | 'outlined' | 'filled';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * KPICard - Display Key Performance Indicator metrics
 *
 * A card component for displaying business metrics and KPIs with
 * optional trend indicators and icons.
 *
 * @example
 * ```tsx
 * import { KPICard } from '@varity-labs/ui-kit';
 *
 * function Dashboard() {
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       <KPICard
 *         title="Revenue"
 *         value="$12,345"
 *         trend="up"
 *         trendValue="+12%"
 *         icon={<DollarIcon />}
 *       />
 *       <KPICard
 *         title="Customers"
 *         value={1234}
 *         subtitle="Active users"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  loading = false,
  onClick,
  className = '',
  variant = 'default',
  size = 'md',
}: KPICardProps) {
  const baseStyles = 'rounded-lg transition-all duration-200';

  const variantStyles = {
    default: 'bg-white border border-gray-200 shadow-sm',
    outlined: 'bg-transparent border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-100',
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizeStyles = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-100',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  const interactiveStyles = onClick
    ? 'cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-[0.98]'
    : '';

  if (loading) {
    return (
      <div
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} animate-pulse`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          {icon && <div className="h-8 w-8 bg-gray-200 rounded"></div>}
        </div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        {subtitle && <div className="h-3 bg-gray-200 rounded w-20"></div>}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`font-bold text-gray-900 ${valueSizeStyles[size]}`}>
          {value}
        </span>
        {trend && trendValue && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${trendColors[trend]}`}
          >
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

export default KPICard;
