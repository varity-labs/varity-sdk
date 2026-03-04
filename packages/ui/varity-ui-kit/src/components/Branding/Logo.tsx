/**
 * Logo - Customizable logo component
 *
 * Displays company logo with fallback to text.
 */

import React from 'react'

export interface LogoProps {
  /** Logo image URL */
  src?: string
  /** Company name (fallback if no image) */
  companyName?: string
  /** Logo size */
  size?: 'small' | 'medium' | 'large' | number
  /** Custom width (overrides size) */
  width?: number
  /** Custom height (overrides size) */
  height?: number
  /** Alt text */
  alt?: string
  /** Click handler */
  onClick?: () => void
  /** Show company name alongside logo */
  showName?: boolean
}

/**
 * Logo Component
 *
 * @example
 * ```tsx
 * <Logo
 *   src="/logo.png"
 *   companyName="Acme Corp"
 *   size="medium"
 *   showName
 * />
 * ```
 */
export const Logo: React.FC<LogoProps> = ({
  src,
  companyName = 'Dashboard',
  size = 'medium',
  width,
  height,
  alt,
  onClick,
  showName = false
}) => {
  const getSize = (): { width: number; height: number } => {
    if (width && height) {
      return { width, height }
    }

    if (typeof size === 'number') {
      return { width: size, height: size }
    }

    switch (size) {
      case 'small':
        return { width: 24, height: 24 }
      case 'large':
        return { width: 48, height: 48 }
      case 'medium':
      default:
        return { width: 32, height: 32 }
    }
  }

  const { width: logoWidth, height: logoHeight } = getSize()

  return (
    <div
      className="varity-logo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {/* Logo Image or Fallback */}
      {src ? (
        <img
          src={src}
          alt={alt || `${companyName} logo`}
          style={{
            width: `${logoWidth}px`,
            height: `${logoHeight}px`,
            objectFit: 'contain'
          }}
        />
      ) : (
        <div
          style={{
            width: `${logoWidth}px`,
            height: `${logoHeight}px`,
            backgroundColor: 'var(--varity-primary-color, #1976d2)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: `${logoHeight * 0.5}px`
          }}
        >
          {companyName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Company Name */}
      {showName && (
        <span
          style={{
            fontSize: `${logoHeight * 0.6}px`,
            fontWeight: 600,
            color: 'var(--varity-text-primary, #212121)'
          }}
        >
          {companyName}
        </span>
      )}
    </div>
  )
}
