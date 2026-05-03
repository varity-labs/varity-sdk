/**
 * DashboardLayout - Main layout wrapper for Varity dashboards
 *
 * Provides the primary layout structure with sidebar, header, and content area.
 * Fully customizable through theming system.
 */

import React, { ReactNode } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardFooter } from './DashboardFooter'

export interface DashboardLayoutProps {
  /** Content to render in the main area */
  children: ReactNode
  /** Whether to show the sidebar (default: true) */
  showSidebar?: boolean
  /** Whether to show the header (default: true) */
  showHeader?: boolean
  /** Whether to show the footer (default: true) */
  showFooter?: boolean
  /** Custom sidebar width in pixels (default: 240) */
  sidebarWidth?: number
  /** Custom header height in pixels (default: 64) */
  headerHeight?: number
  /** Company logo URL */
  logoUrl?: string
  /** Company name */
  companyName?: string
  /** Navigation items for sidebar */
  navigationItems?: NavigationItem[]
  /** User information for header */
  user?: UserInfo
  /** Callback when user clicks logout */
  onLogout?: () => void
  /** Custom navigation handler (default: window.location.href) */
  onNavigate?: (path: string) => void
  /** Callback when user navigates to profile */
  onNavigateToProfile?: () => void
  /** Callback when user navigates to settings */
  onNavigateToSettings?: () => void
  /** Callback when search bar in header is clicked */
  onSearchClick?: () => void
  /** Placeholder text for header search bar */
  searchPlaceholder?: string
}

export interface NavigationItem {
  /** Navigation item label */
  label: string
  /** Navigation item icon (Material Icon name) */
  icon?: string
  /** Navigation path */
  path: string
  /** Whether item is active */
  active?: boolean
  /** Sub-navigation items */
  children?: NavigationItem[]
}

export interface UserInfo {
  /** User's display name */
  name: string
  /** User's email address */
  email: string
  /** User's avatar URL */
  avatarUrl?: string
}

/**
 * DashboardLayout Component
 *
 * @example
 * ```tsx
 * <DashboardLayout
 *   companyName="Acme Corp"
 *   logoUrl="/logo.png"
 *   user={{ name: "John Doe", email: "john@example.com" }}
 *   navigationItems={[
 *     { label: "Dashboard", icon: "dashboard", path: "/" },
 *     { label: "Analytics", icon: "analytics", path: "/analytics" }
 *   ]}
 * >
 *   <YourDashboardContent />
 * </DashboardLayout>
 * ```
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  sidebarWidth = 240,
  headerHeight = 64,
  logoUrl,
  companyName,
  navigationItems = [],
  user,
  onLogout,
  onNavigate,
  onNavigateToProfile,
  onNavigateToSettings,
  onSearchClick,
  searchPlaceholder
}) => {
  return (
    <div className="varity-dashboard-layout" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--varity-bg-primary, #f5f5f5)'
    }}>
      {/* Sidebar */}
      {showSidebar && (
        <DashboardSidebar
          width={sidebarWidth}
          logoUrl={logoUrl}
          companyName={companyName}
          navigationItems={navigationItems}
          onNavigate={onNavigate || ((path) => {
            // Default: Navigate using window.location for client-side routing compatibility
            if (typeof window !== 'undefined') {
              window.location.href = path;
            }
          })}
        />
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: showSidebar ? sidebarWidth : 0,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header */}
        {showHeader && (
          <DashboardHeader
            height={headerHeight}
            sidebarWidth={showSidebar ? sidebarWidth : 0}
            user={user}
            onLogout={onLogout}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToSettings={onNavigateToSettings}
            onSearchClick={onSearchClick}
            searchPlaceholder={searchPlaceholder}
          />
        )}

        {/* Content */}
        <main style={{
          flex: 1,
          padding: '24px',
          marginTop: showHeader ? headerHeight : 0,
          overflow: 'auto'
        }}>
          {children}
        </main>

        {/* Footer */}
        {showFooter && (
          <DashboardFooter companyName={companyName} />
        )}
      </div>
    </div>
  )
}
