/**
 * Unit tests for ExportClient
 */

import { ExportClient, ExportOptions, ExportResult, ReportOptions } from './ExportClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('ExportClient', () => {
  let mockHttp: MockHTTPClient
  let exportClient: ExportClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    exportClient = new ExportClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('exportData', () => {
    it('should export data', async () => {
      const mockResult: ExportResult = {
        downloadUrl: 'https://api.varity.io/download/export-123',
        expiresAt: '2025-11-02T00:00:00Z',
        fileSize: 1024000,
        format: 'csv'
      }

      mockHttp.mockPost('/export/data', mockResult)

      const options: ExportOptions = {
        format: 'csv',
        filters: { startDate: '2025-01-01', endDate: '2025-01-31' },
        fields: ['id', 'name', 'value']
      }

      const result = await exportClient.exportData(options)

      expect(result).toEqual(mockResult)
      expect(result.format).toBe('csv')
      expect(result.fileSize).toBe(1024000)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({ method: 'POST', path: '/export/data', data: options })
    })
  })

  describe('generateReport', () => {
    it('should generate report', async () => {
      const mockResult: ExportResult = {
        downloadUrl: 'https://api.varity.io/download/report-123',
        expiresAt: '2025-11-02T00:00:00Z',
        fileSize: 2048000,
        format: 'pdf'
      }

      mockHttp.mockPost('/export/report', mockResult)

      const options: ReportOptions = {
        reportType: 'summary',
        period: { startDate: '2025-01-01', endDate: '2025-01-31' },
        format: 'pdf'
      }

      const result = await exportClient.generateReport(options)

      expect(result).toEqual(mockResult)
      expect(result.format).toBe('pdf')
    })
  })

  describe('download', () => {
    it('should download exported file', async () => {
      const mockBlob = new Blob(['exported data'], { type: 'text/csv' })

      mockHttp.mockGet('/export/download/export-123', mockBlob)

      const result = await exportClient.download('export-123')

      expect(result).toEqual(mockBlob)
    })
  })

  describe('bulkExport', () => {
    it('should bulk export multiple datasets', async () => {
      const mockResults: ExportResult[] = [
        { downloadUrl: 'url1', expiresAt: '2025-11-02', fileSize: 1024, format: 'csv' },
        { downloadUrl: 'url2', expiresAt: '2025-11-02', fileSize: 2048, format: 'json' }
      ]

      mockHttp.mockPost('/export/bulk', mockResults)

      const exports: ExportOptions[] = [
        { format: 'csv', filters: {} },
        { format: 'json', filters: {} }
      ]

      const result = await exportClient.bulkExport(exports)

      expect(result).toEqual(mockResults)
      expect(result).toHaveLength(2)
    })
  })

  describe('scheduleExport', () => {
    it('should schedule recurring export', async () => {
      const mockResult = { scheduleId: 'schedule-123' }

      mockHttp.mockPost('/export/schedule', mockResult)

      const options = { format: 'csv' as const, schedule: '0 0 * * *' }

      const result = await exportClient.scheduleExport(options)

      expect(result).toEqual(mockResult)
      expect(result.scheduleId).toBe('schedule-123')
    })
  })
})
