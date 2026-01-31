/**
 * Template Configuration System
 *
 * Defines the schema and types for Varity templates (ISO, Healthcare, Finance, Retail, etc.)
 * Enables dynamic SDK configuration based on template selection
 */
import type { Network } from './types';
/**
 * Available template types
 */
export type TemplateType = 'iso' | 'healthcare' | 'finance' | 'retail' | 'custom';
/**
 * Contract configuration for a template
 */
export interface TemplateContract {
    /** Contract name */
    name: string;
    /** Contract description */
    description?: string;
    /** ABI file path or inline ABI */
    abi: string | any[];
    /** Contract address (per network) */
    addresses: Partial<Record<Network, string>>;
    /** Whether contract is required for template */
    required?: boolean;
}
/**
 * Entity configuration (e.g., Merchant, Patient, Customer)
 */
export interface TemplateEntity {
    /** Entity name */
    name: string;
    /** Display name */
    displayName: string;
    /** Entity description */
    description?: string;
    /** Primary identifier field */
    idField: string;
    /** Display field for entity */
    displayField: string;
    /** Available fields */
    fields: EntityField[];
    /** API endpoints for entity CRUD */
    endpoints?: {
        list?: string;
        get?: string;
        create?: string;
        update?: string;
        delete?: string;
    };
    /** Contract mapping configuration (optional - defaults to standard patterns) */
    contractMapping?: {
        /** Contract name (defaults to '{Entity}Registry') */
        contractName?: string;
        /** Function names for CRUD operations */
        functions?: {
            /** Create function (defaults to 'create{Entity}') */
            create?: string;
            /** Get/Read function (defaults to 'get{Entity}') */
            get?: string;
            /** Get all/List function (defaults to 'getAll{Entity}s') */
            getAll?: string;
            /** Update function (defaults to 'update{Entity}') */
            update?: string;
            /** Delete function (defaults to 'delete{Entity}') */
            delete?: string;
            /** Count function (defaults to 'get{Entity}Count') */
            count?: string;
        };
        /** Field mappings (if contract field names differ from entity field names) */
        fieldMappings?: Record<string, string>;
    };
}
/**
 * Entity field types - Universal support for all industries
 */
export type EntityFieldType = 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'currency' | 'decimal' | 'percentage' | 'date' | 'time' | 'datetime' | 'duration' | 'email' | 'phone' | 'url' | 'address' | 'ssn' | 'tax-id' | 'medical-code' | 'sku' | 'barcode' | 'rich-text' | 'markdown' | 'json' | 'file' | 'image' | 'document' | 'lookup' | 'multi-select' | 'coordinates' | 'color' | 'ip-address';
/**
 * Entity field definition
 */
export interface EntityField {
    /** Field name */
    name: string;
    /** Display label */
    label: string;
    /** Field type */
    type: EntityFieldType;
    /** Whether field is required */
    required?: boolean;
    /** Field description */
    description?: string;
    /** Enum values (if type is enum or multi-select) */
    enumValues?: string[];
    /** Lookup configuration (if type is lookup) */
    lookupConfig?: {
        entity: string;
        displayField: string;
        valueField: string;
    };
    /** Validation rules */
    validation?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        precision?: number;
        fileTypes?: string[];
        maxFileSize?: number;
        custom?: string;
    };
    /** Default value */
    defaultValue?: any;
    /** Placeholder text */
    placeholder?: string;
    /** Help text */
    helperText?: string;
}
/**
 * Event configuration for webhooks and notifications
 */
export interface TemplateEvent {
    /** Event name */
    name: string;
    /** Display name */
    displayName: string;
    /** Event description */
    description?: string;
    /** Event category */
    category: string;
    /** Payload schema */
    payloadSchema?: Record<string, any>;
}
/**
 * Metric configuration for analytics
 */
export interface TemplateMetric {
    /** Metric name */
    name: string;
    /** Display name */
    displayName: string;
    /** Metric description */
    description?: string;
    /** Metric type */
    type: 'count' | 'sum' | 'average' | 'percentage' | 'rate';
    /** Data source (API endpoint or query) */
    source: string;
    /** Aggregation function */
    aggregation?: string;
    /** Unit of measurement */
    unit?: string;
    /** Format for display */
    format?: string;
}
/**
 * Dashboard configuration
 */
export interface TemplateDashboard {
    /** Dashboard name */
    name: string;
    /** Display name */
    displayName: string;
    /** Dashboard description */
    description?: string;
    /** Widgets to display */
    widgets: DashboardWidget[];
    /** Default time range */
    defaultTimeRange?: string;
}
/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
    /** Widget type */
    type: 'kpi' | 'chart' | 'table' | 'map' | 'list' | 'custom';
    /** Widget title */
    title: string;
    /** Data source (metric name or API endpoint) */
    source: string;
    /** Widget size (grid units) */
    size?: {
        width: number;
        height: number;
    };
    /** Widget position */
    position?: {
        x: number;
        y: number;
    };
    /** Widget configuration */
    config?: Record<string, any>;
}
/**
 * Storage layer configuration for template
 */
export interface TemplateStorageConfig {
    /** Varity internal namespace */
    varityNamespace?: string;
    /** Industry RAG namespace */
    industryNamespace?: string;
    /** Customer data namespace pattern */
    customerNamespacePattern: string;
    /** Encryption enabled */
    encryptionEnabled: boolean;
    /** Lit Protocol access conditions */
    litProtocolEnabled: boolean;
    /** Celestia DA enabled */
    celestiaDAEnabled: boolean;
    /** ZK proofs enabled */
    zkProofsEnabled: boolean;
}
/**
 * Complete template configuration
 */
export interface TemplateConfig {
    /** Template type identifier */
    type: TemplateType;
    /** Template name */
    name: string;
    /** Template version */
    version: string;
    /** Template description */
    description?: string;
    /** Smart contracts for this template */
    contracts: TemplateContract[];
    /** Entities (data models) */
    entities: TemplateEntity[];
    /** Available events */
    events: TemplateEvent[];
    /** Available metrics */
    metrics: TemplateMetric[];
    /** Dashboard configurations */
    dashboards?: TemplateDashboard[];
    /** Storage configuration */
    storage: TemplateStorageConfig;
    /** API configuration */
    api?: {
        /** Base path for template APIs */
        basePath: string;
        /** Custom endpoints */
        customEndpoints?: Record<string, string>;
    };
    /** Feature flags */
    features?: {
        analytics?: boolean;
        forecasting?: boolean;
        webhooks?: boolean;
        notifications?: boolean;
        export?: boolean;
        cache?: boolean;
        monitoring?: boolean;
    };
    /** Custom configuration */
    custom?: Record<string, any>;
}
/**
 * Template registry for loading and managing templates
 */
export declare class TemplateRegistry {
    private templates;
    /**
     * Register a template configuration
     */
    register(config: TemplateConfig): void;
    /**
     * Get template configuration by type
     */
    get(type: TemplateType): TemplateConfig | undefined;
    /**
     * Check if template is registered
     */
    has(type: TemplateType): boolean;
    /**
     * List all registered templates
     */
    list(): TemplateConfig[];
    /**
     * Load template from JSON
     */
    loadFromJSON(json: string): TemplateConfig;
    /**
     * Load template from URL
     */
    loadFromURL(url: string): Promise<TemplateConfig>;
}
/**
 * Global template registry instance
 */
export declare const templateRegistry: TemplateRegistry;
/**
 * Validate template configuration
 */
export declare function validateTemplate(config: TemplateConfig): {
    valid: boolean;
    errors: string[];
};
/**
 * Get contract ABI by name from template
 */
export declare function getContractABI(template: TemplateConfig, contractName: string): any[] | null;
/**
 * Get contract address for network
 */
export declare function getContractAddress(template: TemplateConfig, contractName: string, network: Network): string | null;
/**
 * Get entity configuration by name
 */
export declare function getEntity(template: TemplateConfig, entityName: string): TemplateEntity | null;
/**
 * Get metric configuration by name
 */
export declare function getMetric(template: TemplateConfig, metricName: string): TemplateMetric | null;
/**
 * Get event configuration by name
 */
export declare function getEvent(template: TemplateConfig, eventName: string): TemplateEvent | null;
/**
 * Merge template configuration with overrides
 */
export declare function mergeTemplateConfig(base: TemplateConfig, overrides: Partial<TemplateConfig>): TemplateConfig;
//# sourceMappingURL=template.d.ts.map