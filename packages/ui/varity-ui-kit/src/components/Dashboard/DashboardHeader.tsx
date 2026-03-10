'use client';

/**
 * DashboardHeader - Top navigation bar for Varity dashboards
 *
 * Displays user information, notifications, and quick actions.
 */

import React, { useState, useEffect, useRef } from 'react'
import { UserInfo } from './DashboardLayout'

export interface DashboardHeaderProps {
  /** Header height in pixels */
  height?: number
  /** Sidebar width in pixels (used to offset header from left) */
  sidebarWidth?: number
  /** User information */
  user?: UserInfo
  /** Callback when user clicks logout */
  onLogout?: () => void
  /** Show notifications icon */
  showNotifications?: boolean
  /** Number of unread notifications */
  notificationCount?: number
  /** Callback when user navigates to profile */
  onNavigateToProfile?: () => void
  /** Callback when user navigates to settings */
  onNavigateToSettings?: () => void
  /** Callback when search bar is clicked */
  onSearchClick?: () => void
  /** Placeholder text for search bar */
  searchPlaceholder?: string
}

/**
 * DashboardHeader Component
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  height = 64,
  sidebarWidth = 0,
  user,
  onLogout,
  showNotifications = true,
  notificationCount = 0,
  onNavigateToProfile,
  onNavigateToSettings,
  onSearchClick,
  searchPlaceholder = 'Search...'
}) => {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="varity-dashboard-header"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: `${sidebarWidth}px`,
        height: `${height}px`,
        backgroundColor: 'var(--varity-bg-header, #ffffff)',
        borderBottom: '1px solid var(--varity-border-color, #e0e0e0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      {/* Search bar */}
      {onSearchClick && (
        <button
          onClick={onSearchClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            maxWidth: '480px',
            padding: '8px 16px',
            backgroundColor: 'var(--varity-bg-secondary, #f3f4f6)',
            border: '1px solid var(--varity-border-color, #e5e7eb)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--varity-text-secondary, #6b7280)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--varity-primary-color, #4f46e5)'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--varity-border-color, #e5e7eb)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span style={{ fontSize: '16px' }}>🔍</span>
          <span style={{ flex: 1, textAlign: 'left' }}>{searchPlaceholder}</span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: 'var(--varity-bg-primary, #ffffff)',
              border: '1px solid var(--varity-border-color, #e5e7eb)',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          >
            ⌘K
          </span>
        </button>
      )}

      {/* Right side items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notifications */}
        {showNotifications && (
          <div ref={notificationRef} style={{ position: 'relative' }}>
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
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
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
            {showNotificationDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  backgroundColor: 'white',
                  border: '1px solid var(--varity-border-color, #e0e0e0)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1002,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--varity-border-color, #e0e0e0)', fontWeight: 600 }}>
                  Notifications
                </div>
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--varity-text-secondary, #757575)' }}>
                  No new notifications
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Menu */}
        {user && (
          <div ref={profileRef} style={{ position: 'relative' }}>
            <div
              className="varity-user-menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
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

              {/* Dropdown arrow */}
              <span style={{ fontSize: '12px', color: 'var(--varity-text-secondary, #757575)' }}>
                {showProfileDropdown ? '▲' : '▼'}
              </span>
            </div>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '200px',
                  backgroundColor: 'white',
                  border: '1px solid var(--varity-border-color, #e0e0e0)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1002,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileDropdown(false);
                      if (onNavigateToProfile) {
                        onNavigateToProfile();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: 'var(--varity-text-primary, #212121)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--varity-bg-hover, #f0f0f0)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileDropdown(false);
                      if (onNavigateToSettings) {
                        onNavigateToSettings();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: 'var(--varity-text-primary, #212121)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--varity-bg-hover, #f0f0f0)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    ⚙️ Settings
                  </button>
                  {onLogout && (
                    <>
                      <div style={{ height: '1px', backgroundColor: 'var(--varity-border-color, #e0e0e0)', margin: '4px 0' }} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogout();
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: 'var(--varity-accent-color, #ff5722)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--varity-bg-hover, #f0f0f0)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        🚪 Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
