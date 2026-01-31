import type { VaritySDK } from '../../core/VaritySDK';
/**
 * Export Module
 *
 * Universal data export and report generation across all templates.
 * Supports CSV, JSON, PDF, Excel exports and custom report generation.
 * Works identically for ISO, Healthcare, Finance, Retail, etc.
 */
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx' | 'xml';
export type ReportFormat = 'pdf' | 'docx' | 'html';
export interface ExportOptions {
    dataSource: string;
    format?: ExportFormat;
    columns?: string[];
    filters?: Record<string, any>;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    includeHeaders?: boolean;
    fileName?: string;
    metadata?: Record<string, any>;
}
export interface ExportResult {
    id: string;
    format: ExportFormat;
    fileUrl?: string;
    downloadUrl?: string;
    fileName: string;
    size: number;
    rows: number;
    createdAt: string;
    expiresAt?: string;
    metadata?: Record<string, any>;
}
export interface CSVExportOptions extends ExportOptions {
    delimiter?: ',' | ';' | '\t';
    quote?: '"' | "'";
    encoding?: 'utf-8' | 'utf-16' | 'ascii';
    includeHeaders?: boolean;
}
export interface JSONExportOptions extends ExportOptions {
    pretty?: boolean;
    indent?: number;
}
export interface ReportOptions {
    template: string;
    format: ReportFormat;
    period: string;
    data?: Record<string, any>;
    includeCharts?: boolean;
    includeTableOfContents?: boolean;
    locale?: string;
    metadata?: Record<string, any>;
}
export interface ReportResult {
    id: string;
    template: string;
    format: ReportFormat;
    fileUrl: string;
    downloadUrl: string;
    fileName: string;
    size: number;
    pages?: number;
    createdAt: string;
    expiresAt: string;
    metadata?: Record<string, any>;
}
export interface DownloadOptions {
    fileId: string;
    format?: ExportFormat;
    fileName?: string;
}
export interface BulkExportOptions {
    exports: ExportOptions[];
    zipFileName?: string;
    metadata?: Record<string, any>;
}
export interface BulkExportResult {
    id: string;
    zipUrl: string;
    zipFileName: string;
    exports: ExportResult[];
    totalSize: number;
    createdAt: string;
    expiresAt: string;
}
export interface ExportTemplate {
    id?: string;
    name: string;
    description?: string;
    dataSource: string;
    columns: string[];
    defaultFilters?: Record<string, any>;
    defaultSort?: {
        field: string;
        order: 'asc' | 'desc';
    };
    format: ExportFormat;
    metadata?: Record<string, any>;
}
export interface ScheduledExportOptions extends ExportOptions {
    schedule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        time?: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
    };
    recipients?: string[];
    enabled?: boolean;
}
export interface ScheduledExport {
    id: string;
    exportOptions: ExportOptions;
    schedule: ScheduledExportOptions['schedule'];
    recipients?: string[];
    enabled: boolean;
    lastRun?: string;
    nextRun: string;
    createdAt: string;
}
/**
 * ExportModule - Universal data export and report generation
 *
 * Provides flexible export capabilities for any data source with multiple
 * format options. Works across all templates by reading from template-specific
 * data sources.
 */
export declare class ExportModule {
    private sdk;
    constructor(sdk: VaritySDK);
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
    toCSV(options: CSVExportOptions): Promise<ExportResult>;
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
    toJSON(options: JSONExportOptions): Promise<ExportResult>;
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
    toExcel(options: ExportOptions): Promise<ExportResult>;
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
    generateReport(options: ReportOptions): Promise<ReportResult>;
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
    downloadFile(options: DownloadOptions): Promise<Blob>;
    /**
     * Get export file URL for direct download
     *
     * Universal method - returns a downloadable URL for an export.
     */
    getDownloadUrl(fileId: string): Promise<{
        url: string;
        expiresAt: string;
    }>;
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
    bulkExport(options: BulkExportOptions): Promise<BulkExportResult>;
    /**
     * List available data sources for export
     *
     * Universal method - returns available data sources based on template.
     */
    listDataSources(): Promise<Array<{
        name: string;
        description?: string;
        columns: string[];
    }>>;
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
    createTemplate(template: ExportTemplate): Promise<ExportTemplate>;
    /**
     * Export using saved template
     *
     * Universal method - runs an export using a saved template.
     */
    exportFromTemplate(templateName: string, overrides?: Partial<ExportOptions>): Promise<ExportResult>;
    /**
     * List export templates
     *
     * Universal method - lists all saved export templates.
     */
    listTemplates(): Promise<ExportTemplate[]>;
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
    scheduleExport(options: ScheduledExportOptions): Promise<ScheduledExport>;
    /**
     * List scheduled exports
     *
     * Universal method - lists all scheduled exports.
     */
    listScheduledExports(): Promise<ScheduledExport[]>;
    /**
     * Cancel scheduled export
     *
     * Universal method - cancels a scheduled export.
     */
    cancelScheduledExport(exportId: string): Promise<void>;
    /**
     * Get export history
     *
     * Universal method - retrieves past export records.
     */
    getHistory(options?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        exports: ExportResult[];
        total: number;
    }>;
}
//# sourceMappingURL=ExportModule.d.ts.map