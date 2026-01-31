/**
 * Export Client - Data export functionality
 *
 * Handles exporting data in various formats via API server
 */

import { HTTPClient } from '../../utils/http'

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  filters?: Record<string, any>
  fields?: string[]
  filename?: string
}

export interface ExportResult {
  downloadUrl: string
  expiresAt: string
  fileSize: number
  format: ExportFormat
}

export interface ReportOptions {
  reportType: 'summary' | 'detailed' | 'analytics'
  period: {
    startDate: string
    endDate: string
  }
  format: 'pdf' | 'xlsx'
}

export class ExportClient {
  constructor(private http: HTTPClient) {}

  /**
   * Export data
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    return this.http.post<ExportResult>('/export/data', options)
  }

  /**
   * Generate report
   */
  async generateReport(options: ReportOptions): Promise<ExportResult> {
    return this.http.post<ExportResult>('/export/report', options)
  }

  /**
   * Download exported file
   */
  async download(exportId: string): Promise<Blob> {
    return this.http.get<Blob>(`/export/download/${exportId}`)
  }

  /**
   * Bulk export
   */
  async bulkExport(exports: ExportOptions[]): Promise<ExportResult[]> {
    return this.http.post<ExportResult[]>('/export/bulk', { exports })
  }

  /**
   * Schedule recurring export
   */
  async scheduleExport(options: ExportOptions & { schedule: string }): Promise<{ scheduleId: string }> {
    return this.http.post<{ scheduleId: string }>('/export/schedule', options)
  }
}
