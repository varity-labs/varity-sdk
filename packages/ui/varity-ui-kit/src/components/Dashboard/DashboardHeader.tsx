/**
 * DashboardHeader - Top navigation bar for Varity dashboards
 *
 * Displays user information, notifications, and quick actions.
 */

import React from 'react'
import { UserInfo } from './DashboardLayout'

export interface DashboardHeaderProps {
  /** Header height in pixels */
  height?: number
  /** User information */
  user?: UserInfo
  /** Callback when user clicks logout */
  onLogout?: () => void
  /** Show notifications icon */
  showNotifications?: boolean
  /** Number of unread notifications */
  notificationCount?: number
}

/**
 * DashboardHeader Component
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  height = 64,
  user,
  onLogout,
  showNotifications = true,
  notificationCount = 0
}) => {
  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header
      className="varity-dashboard-header"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 'auto',
        height: `${height}px`,
        backgroundColor: 'var(--varity-bg-header, #ffffff)',
        borderBottom: '1px solid var(--varity-border-color, #e0e0e0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      {/* Right side items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notifications */}
        {showNotifications && (
          <button
            className="varity-notification-button"
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px'
            }}
            aria-label="Notifications"
          >
            <span style={{ fontSize: '24px' }}>🔔</span>
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: 'var(--varity-accent-color, #ff5722)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* User Menu */}
        {user && (
          <div
            className="varity-user-menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--varity-bg-secondary, #f9f9f9)',
              cursor: 'pointer'
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--varity-primary-color, #1976d2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
                backgroundSize: 'cover'
              }}
            >
              {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--varity-text-primary, #212121)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--varity-text-secondary, #757575)' }}>
                {truncateAddress(user.address)}
              </span>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--varity-text-secondary, #757575)',
                  fontSize: '12px'
                }}
                aria-label="Logout"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
