/**
 * Dashboard Layout Generator
 *
 * Generates dashboard layouts from template configuration
 */

import * as fs from 'fs'
import * as path from 'path'
import type { TemplateConfig } from '../../core/template'

export interface GenerateDashboardOptions {
  templatePath: string
  outputPath: string
  dashboardsPath?: string
}

export interface GenerateDashboardResult {
  dashboards: string[]
  success: boolean
  errors: string[]
}

/**
 * Generate dashboard layouts from template configuration
 */
export async function generateDashboards(
  options: GenerateDashboardOptions
): Promise<GenerateDashboardResult> {
  const result: GenerateDashboardResult = {
    dashboards: [],
    success: false,
    errors: []
  }

  try {
    // Load template configuration
    const templatePath = path.resolve(options.templatePath)
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const template: TemplateConfig = JSON.parse(templateContent)

    // Create output directory
    const outputPath = path.resolve(options.outputPath)
    const dashboardsPath = options.dashboardsPath || path.join(outputPath, 'src', 'components', 'dashboards')

    if (!fs.existsSync(dashboardsPath)) {
      fs.mkdirSync(dashboardsPath, { recursive: true })
    }

    // Check if template has dashboards defined
    if (!template.dashboards || template.dashboards.length === 0) {
      // Generate default dashboard if none defined
      const defaultDashboard = generateDefaultDashboard(template)
      const dashboardFile = path.join(dashboardsPath, 'OverviewDashboard.tsx')
      fs.writeFileSync(dashboardFile, defaultDashboard)
      result.dashboards.push(dashboardFile)
    } else {
      // Generate dashboards from configuration
      for (const dashboard of template.dashboards) {
        try {
          const dashboardCode = generateDashboardLayout(dashboard, template)
          const dashboardName = capitalize(dashboard.name) + 'Dashboard'
          const dashboardFile = path.join(dashboardsPath, `${dashboardName}.tsx`)
          fs.writeFileSync(dashboardFile, dashboardCode)
          result.dashboards.push(dashboardFile)
        } catch (error) {
          result.errors.push(
            `Failed to generate dashboard ${dashboard.name}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
        }
      }
    }

    // Generate dashboard index file
    const indexCode = generateDashboardIndex(template)
    const indexFile = path.join(dashboardsPath, 'index.ts')
    fs.writeFileSync(indexFile, indexCode)
    result.dashboards.push(indexFile)

    result.success = result.errors.length === 0

  } catch (error) {
    result.errors.push(
      `Failed to generate dashboards: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Generate dashboard layout from configuration
 */
function generateDashboardLayout(dashboard: any, template: TemplateConfig): string {
  const dashboardName = capitalize(dashboard.name)
  const displayName = dashboard.displayName || dashboardName

  // Generate widgets
  const widgets = dashboard.widgets?.map((widget: any, index: number) => {
    return generateWidget(widget, index, template)
  }) || []

  return `/**
 * ${displayName} Dashboard
 *
 * Auto-generated from template: ${template.name}
 */

import React, { useState, useEffect } from 'react'
import { Box, Grid, Typography, CircularProgress, Alert } from '@mui/material'
import { KPICard, ChartWidget } from '@varity-labs/sdk/ui/components'
import { useSDK } from '../hooks/useSDK'

export const ${dashboardName}Dashboard: React.FC = () => {
  const { sdk } = useSDK()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any>({})

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      // Load data for all widgets
      const results = await Promise.all([
        ${dashboard.widgets?.map((w: any, i: number) =>
          generateDataLoader(w, i)
        ).join(',\n        ') || '// No widgets defined'}
      ])

      setData({
        ${dashboard.widgets?.map((_w: any, i: number) =>
          `widget${i}: results[${i}]`
        ).join(',\n        ') || ''}
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ${displayName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        ${widgets.join('\n        ')}
      </Grid>
    </Box>
  )
}
`
}

/**
 * Generate widget component
 */
function generateWidget(widget: any, index: number, template: TemplateConfig): string {
  const position = widget.position || { x: 0, y: 0 }
  const size = widget.size || { width: 12, height: 1 }

  const gridProps = `xs={12} md={${size.width}} sx={{ gridColumn: ${position.x + 1}, gridRow: ${position.y + 1} }}`

  switch (widget.type) {
    case 'kpi':
      return `
        <Grid item ${gridProps}>
          <KPICard
            title="${widget.title}"
            value={data.widget${index}?.value || 0}
            subtitle="${widget.subtitle || ''}"
            loading={loading}
            variant="${widget.variant || 'default'}"
          />
        </Grid>`

    case 'chart':
      const chartType = widget.config?.chartType || 'line'
      const yKeys = widget.config?.yKeys || ['value']

      return `
        <Grid item ${gridProps}>
          <ChartWidget
            title="${widget.title}"
            type="${chartType}"
            data={data.widget${index} || []}
            yKeys={${JSON.stringify(yKeys)}}
            loading={loading}
            height={${widget.config?.height || 300}}
          />
        </Grid>`

    case 'table':
      return `
        <Grid item ${gridProps}>
          {/* Table widget - implement with DataTable component */}
        </Grid>`

    case 'list':
      return `
        <Grid item ${gridProps}>
          {/* List widget - implement with custom list component */}
        </Grid>`

    default:
      return `
        <Grid item ${gridProps}>
          {/* Unknown widget type: ${widget.type} */}
        </Grid>`
  }
}

/**
 * Generate data loader for widget
 */
function generateDataLoader(widget: any, index: number): string {
  const source = widget.source || widget.config?.source

  if (!source) {
    return `Promise.resolve({ value: 0 })`
  }

  // Parse source string (e.g., "analytics.getKPIs", "contracts.getTotalMerchants")
  const [module, method] = source.split('.')

  switch (widget.type) {
    case 'kpi':
      if (module === 'analytics') {
        return `sdk.analytics.${method || 'getKPIs'}()`
      } else if (module === 'contracts') {
        return `sdk.contracts.call('Registry', '${method}', [])`
      }
      return `Promise.resolve({ value: 0 })`

    case 'chart':
      if (module === 'analytics') {
        return `sdk.analytics.${method || 'getTrends'}({ period: 'last_12_months' })`
      }
      return `Promise.resolve([])`

    default:
      return `Promise.resolve(null)`
  }
}

/**
 * Generate default dashboard when none defined in template
 */
function generateDefaultDashboard(template: TemplateConfig): string {
  const entityWidgets = template.entities?.slice(0, 4).map((entity, index) => {
    const entityName = capitalize(entity.name)
    return `
        <Grid item xs={12} md={6}>
          <KPICard
            title="Total ${entity.displayName || entityName}s"
            value={data.total${entityName}s || 0}
            loading={loading}
          />
        </Grid>`
  }).join('\n        ') || ''

  return `/**
 * Overview Dashboard
 *
 * Auto-generated default dashboard for ${template.name}
 */

import React, { useState, useEffect } from 'react'
import { Box, Grid, Typography, CircularProgress, Alert } from '@mui/material'
import { KPICard } from '@varity-labs/sdk/ui/components'
import { useSDK } from '../hooks/useSDK'

export const OverviewDashboard: React.FC = () => {
  const { sdk } = useSDK()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any>({})

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      // Load KPI data
      const kpis = await sdk.analytics.getKPIs({ period: 'current_month' })
      setData(kpis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Overview
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        ${entityWidgets}

        <Grid item xs={12} md={6}>
          <KPICard
            title="Active Users"
            value={data.activeUsers || 0}
            trend={{ value: 12, label: 'vs last month' }}
            loading={loading}
            variant="success"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <KPICard
            title="Total Volume"
            value={data.totalVolume || 0}
            trend={{ value: -5, label: 'vs last month' }}
            loading={loading}
            variant="primary"
          />
        </Grid>
      </Grid>
    </Box>
  )
}
`
}

/**
 * Generate dashboard index file
 */
function generateDashboardIndex(template: TemplateConfig): string {
  const dashboards = template.dashboards || [{ name: 'overview' }]

  const exports = dashboards.map(dashboard => {
    const name = capitalize(dashboard.name) + 'Dashboard'
    return `export { ${name} } from './${name}'`
  })

  return `/**
 * Dashboard Components
 *
 * Auto-generated dashboard layouts
 */

${exports.join('\n')}
`
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
