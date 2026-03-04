import React from 'react';

export interface SkeletonProps {
  variant?: 'rectangle' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
  lines?: number; // For text variant
  className?: string;
}

export function Skeleton({
  variant = 'rectangle',
  width,
  height,
  lines = 3,
  className = '',
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  if (variant === 'text') {
    return (
      <div className={className} role="status" aria-busy="true" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`
              ${baseClasses} h-4 rounded mb-2
              ${index === lines - 1 ? 'w-4/5' : 'w-full'}
            `}
            style={{
              width: index === lines - 1 && width ? width : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    const size = width || height || 40;
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
        }}
        role="status"
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  // Rectangle variant
  return (
    <div
      className={`${baseClasses} rounded ${className}`}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : '20px',
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
