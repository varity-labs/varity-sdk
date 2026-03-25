/**
 * ChartContainer - Wrapper component for charts with title and actions
 *
 * Provides consistent styling and functionality for chart visualizations.
 */

import React, { ReactNode } from 'react'

export interface ChartContainerProps {
  /** Chart title */
  title: string
  /** Chart subtitle or description */
  subtitle?: string
  /** Chart content (render your chart library here) */
  children: ReactNode
  /** Action buttons */
  actions?: ChartAction[]
  /** Container height */
  height?: number | string
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Empty state message */
  emptyMessage?: string
  /** Show empty state */
  isEmpty?: boolean
}

export interface ChartAction {
  /** Action label */
  label: string
  /** Action icon */
  icon?: string
  /** Action callback */
  onClick: () => void
}

/**
 * ChartContainer Component
 *
 * @example
 * ```tsx
 * <ChartContainer
 *   title="Revenue Trend"
 *   subtitle="Last 30 days"
 *   height={300}
 *   actions={[
 *     { label: "Export", icon: "📥", onClick: () => handleExport() }
 *   ]}
 * >
 *   <YourChartComponent />
 * </ChartContainer>
 * ```
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  actions = [],
  height = 400,
  loading = false,
  error,
  emptyMessage = 'No data available',
  isEmpty = false
}) => {
  return (
    <div
      className="varity-chart-container"
      style={{
        backgroundColor: 'var(--varity-bg-card, #ffffff)',
        border: '1px solid var(--varity-border-color, #e0e0e0)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        {/* Title Section */}
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--varity-text-primary, #212121)',
            marginBottom: subtitle ? '4px' : 0
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--varity-text-secondary, #757575)'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--varity-border-color, #e0e0e0)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--varity-text-primary, #212121)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--varity-bg-hover, #f0f0f0)'
                  e.currentTarget.style.borderColor = 'var(--varity-primary-color, #1976d2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--varity-border-color, #e0e0e0)'
                }}
              >
                {action.icon && <span>{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div style={{
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'relative'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            zIndex: 10
          }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid var(--varity-border-color, #e0e0e0)',
                borderTop: '4px solid var(--varity-primary-color, #1976d2)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        )}

        {error && !loading && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '48px' }}>⚠️</span>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--varity-error-color, #f44336)',
              textAlign: 'center'
            }}>
              {error}
            </p>
          </div>
        )}

        {isEmpty && !loading && !error && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '48px' }}>📊</span>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--varity-text-secondary, #757575)',
              textAlign: 'center'
            }}>
              {emptyMessage}
            </p>
          </div>
        )}

        {!loading && !error && !isEmpty && children}
      </div>
    </div>
  )
}
