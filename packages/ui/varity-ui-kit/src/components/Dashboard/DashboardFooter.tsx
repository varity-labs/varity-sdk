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
            href="https://developer.store.varity.so"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--varity-primary-color, #1976d2)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <defs>
                <linearGradient id="varity-ft-f1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5EEAD4"/><stop offset="100%" stopColor="#0D9488"/>
                </linearGradient>
                <linearGradient id="varity-ft-f2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#1D4ED8"/>
                </linearGradient>
                <linearGradient id="varity-ft-f4" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14B8A6"/><stop offset="100%" stopColor="#2DD4BF"/>
                </linearGradient>
              </defs>
              <path d="M32 6 L48 22 L32 32 L16 22 Z" fill="url(#varity-ft-f4)"/>
              <path d="M16 22 L32 32 L32 58 L8 36 Z" fill="url(#varity-ft-f1)"/>
              <path d="M48 22 L56 36 L32 58 L32 32 Z" fill="url(#varity-ft-f2)"/>
              <path d="M8 36 L32 58 L20 58 Z" fill="url(#varity-ft-f1)" opacity="0.7"/>
              <path d="M56 36 L44 58 L32 58 Z" fill="url(#varity-ft-f2)" opacity="0.7"/>
              <path d="M32 12 L40 22 L32 28 L24 22 Z" fill="white" opacity="0.25"/>
            </svg>
            <span>Varity</span>
          </a>
        </div>
      )}
    </footer>
  )
}
