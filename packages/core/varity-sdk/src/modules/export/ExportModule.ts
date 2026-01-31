import type { VaritySDK } from '../../core/VaritySDK'

/**
 * Export Module
 *
 * Universal data export and report generation across all templates.
 * Supports CSV, JSON, PDF, Excel exports and custom report generation.
 * Works identically for ISO, Healthcare, Finance, Retail, etc.
 */

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx' | 'xml'

export type ReportFormat = 'pdf' | 'docx' | 'html'

export interface ExportOptions {
  dataSource: string // e.g., 'merchants', 'patients', 'transactions'
  format?: ExportFormat
  columns?: string[] // Specific columns to include
  filters?: Record<string, any>
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  includeHeaders?: boolean
  fileName?: string
  metadata?: Record<string, any>
}

export interface ExportResult {
  id: string
  format: ExportFormat
  fileUrl?: string
  downloadUrl?: string
  fileName: string
  size: number // bytes
  rows: number
  createdAt: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface CSVExportOptions extends ExportOptions {
  delimiter?: ',' | ';' | '\t'
  quote?: '"' | "'"
  encoding?: 'utf-8' | 'utf-16' | 'ascii'
  includeHeaders?: boolean
}

export interface JSONExportOptions extends ExportOptions {
  pretty?: boolean
  indent?: number
}

export interface ReportOptions {
  template: string // Report template name
  format: ReportFormat
  period: string // e.g., '2025-01', 'Q1 2025', 'current_month'
  data?: Record<string, any> // Custom data for the report
  includeCharts?: boolean
  includeTableOfContents?: boolean
  locale?: string
  metadata?: Record<string, any>
}

export interface ReportResult {
  id: string
  template: string
  format: ReportFormat
  fileUrl: string
  downloadUrl: string
  fileName: string
  size: number
  pages?: number
  createdAt: string
  expiresAt: string
  metadata?: Record<string, any>
}

export interface DownloadOptions {
  fileId: string
  format?: ExportFormat
  fileName?: string
}

export interface BulkExportOptions {
  exports: ExportOptions[]
  zipFileName?: string
  metadata?: Record<string, any>
}

export interface BulkExportResult {
  id: string
  zipUrl: string
  zipFileName: string
  exports: ExportResult[]
  totalSize: number
  createdAt: string
  expiresAt: string
}

export interface ExportTemplate {
  id?: string
  name: string
  description?: string
  dataSource: string
  columns: string[]
  defaultFilters?: Record<string, any>
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  format: ExportFormat
  metadata?: Record<string, any>
}

export interface ScheduledExportOptions extends ExportOptions {
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    time?: string // HH:MM
    dayOfWeek?: number // 0-6 for weekly
    dayOfMonth?: number // 1-31 for monthly
  }
  recipients?: string[] // Email addresses to send export to
  enabled?: boolean
}

export interface ScheduledExport {
  id: string
  exportOptions: ExportOptions
  schedule: ScheduledExportOptions['schedule']
  recipients?: string[]
  enabled: boolean
  lastRun?: string
  nextRun: string
  createdAt: string
}

/**
 * ExportModule - Universal data export and report generation
 *
 * Provides flexible export capabilities for any data source with multiple
 * format options. Works across all templates by reading from template-specific
 * data sources.
 */
export class ExportModule {
  constructor(private sdk: VaritySDK) {}

  /**
   * Export data to CSV format
   *
   * Universal method - exports any data source to CSV.
   * Template configuration determines available data sources.
   *
   * @example ISO Dashboard
   * ```typescript
   * const csv = await sdk.export.toCSV({
   *   dataSource: 'merchants',
   *   startDate: '2025-01-01',
   *   endDate: '2025-01-31',
   *   columns: ['merchantId', 'businessName', 'status', 'totalVolume'],
   *   delimiter: ','
   * })
   * ```
   *
   * @example Healthcare Dashboard
   * ```typescript
   * const csv = await sdk.export.toCSV({
   *   dataSource: 'patients',
   *   filters: { status: 'active' },
   *   columns: ['patientId', 'name', 'lastVisit']
   * })
   * ```
   */
  async toCSV(options: CSVExportOptions): Promise<ExportResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ ...options, format: 'csv' })
    })

    if (!response.ok) {
      throw new Error(`Failed to export to CSV: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Export data to JSON format
   *
   * Universal method - exports any data source to JSON.
   *
   * @example
   * ```typescript
   * const json = await sdk.export.toJSON({
   *   dataSource: 'transactions',
   *   startDate: '2025-01-01',
   *   endDate: '2025-01-31',
   *   pretty: true,
   *   indent: 2
   * })
   * ```
   */
  async toJSON(options: JSONExportOptions): Promise<ExportResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ ...options, format: 'json' })
    })

    if (!response.ok) {
      throw new Error(`Failed to export to JSON: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Export data to Excel (XLSX) format
   *
   * Universal method - exports any data source to Excel with formatting.
   *
   * @example
   * ```typescript
   * const xlsx = await sdk.export.toExcel({
   *   dataSource: 'merchants',
   *   columns: ['merchantId', 'businessName', 'totalVolume'],
   *   fileName: 'merchants_report_2025-01.xlsx'
   * })
   * ```
   */
  async toExcel(options: ExportOptions): Promise<ExportResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/xlsx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ ...options, format: 'xlsx' })
    })

    if (!response.ok) {
      throw new Error(`Failed to export to Excel: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Generate PDF report
   *
   * Universal method - generates formatted PDF reports using templates.
   * Template configuration provides report templates.
   *
   * @example ISO Dashboard
   * ```typescript
   * const report = await sdk.export.generateReport({
   *   template: 'monthly_summary',
   *   format: 'pdf',
   *   period: '2025-01',
   *   includeCharts: true
   * })
   * ```
   *
   * @example Healthcare Dashboard
   * ```typescript
   * const report = await sdk.export.generateReport({
   *   template: 'patient_outcomes_report',
   *   format: 'pdf',
   *   period: 'Q1 2025',
   *   data: { departmentId: 'cardiology' }
   * })
   * ```
   */
  async generateReport(options: ReportOptions): Promise<ReportResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Download previously exported file
   *
   * Universal method - downloads an export file by ID.
   *
   * @example
   * ```typescript
   * const file = await sdk.export.downloadFile({
   *   fileId: 'export-123',
   *   fileName: 'custom_name.csv'
   * })
   * ```
   */
  async downloadFile(options: DownloadOptions): Promise<Blob> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/export/download/${options.fileId}`,
      {
        method: 'GET',
        headers: {
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    return await response.blob()
  }

  /**
   * Get export file URL for direct download
   *
   * Universal method - returns a downloadable URL for an export.
   */
  async getDownloadUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/export/download-url/${fileId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Export multiple data sources in bulk (creates ZIP file)
   *
   * Universal method - exports multiple data sources and packages them in ZIP.
   *
   * @example
   * ```typescript
   * const bulk = await sdk.export.bulkExport({
   *   exports: [
   *     { dataSource: 'merchants', format: 'csv' },
   *     { dataSource: 'transactions', format: 'csv' },
   *     { dataSource: 'residuals', format: 'xlsx' }
   *   ],
   *   zipFileName: 'iso_data_export_2025-01.zip'
   * })
   * ```
   */
  async bulkExport(options: BulkExportOptions): Promise<BulkExportResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to perform bulk export: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * List available data sources for export
   *
   * Universal method - returns available data sources based on template.
   */
  async listDataSources(): Promise<Array<{ name: string; description?: string; columns: string[] }>> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/data-sources`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list data sources: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create reusable export template
   *
   * Universal method - creates a saved export configuration.
   *
   * @example
   * ```typescript
   * const template = await sdk.export.createTemplate({
   *   name: 'active_merchants_monthly',
   *   description: 'Export active merchants for monthly review',
   *   dataSource: 'merchants',
   *   columns: ['merchantId', 'businessName', 'status', 'totalVolume'],
   *   defaultFilters: { status: 'ACTIVE' },
   *   format: 'csv'
   * })
   * ```
   */
  async createTemplate(template: ExportTemplate): Promise<ExportTemplate> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(template)
    })

    if (!response.ok) {
      throw new Error(`Failed to create export template: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Export using saved template
   *
   * Universal method - runs an export using a saved template.
   */
  async exportFromTemplate(
    templateName: string,
    overrides?: Partial<ExportOptions>
  ): Promise<ExportResult> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(
      `${apiEndpoint}/api/v1/export/templates/${templateName}/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify(overrides || {})
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to export from template: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * List export templates
   *
   * Universal method - lists all saved export templates.
   */
  async listTemplates(): Promise<ExportTemplate[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list export templates: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Schedule recurring export
   *
   * Universal method - schedules automatic exports.
   *
   * @example
   * ```typescript
   * const scheduled = await sdk.export.scheduleExport({
   *   dataSource: 'transactions',
   *   format: 'csv',
   *   schedule: {
   *     frequency: 'monthly',
   *     dayOfMonth: 1,
   *     time: '09:00'
   *   },
   *   recipients: ['finance@example.com'],
   *   enabled: true
   * })
   * ```
   */
  async scheduleExport(options: ScheduledExportOptions): Promise<ScheduledExport> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Failed to schedule export: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * List scheduled exports
   *
   * Universal method - lists all scheduled exports.
   */
  async listScheduledExports(): Promise<ScheduledExport[]> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/scheduled`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list scheduled exports: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Cancel scheduled export
   *
   * Universal method - cancels a scheduled export.
   */
  async cancelScheduledExport(exportId: string): Promise<void> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const response = await fetch(`${apiEndpoint}/api/v1/export/scheduled/${exportId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel scheduled export: ${response.statusText}`)
    }
  }

  /**
   * Get export history
   *
   * Universal method - retrieves past export records.
   */
  async getHistory(options: { limit?: number; offset?: number } = {}): Promise<{
    exports: ExportResult[]
    total: number
  }> {
    const apiEndpoint = this.sdk.getAPIEndpoint()
    const apiKey = this.sdk.getAPIKey()

    const queryParams = new URLSearchParams()
    if (options.limit) queryParams.append('limit', options.limit.toString())
    if (options.offset) queryParams.append('offset', options.offset.toString())

    const response = await fetch(`${apiEndpoint}/api/v1/export/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get export history: ${response.statusText}`)
    }

    return await response.json()
  }
}
