import React, { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS class names */
  className?: string;
}

/**
 * EmptyState - Display when no data is available
 *
 * A component for displaying empty states with optional icons,
 * descriptions, and action buttons. Useful for tables, lists,
 * and other data displays when no data is available.
 *
 * @example
 * ```tsx
 * import { EmptyState } from '@varity-labs/ui-kit';
 *
 * function DataList() {
 *   const { data, loading } = useData();
 *
 *   if (!loading && data.length === 0) {
 *     return (
 *       <EmptyState
 *         title="No data found"
 *         description="Get started by adding your first item."
 *         icon={<FolderIcon />}
 *         action={{
 *           label: "Add Item",
 *           onClick: () => setShowAddModal(true),
 *         }}
 *       />
 *     );
 *   }
 *
 *   return <List data={data} />;
 * }
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeStyles = {
    sm: {
      container: 'py-6 px-4',
      icon: 'w-10 h-10',
      iconWrapper: 'w-16 h-16',
      title: 'text-base',
      description: 'text-sm',
      button: 'px-3 py-1.5 text-sm',
    },
    md: {
      container: 'py-10 px-6',
      icon: 'w-12 h-12',
      iconWrapper: 'w-20 h-20',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-16 h-16',
      iconWrapper: 'w-28 h-28',
      title: 'text-xl',
      description: 'text-base',
      button: 'px-6 py-3 text-base',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${styles.container} ${className}`}
    >
      {icon && (
        <div
          className={`flex items-center justify-center ${styles.iconWrapper} bg-gray-100 rounded-full mb-4`}
        >
          <div className={`text-gray-400 ${styles.icon}`}>{icon}</div>
        </div>
      )}

      <h3 className={`font-semibold text-gray-900 ${styles.title}`}>
        {title}
      </h3>

      {description && (
        <p className={`mt-2 text-gray-500 max-w-sm ${styles.description}`}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`${styles.button} font-medium rounded-lg transition-colors ${
                action.variant === 'secondary'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`${styles.button} font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors`}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyStatePresets - Common empty state configurations
 */
export const EmptyStatePresets = {
  /**
   * No search results
   */
  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No results found"
      description="Try adjusting your search or filter to find what you're looking for."
      {...props}
    />
  ),

  /**
   * No data yet
   */
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No data yet"
      description="Data will appear here once available."
      {...props}
    />
  ),

  /**
   * No integrations connected
   */
  NoIntegrations: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No integrations connected"
      description="Connect your first integration to get started."
      {...props}
    />
  ),

  /**
   * Connection required
   */
  ConnectionRequired: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="Connection required"
      description="Please connect your account to access this data."
      {...props}
    />
  ),

  /**
   * Coming soon
   */
  ComingSoon: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="Coming Soon"
      description="This feature is currently under development."
      {...props}
    />
  ),
};

export default EmptyState;
