/**
 * MetricDisplay - Simple metric display component
 *
 * Displays a metric value with label and optional formatting.
 */

import React from 'react'

export interface MetricDisplayProps {
  /** Metric label */
  label: string
  /** Metric value */
  value: string | number
  /** Value unit */
  unit?: string
  /** Metric format type */
  format?: 'number' | 'currency' | 'percentage' | 'custom'
  /** Currency symbol (if format is 'currency') */
  currencySymbol?: string
  /** Number of decimal places */
  decimals?: number
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Color variant */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  /** Icon to display */
  icon?: string
}

/**
 * MetricDisplay Component
 *
 * @example
 * ```tsx
 * <MetricDisplay
 *   label="Conversion Rate"
 *   value={3.5}
 *   format="percentage"
 *   size="large"
 *   color="success"
 * />
 * ```
 */
export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  unit = '',
  format = 'number',
  currencySymbol = '$',
  decimals = 0,
  size = 'medium',
  color = 'default',
  icon
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return `${currencySymbol}${val.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}`

      case 'percentage':
        return `${val.toFixed(decimals)}%`

      case 'number':
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(decimals)}M`
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(decimals)}K`
        }
        return val.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })

      case 'custom':
        return val.toString() + (unit ? ` ${unit}` : '')

      default:
        return val.toString()
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          valueFontSize: '20px',
          labelFontSize: '12px',
          iconSize: '20px'
        }
      case 'large':
        return {
          valueFontSize: '36px',
          labelFontSize: '16px',
          iconSize: '32px'
        }
      case 'medium':
      default:
        return {
          valueFontSize: '28px',
          labelFontSize: '14px',
          iconSize: '24px'
        }
    }
  }

  const getColor = () => {
    switch (color) {
      case 'primary':
        return 'var(--varity-primary-color, #1976d2)'
      case 'success':
        return 'var(--varity-success-color, #4caf50)'
      case 'warning':
        return 'var(--varity-warning-color, #ff9800)'
      case 'error':
        return 'var(--varity-error-color, #f44336)'
      case 'default':
      default:
        return 'var(--varity-text-primary, #212121)'
    }
  }

  const styles = getSizeStyles()

  return (
    <div
      className="varity-metric-display"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: styles.labelFontSize,
          color: 'var(--varity-text-secondary, #757575)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {label}
      </span>

      {/* Value with Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon && (
          <span style={{ fontSize: styles.iconSize }}>{icon}</span>
        )}
        <span
          style={{
            fontSize: styles.valueFontSize,
            fontWeight: 700,
            color: getColor(),
            lineHeight: 1
          }}
        >
          {formatValue(value)}
        </span>
      </div>
    </div>
  )
}
