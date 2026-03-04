/**
 * Dashboard Components
 *
 * Complete dashboard layout system for Varity-powered applications.
 * Includes layout components, data display components, and loading states.
 */

// Layout Components
export { DashboardLayout } from './DashboardLayout'
export { DashboardHeader } from './DashboardHeader'
export { DashboardSidebar } from './DashboardSidebar'
export { DashboardFooter } from './DashboardFooter'

// Data Display Components
export { KPICard, type KPICardProps } from './KPICard'
export { StatusBadge, IntegrationStatus, type StatusBadgeProps, type StatusType, type IntegrationStatusProps } from './StatusBadge'
export { EmptyState, EmptyStatePresets, type EmptyStateProps } from './EmptyState'

// Loading States
export {
  LoadingSkeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  type LoadingSkeletonProps,
} from './LoadingSkeleton'

// Layout Types
export type {
  DashboardLayoutProps,
  NavigationItem,
  UserInfo
} from './DashboardLayout'

export type { DashboardHeaderProps } from './DashboardHeader'
export type { DashboardSidebarProps } from './DashboardSidebar'
export type { DashboardFooterProps, FooterLink } from './DashboardFooter'
