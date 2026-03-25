import React, { ReactNode } from 'react';

export type StatusType =
  | 'connected'
  | 'disconnected'
  | 'pending'
  | 'syncing'
  | 'error'
  | 'warning'
  | 'expired'
  | 'active'
  | 'inactive';

export interface StatusBadgeProps {
  /** Status type */
  status: StatusType;
  /** Custom label (defaults to status name) */
  label?: string;
  /** Show dot indicator */
  showDot?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional icon */
  icon?: ReactNode;
  /** Additional CSS class names */
  className?: string;
}

/**
 * StatusBadge - Display status indicators
 *
 * A badge component for displaying various status states with
 * appropriate colors and optional animated indicators.
 *
 * @example
 * ```tsx
 * import { StatusBadge } from '@varity-labs/ui-kit';
 *
 * function IntegrationCard({ integration }) {
 *   return (
 *     <div className="flex items-center gap-2">
 *       <span>{integration.name}</span>
 *       <StatusBadge
 *         status={integration.isConnected ? 'connected' : 'disconnected'}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function StatusBadge({
  status,
  label,
  showDot = true,
  size = 'md',
  icon,
  className = '',
}: StatusBadgeProps) {
  const statusConfig: Record<StatusType, {
    bg: string;
    text: string;
    dot: string;
    dotAnimate?: boolean;
    defaultLabel: string;
  }> = {
    connected: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      dot: 'bg-green-500',
      defaultLabel: 'Connected',
    },
    disconnected: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      defaultLabel: 'Disconnected',
    },
    pending: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500',
      dotAnimate: true,
      defaultLabel: 'Pending',
    },
    syncing: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      dotAnimate: true,
      defaultLabel: 'Syncing',
    },
    error: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      dot: 'bg-red-500',
      defaultLabel: 'Error',
    },
    warning: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
      defaultLabel: 'Warning',
    },
    expired: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      dot: 'bg-red-400',
      defaultLabel: 'Expired',
    },
    active: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      dot: 'bg-green-500',
      defaultLabel: 'Active',
    },
    inactive: {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      dot: 'bg-gray-400',
      defaultLabel: 'Inactive',
    },
  };

  const sizeStyles = {
    sm: {
      badge: 'px-1.5 py-0.5 text-xs',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      badge: 'px-2 py-1 text-xs',
      dot: 'w-2 h-2',
    },
    lg: {
      badge: 'px-2.5 py-1.5 text-sm',
      dot: 'w-2.5 h-2.5',
    },
  };

  const config = statusConfig[status];
  const styles = sizeStyles[size];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bg} ${config.text} ${styles.badge} ${className}`}
    >
      {showDot && (
        <span className="relative flex">
          <span
            className={`${styles.dot} rounded-full ${config.dot}`}
          />
          {config.dotAnimate && (
            <span
              className={`absolute ${styles.dot} rounded-full ${config.dot} animate-ping opacity-75`}
            />
          )}
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{displayLabel}</span>
    </span>
  );
}

/**
 * IntegrationStatus - Specialized status badge for integrations
 */
export interface IntegrationStatusProps {
  /** Whether the integration is connected */
  isConnected: boolean;
  /** Whether the integration needs re-authentication */
  needsReauth?: boolean;
  /** Whether the integration is currently syncing */
  isSyncing?: boolean;
  /** Last sync time */
  lastSyncTime?: Date;
  /** Additional CSS class names */
  className?: string;
}

export function IntegrationStatus({
  isConnected,
  needsReauth,
  isSyncing,
  lastSyncTime,
  className,
}: IntegrationStatusProps) {
  let status: StatusType;
  let label: string | undefined;

  if (isSyncing) {
    status = 'syncing';
  } else if (needsReauth) {
    status = 'expired';
    label = 'Reconnect Required';
  } else if (isConnected) {
    status = 'connected';
  } else {
    status = 'disconnected';
  }

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <StatusBadge status={status} label={label} />
      {lastSyncTime && isConnected && !needsReauth && (
        <span className="text-xs text-gray-400">
          Last sync: {formatRelativeTime(lastSyncTime)}
        </span>
      )}
    </div>
  );
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default StatusBadge;
