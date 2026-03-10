/**
 * AnalyticsCard - Metric card component for displaying KPIs
 *
 * Displays a single metric with optional trend indicator and chart.
 */

import React from 'react'

export interface AnalyticsCardProps {
  /** Card title */
  title: string
  /** Main metric value */
  value: string | number
  /** Unit for the value (e.g., "$", "%", "users") */
  unit?: string
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral'
  /** Trend percentage */
  trendValue?: number
  /** Comparison period (e.g., "vs last month") */
  comparisonPeriod?: string
  /** Icon to display */
  icon?: string
  /** Card background color */
  backgroundColor?: string
  /** Card action callback */
  onClick?: () => void
  /** Loading state */
  loading?: boolean
  /** Mini chart data (optional) */
  chartData?: number[]
}

/**
 * AnalyticsCard Component
 *
 * @example
 * ```tsx
 * <AnalyticsCard
 *   title="Total Revenue"
 *   value={125000}
 *   unit="$"
 *   trend="up"
 *   trendValue={12.5}
 *   comparisonPeriod="vs last month"
 *   icon="💰"
 * />
 * ```
 */
export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  unit = '',
  trend = 'neutral',
  trendValue,
  comparisonPeriod,
  icon,
  backgroundColor,
  onClick,
  loading = false,
  chartData
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'var(--varity-success-color, #4caf50)'
      case 'down':
        return 'var(--varity-error-color, #f44336)'
      default:
        return 'var(--varity-text-secondary, #757575)'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '▲'
      case 'down':
        return '▼'
      default:
        return '─'
    }
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  return (
    <div
      className="varity-analytics-card"
      style={{
        backgroundColor: backgroundColor || 'var(--varity-bg-card, #ffffff)',
        border: '1px solid var(--varity-border-color, #e0e0e0)',
        borderRadius: '12px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
        }
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--varity-border-color, #e0e0e0)',
              borderTop: '3px solid var(--varity-primary-color, #1976d2)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '14px',
                color: 'var(--varity-text-secondary, #757575)',
                fontWeight: 500
              }}
            >
              {title}
            </span>
            {icon && (
              <span style={{ fontSize: '24px', opacity: 0.8 }}>{icon}</span>
            )}
          </div>

          {/* Value */}
          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--varity-text-primary, #212121)'
              }}
            >
              {unit && unit !== '%' && <span style={{ fontSize: '24px', marginRight: '4px' }}>{unit}</span>}
              {formatValue(value)}
              {unit === '%' && <span style={{ fontSize: '24px', marginLeft: '2px' }}>{unit}</span>}
            </span>
          </div>

          {/* Trend */}
          {trendValue !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  color: getTrendColor(),
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{getTrendIcon()}</span>
                <span>{Math.abs(trendValue).toFixed(1)}%</span>
              </span>
              {comparisonPeriod && (
                <span style={{ fontSize: '12px', color: 'var(--varity-text-secondary, #757575)' }}>
                  {comparisonPeriod}
                </span>
              )}
            </div>
          )}

          {/* Mini Chart */}
          {chartData && chartData.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                height: '40px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '2px',
                opacity: 0.6
              }}
            >
              {renderMiniChart(chartData)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Render a simple mini chart from data points
 */
function renderMiniChart(data: number[]): React.ReactNode {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return data.map((value, index) => {
    const height = ((value - min) / range) * 100
    return (
      <div
        key={index}
        style={{
          flex: 1,
          height: `${height}%`,
          backgroundColor: 'var(--varity-primary-color, #1976d2)',
          borderRadius: '2px',
          minHeight: '4px'
        }}
      />
    )
  })
}

/**
 * Add keyframe animation for loading spinner
 */
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}
