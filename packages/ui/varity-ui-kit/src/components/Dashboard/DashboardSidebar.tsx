'use client';

/**
 * DashboardSidebar - Navigation sidebar for Varity dashboards
 *
 * Provides main navigation with collapsible menu items.
 */

import React, { useState } from 'react'
import { NavigationItem } from './DashboardLayout'

export interface DashboardSidebarProps {
  /** Sidebar width in pixels */
  width?: number
  /** Company logo URL */
  logoUrl?: string
  /** Company name */
  companyName?: string
  /** Navigation items */
  navigationItems?: NavigationItem[]
  /** Callback when navigation item is clicked */
  onNavigate?: (path: string) => void
  /** Whether sidebar is collapsed */
  collapsed?: boolean
}

/**
 * DashboardSidebar Component
 */
export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  width = 240,
  logoUrl,
  companyName = 'Dashboard',
  navigationItems = [],
  onNavigate,
  collapsed = false
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (label: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(label)) {
      newExpanded.delete(label)
    } else {
      newExpanded.add(label)
    }
    setExpandedItems(newExpanded)
  }

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
  }

  const renderNavigationItem = (item: NavigationItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.label)

    return (
      <div key={item.path} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className={`varity-nav-item ${item.active ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: item.active ? 'var(--varity-primary-color, #1976d2)' : 'transparent',
            color: item.active ? 'white' : 'var(--varity-text-primary, #212121)',
            borderRadius: '8px',
            margin: '4px 8px',
            transition: 'all 0.2s ease',
            fontWeight: item.active ? 600 : 400
          }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.label)
            } else {
              handleNavigate(item.path)
            }
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              e.currentTarget.style.backgroundColor = 'var(--varity-bg-hover, #f0f0f0)'
            }
          }}
          onMouseLeave={(e) => {
            if (!item.active) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {/* Icon */}
          {item.icon && (
            <span style={{ marginRight: '12px', fontSize: '20px' }}>
              {getIconForName(item.icon)}
            </span>
          )}

          {/* Label */}
          <span style={{ flex: 1, fontSize: '14px' }}>{item.label}</span>

          {/* Expand indicator */}
          {hasChildren && (
            <span style={{ fontSize: '12px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>

        {/* Child items */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className="varity-dashboard-sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: collapsed ? '64px' : `${width}px`,
        height: '100vh',
        backgroundColor: 'var(--varity-bg-sidebar, #ffffff)',
        borderRight: '1px solid var(--varity-border-color, #e0e0e0)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 1001,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--varity-border-color, #e0e0e0)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${companyName} logo`}
            style={{
              height: '32px',
              width: 'auto',
              maxWidth: collapsed ? '32px' : '40px'
            }}
          />
        )}
        {!collapsed && (
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--varity-text-primary, #212121)'
            }}
          >
            {companyName}
          </h1>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navigationItems.map((item) => renderNavigationItem(item))}
      </nav>

      {/* Powered by Varity */}
      {!collapsed && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--varity-border-color, #e0e0e0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: 'var(--varity-text-secondary, #757575)'
            }}
          >
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
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <defs>
                <linearGradient id="varity-sb-f1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5EEAD4"/><stop offset="100%" stopColor="#0D9488"/>
                </linearGradient>
                <linearGradient id="varity-sb-f2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#1D4ED8"/>
                </linearGradient>
                <linearGradient id="varity-sb-f4" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14B8A6"/><stop offset="100%" stopColor="#2DD4BF"/>
                </linearGradient>
              </defs>
              <path d="M32 6 L48 22 L32 32 L16 22 Z" fill="url(#varity-sb-f4)"/>
              <path d="M16 22 L32 32 L32 58 L8 36 Z" fill="url(#varity-sb-f1)"/>
              <path d="M48 22 L56 36 L32 58 L32 32 Z" fill="url(#varity-sb-f2)"/>
              <path d="M8 36 L32 58 L20 58 Z" fill="url(#varity-sb-f1)" opacity="0.7"/>
              <path d="M56 36 L44 58 L32 58 Z" fill="url(#varity-sb-f2)" opacity="0.7"/>
              <path d="M32 12 L40 22 L32 28 L24 22 Z" fill="white" opacity="0.25"/>
            </svg>
            Varity
          </a>
        </div>
      )}
    </aside>
  )
}

/**
 * Helper function to get emoji icon for common icon names
 */
function getIconForName(iconName: string): string {
  const iconMap: Record<string, string> = {
    dashboard: '📊',
    analytics: '📈',
    chart: '📉',
    users: '👥',
    people: '👥',
    team: '👥',
    list: '📋',
    todo: '✅',
    task: '📝',
    settings: '⚙️',
    profile: '👤',
    storage: '💾',
    compute: '🖥️',
    ai: '🤖',
    chat: '💬',
    export: '📤',
    import: '📥',
    notification: '🔔',
    webhook: '🔗',
    oracle: '🔮',
    zk: '🔐',
    cache: '⚡',
    monitoring: '📡',
    forecasting: '🔭',
    home: '🏠',
    folder: '📁',
    file: '📄',
    help: '❓',
    search: '🔍'
  }

  return iconMap[iconName.toLowerCase()] || '•'
}
