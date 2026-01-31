/**
 * DashboardFooter - Footer component with required Varity attribution
 *
 * REQUIRED: Must be included in all dashboards per licensing agreement.
 */

import React from 'react'

export interface DashboardFooterProps {
  /** Company name to display */
  companyName?: string
  /** Show Varity attribution (required, cannot be false) */
  showAttribution?: boolean
  /** Additional footer links */
  links?: FooterLink[]
}

export interface FooterLink {
  /** Link label */
  label: string
  /** Link URL */
  url: string
  /** Open in new tab */
  external?: boolean
}

/**
 * DashboardFooter Component
 *
 * IMPORTANT: The "Powered by Varity" attribution is REQUIRED per the licensing agreement
 * and cannot be removed. Attempting to remove it violates the terms of service.
 */
export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  companyName,
  showAttribution = true, // Always true, per licensing
  links = []
}) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="varity-dashboard-footer"
      style={{
        padding: '16px 24px',
        backgroundColor: 'var(--varity-bg-footer, #ffffff)',
        borderTop: '1px solid var(--varity-border-color, #e0e0e0)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '14px',
        color: 'var(--varity-text-secondary, #757575)'
      }}
    >
      {/* Left side - Company info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {companyName && (
          <span>
            © {currentYear} {companyName}. All rights reserved.
          </span>
        )}

        {/* Additional links */}
        {links.length > 0 && (
          <div style={{ display: 'flex', gap: '16px' }}>
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                style={{
                  color: 'var(--varity-text-secondary, #757575)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--varity-primary-color, #1976d2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--varity-text-secondary, #757575)'
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Required Varity attribution */}
      {showAttribution && (
        <div
          className="varity-attribution"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'var(--varity-bg-secondary, #f9f9f9)',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        >
          <span style={{ color: 'var(--varity-text-secondary, #757575)' }}>
            Powered by
          </span>
          <a
            href="https://varity.com?utm_source=dashboard&utm_medium=footer"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--varity-primary-color, #1976d2)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>🚀</span>
            Varity
          </a>
        </div>
      )}
    </footer>
  )
}
