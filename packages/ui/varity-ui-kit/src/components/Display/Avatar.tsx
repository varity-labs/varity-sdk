import React, { useState } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name: string; // For initials fallback
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-yellow-500',
  };

  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  // Get initials from name (first letters of first two words)
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          rounded-full overflow-hidden flex items-center justify-center
          bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]
          text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]
          font-semibold
          ${sizeClasses[size]}
        `}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800
            ${statusColors[status]}
            ${statusSize[size]}
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export interface AvatarGroupProps {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = 'md',
  className = '',
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`
            relative inline-block border-2 border-white dark:border-gray-800 rounded-full
            ${index > 0 ? overlapClasses[size] : ''}
          `}
          style={{ zIndex: displayAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={`
            relative inline-block border-2 border-white dark:border-gray-800 rounded-full
            ${overlapClasses[size]}
          `}
          style={{ zIndex: 0 }}
        >
          <div
            className={`
              rounded-full flex items-center justify-center
              bg-gray-200 dark:bg-gray-700
              text-gray-700 dark:text-gray-300
              font-semibold
              ${size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}
            `}
          >
            <span>+{remaining}</span>
          </div>
        </div>
      )}
    </div>
  );
}
