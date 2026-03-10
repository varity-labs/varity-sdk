/**
 * Attribution - Required Varity attribution component
 *
 * REQUIRED: Must be visible on all pages per licensing agreement.
 * This component cannot be removed or hidden.
 */

import React from 'react'

export interface AttributionProps {
  /** Position of attribution */
  position?: 'footer' | 'header' | 'floating'
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Show Varity logo */
  showLogo?: boolean
  /** Custom style */
  style?: React.CSSProperties
}

/**
 * Attribution Component
 *
 * IMPORTANT: This component is REQUIRED per the Varity licensing agreement.
 * Removing or hiding this component violates the terms of service.
 *
 * @example
 * ```tsx
 * <Attribution position="footer" size="small" />
 * ```
 */
export const Attribution: React.FC<AttributionProps> = ({
  position = 'footer',
  size = 'medium',
  showLogo = true,
  style
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: '11px',
          padding: '6px 12px',
          logoSize: '14px'
        }
      case 'large':
        return {
          fontSize: '15px',
          padding: '12px 20px',
          logoSize: '20px'
        }
      case 'medium':
      default:
        return {
          fontSize: '13px',
          padding: '8px 16px',
          logoSize: '16px'
        }
    }
  }

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'header':
        return {
          position: 'relative',
          top: 0,
          right: 0
        }
      case 'floating':
        return {
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }
      case 'footer':
      default:
        return {
          position: 'relative'
        }
    }
  }

  const sizeStyles = getSizeStyles()
  const positionStyles = getPositionStyles()

  return (
    <div
      className="varity-attribution"
      data-varity-required="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: sizeStyles.padding,
        backgroundColor: 'var(--varity-bg-attribution, rgba(255, 255, 255, 0.95))',
        borderRadius: '8px',
        border: '1px solid var(--varity-border-color, #e0e0e0)',
        fontSize: sizeStyles.fontSize,
        color: 'var(--varity-text-secondary, #757575)',
        ...positionStyles,
        ...style
      }}
    >
      <span>Powered by</span>

      <a
        href="https://varity.com?utm_source=dashboard&utm_medium=attribution"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--varity-primary-color, #1976d2)',
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        {showLogo && (
          <span style={{ fontSize: sizeStyles.logoSize }}>🚀</span>
        )}
        <span>Varity</span>
      </a>
    </div>
  )
}

/**
 * Validate that attribution is present on page
 * This function can be called during app initialization to ensure compliance.
 */
export const validateAttribution = (): boolean => {
  if (typeof document === 'undefined') return true

  const attributionElements = document.querySelectorAll('[data-varity-required="true"]')

  if (attributionElements.length === 0) {
    console.warn(
      '⚠️ Varity Attribution Missing: The Varity attribution component is required per the licensing agreement. ' +
      'Please include the <Attribution /> component on your page.'
    )
    return false
  }

  return true
}

/**
 * Monitor attribution visibility (development mode only)
 */
export const monitorAttribution = (interval: number = 5000) => {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return
  }

  setInterval(() => {
    validateAttribution()
  }, interval)
}
