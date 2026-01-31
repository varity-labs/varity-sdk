/**
 * Template Configuration System
 *
 * Defines the schema and types for Varity templates (ISO, Healthcare, Finance, Retail, etc.)
 * Enables dynamic SDK configuration based on template selection
 */
// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================
/**
 * Template registry for loading and managing templates
 */
export class TemplateRegistry {
    templates = new Map();
    /**
     * Register a template configuration
     */
    register(config) {
        this.templates.set(config.type, config);
    }
    /**
     * Get template configuration by type
     */
    get(type) {
        return this.templates.get(type);
    }
    /**
     * Check if template is registered
     */
    has(type) {
        return this.templates.has(type);
    }
    /**
     * List all registered templates
     */
    list() {
        return Array.from(this.templates.values());
    }
    /**
     * Load template from JSON
     */
    loadFromJSON(json) {
        const config = JSON.parse(json);
        this.register(config);
        return config;
    }
    /**
     * Load template from URL
     */
    async loadFromURL(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load template from ${url}: ${response.statusText}`);
        }
        const json = await response.text();
        return this.loadFromJSON(json);
    }
}
// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================
/**
 * Global template registry instance
 */
export const templateRegistry = new TemplateRegistry();
// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================
/**
 * Validate template configuration
 */
export function validateTemplate(config) {
    const errors = [];
    // Validate required fields
    if (!config.type)
        errors.push('Template type is required');
    if (!config.name)
        errors.push('Template name is required');
    if (!config.version)
        errors.push('Template version is required');
    if (!config.contracts || config.contracts.length === 0) {
        errors.push('Template must have at least one contract');
    }
    if (!config.entities || config.entities.length === 0) {
        errors.push('Template must have at least one entity');
    }
    if (!config.storage)
        errors.push('Storage configuration is required');
    // Validate contracts
    if (config.contracts) {
        config.contracts.forEach((contract, index) => {
            if (!contract.name)
                errors.push(`Contract ${index}: name is required`);
            if (!contract.abi)
                errors.push(`Contract ${index}: ABI is required`);
            if (!contract.addresses || Object.keys(contract.addresses).length === 0) {
                errors.push(`Contract ${index}: at least one network address is required`);
            }
        });
    }
    // Validate entities
    if (config.entities) {
        config.entities.forEach((entity, index) => {
            if (!entity.name)
                errors.push(`Entity ${index}: name is required`);
            if (!entity.idField)
                errors.push(`Entity ${index}: idField is required`);
            if (!entity.fields || entity.fields.length === 0) {
                errors.push(`Entity ${index}: at least one field is required`);
            }
        });
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Get contract ABI by name from template
 */
export function getContractABI(template, contractName) {
    const contract = template.contracts.find(c => c.name === contractName);
    if (!contract)
        return null;
    // Return inline ABI or load from path
    if (Array.isArray(contract.abi)) {
        return contract.abi;
    }
    // If ABI is a string path, it should be loaded by the application
    return null;
}
/**
 * Get contract address for network
 */
export function getContractAddress(template, contractName, network) {
    const contract = template.contracts.find(c => c.name === contractName);
    if (!contract)
        return null;
    return contract.addresses[network] || null;
}
/**
 * Get entity configuration by name
 */
export function getEntity(template, entityName) {
    return template.entities.find(e => e.name === entityName) || null;
}
/**
 * Get metric configuration by name
 */
export function getMetric(template, metricName) {
    return template.metrics.find(m => m.name === metricName) || null;
}
/**
 * Get event configuration by name
 */
export function getEvent(template, eventName) {
    return template.events.find(e => e.name === eventName) || null;
}
/**
 * Merge template configuration with overrides
 */
export function mergeTemplateConfig(base, overrides) {
    // Properly merge API config
    let mergedApi = undefined;
    if (base.api && overrides.api) {
        mergedApi = { ...base.api, ...overrides.api };
    }
    else if (base.api) {
        mergedApi = base.api;
    }
    else if (overrides.api) {
        mergedApi = overrides.api;
    }
    return {
        ...base,
        ...overrides,
        contracts: overrides.contracts || base.contracts,
        entities: overrides.entities || base.entities,
        events: overrides.events || base.events,
        metrics: overrides.metrics || base.metrics,
        dashboards: overrides.dashboards || base.dashboards,
        storage: { ...base.storage, ...overrides.storage },
        api: mergedApi,
        features: { ...base.features, ...overrides.features },
        custom: { ...base.custom, ...overrides.custom }
    };
}
//# sourceMappingURL=template.js.map