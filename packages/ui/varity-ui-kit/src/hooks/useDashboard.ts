/**
 * useDashboard - Dashboard state management hook
 *
 * Manages dashboard configuration, layout, and data.
 */

import { useState, useCallback, useEffect } from 'react'
import { useVarityAPI } from './useVarityAPI'
import type { DashboardConfig as APIDashboardConfig } from '../types/api-extensions'

export interface DashboardWidget {
  /** Widget ID */
  id: string
  /** Widget type */
  type: 'kpi' | 'chart' | 'table' | 'ai-chat' | 'custom'
  /** Widget title */
  title: string
  /** Widget configuration */
  config: Record<string, any>
  /** Widget position */
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface DashboardConfig {
  /** Dashboard ID */
  id: string
  /** Dashboard title */
  title: string
  /** Dashboard description */
  description?: string
  /** Dashboard widgets */
  widgets: DashboardWidget[]
  /** Dashboard layout */
  layout?: 'grid' | 'flex' | 'custom'
  /** Dashboard theme */
  theme?: string
}

export interface UseDashboardOptions {
  /** Dashboard ID to load */
  dashboardId?: string
  /** Auto-save changes */
  autoSave?: boolean
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number
}

export interface UseDashboardReturn {
  /** Dashboard configuration */
  config: DashboardConfig | null
  /** Loading state */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Update dashboard config */
  updateConfig: (config: Partial<DashboardConfig>) => void
  /** Add widget */
  addWidget: (widget: DashboardWidget) => void
  /** Remove widget */
  removeWidget: (widgetId: string) => void
  /** Update widget */
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void
  /** Save dashboard */
  save: () => Promise<void>
  /** Load dashboard */
  load: (dashboardId: string) => Promise<void>
  /** Reset dashboard */
  reset: () => void
}

/**
 * useDashboard Hook
 *
 * Manage dashboard configuration and widgets.
 *
 * @example
 * ```tsx
 * const { config, addWidget, save } = useDashboard({
 *   dashboardId: 'my-dashboard',
 *   autoSave: true
 * })
 *
 * // Add a widget
 * addWidget({
 *   id: 'widget-1',
 *   type: 'kpi',
 *   title: 'Total Revenue',
 *   config: { metric: 'revenue' },
 *   position: { x: 0, y: 0, width: 4, height: 2 }
 * })
 * ```
 */
export const useDashboard = (options: UseDashboardOptions = {}): UseDashboardReturn => {
  const { client } = useVarityAPI()
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const { dashboardId, autoSave = false, autoSaveInterval = 30000 } = options

  const load = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const dashboard = await (client as any).dashboard.get(id) as APIDashboardConfig
      setConfig(dashboard as any)
      setHasChanges(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load dashboard')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [client])

  const save = useCallback(async () => {
    if (!config) return

    setLoading(true)
    setError(null)
    try {
      await (client as any).dashboard.save(config)
      setHasChanges(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save dashboard')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [client, config])

  // Load dashboard on mount
  useEffect(() => {
    if (dashboardId) {
      load(dashboardId)
    }
  }, [dashboardId, load])

  // Auto-save if enabled
  useEffect(() => {
    if (!autoSave || !hasChanges || !config) return

    const interval = setInterval(() => {
      save()
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, hasChanges, config, autoSaveInterval, save])

  const updateConfig = useCallback((updates: Partial<DashboardConfig>) => {
    setConfig((prev) => prev ? { ...prev, ...updates } : null)
    setHasChanges(true)
  }, [])

  const addWidget = useCallback((widget: DashboardWidget) => {
    setConfig((prev) => {
      if (!prev) return null
      return {
        ...prev,
        widgets: [...prev.widgets, widget]
      }
    })
    setHasChanges(true)
  }, [])

  const removeWidget = useCallback((widgetId: string) => {
    setConfig((prev) => {
      if (!prev) return null
      return {
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== widgetId)
      }
    })
    setHasChanges(true)
  }, [])

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setConfig((prev) => {
      if (!prev) return null
      return {
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === widgetId ? { ...w, ...updates } : w
        )
      }
    })
    setHasChanges(true)
  }, [])

  const reset = useCallback(() => {
    setConfig(null)
    setHasChanges(false)
    setError(null)
  }, [])

  return {
    config,
    loading,
    error,
    updateConfig,
    addWidget,
    removeWidget,
    updateWidget,
    save,
    load,
    reset
  }
}

/**
 * useWidgetData Hook
 *
 * Fetch data for a specific dashboard widget.
 *
 * @example
 * ```tsx
 * const { data, loading } = useWidgetData({
 *   id: 'widget-1',
 *   type: 'kpi',
 *   config: { metric: 'revenue' }
 * })
 * ```
 */
export const useWidgetData = (widget: DashboardWidget) => {
  const { client } = useVarityAPI()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let result
      switch (widget.type) {
        case 'kpi':
          result = await (client as any).analytics.getKPIs({ period: 'current_month' })
          break
        case 'chart':
          result = await (client as any).analytics.getTrends({
            startDate: widget.config.startDate,
            endDate: widget.config.endDate
          })
          break
        case 'table':
          result = await (client as any).analytics.getData(widget.config)
          break
        default:
          result = null
      }
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch widget data')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [client, widget])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
