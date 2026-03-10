import React from 'react';

export interface LoadingSkeletonProps {
  /** Type of skeleton to display */
  type?: 'text' | 'circle' | 'rect' | 'card' | 'table' | 'list';
  /** Width (CSS value or number for pixels) */
  width?: string | number;
  /** Height (CSS value or number for pixels) */
  height?: string | number;
  /** Number of lines for text skeleton */
  lines?: number;
  /** Number of items for list skeleton */
  items?: number;
  /** Whether to show animation */
  animate?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * LoadingSkeleton - Placeholder loading states
 *
 * A component for displaying loading placeholders with animated
 * shimmer effect. Supports various types including text, cards,
 * tables, and lists.
 *
 * @example
 * ```tsx
 * import { LoadingSkeleton } from '@varity-labs/ui-kit';
 *
 * function MyComponent() {
 *   const { loading, data } = useData();
 *
 *   if (loading) {
 *     return <LoadingSkeleton type="card" />;
 *   }
 *
 *   return <DataDisplay data={data} />;
 * }
 * ```
 */
export function LoadingSkeleton({
  type = 'rect',
  width,
  height,
  lines = 3,
  items = 3,
  animate = true,
  className = '',
}: LoadingSkeletonProps) {
  const baseStyles = `bg-gray-200 ${animate ? 'animate-pulse' : ''}`;

  const getWidthStyle = () => {
    if (width === undefined) return '';
    return typeof width === 'number' ? `${width}px` : width;
  };

  const getHeightStyle = () => {
    if (height === undefined) return '';
    return typeof height === 'number' ? `${height}px` : height;
  };

  const style = {
    width: getWidthStyle() || undefined,
    height: getHeightStyle() || undefined,
  };

  switch (type) {
    case 'text':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseStyles} rounded h-4`}
              style={{
                width: i === lines - 1 ? '60%' : '100%',
              }}
            />
          ))}
        </div>
      );

    case 'circle':
      return (
        <div
          className={`${baseStyles} rounded-full ${className}`}
          style={{
            width: style.width || '48px',
            height: style.height || '48px',
          }}
        />
      );

    case 'rect':
      return (
        <div
          className={`${baseStyles} rounded ${className}`}
          style={{
            width: style.width || '100%',
            height: style.height || '24px',
          }}
        />
      );

    case 'card':
      return (
        <div
          className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
          style={style}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`${baseStyles} rounded-full w-10 h-10`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseStyles} rounded h-4 w-3/4`} />
              <div className={`${baseStyles} rounded h-3 w-1/2`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`${baseStyles} rounded h-4`} />
            <div className={`${baseStyles} rounded h-4`} />
            <div className={`${baseStyles} rounded h-4 w-2/3`} />
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
          {/* Header */}
          <div className="flex gap-4 p-4 border-b border-gray-200 bg-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${baseStyles} rounded h-4 flex-1`} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: items }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex gap-4 p-4 border-b border-gray-100 last:border-b-0"
            >
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <div key={colIndex} className={`${baseStyles} rounded h-4 flex-1`} />
              ))}
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`${baseStyles} rounded-full w-8 h-8`} />
              <div className="flex-1 space-y-2">
                <div className={`${baseStyles} rounded h-4 w-3/4`} />
                <div className={`${baseStyles} rounded h-3 w-1/2`} />
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div
          className={`${baseStyles} rounded ${className}`}
          style={style}
        />
      );
  }
}

/**
 * SkeletonText - Shorthand for text skeleton
 */
export function SkeletonText({ lines = 3, ...props }: Omit<LoadingSkeletonProps, 'type'>) {
  return <LoadingSkeleton type="text" lines={lines} {...props} />;
}

/**
 * SkeletonCard - Shorthand for card skeleton
 */
export function SkeletonCard(props: Omit<LoadingSkeletonProps, 'type'>) {
  return <LoadingSkeleton type="card" {...props} />;
}

/**
 * SkeletonTable - Shorthand for table skeleton
 */
export function SkeletonTable({ items = 5, ...props }: Omit<LoadingSkeletonProps, 'type'>) {
  return <LoadingSkeleton type="table" items={items} {...props} />;
}

/**
 * SkeletonList - Shorthand for list skeleton
 */
export function SkeletonList({ items = 3, ...props }: Omit<LoadingSkeletonProps, 'type'>) {
  return <LoadingSkeleton type="list" items={items} {...props} />;
}

export default LoadingSkeleton;
