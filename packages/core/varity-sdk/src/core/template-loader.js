/**
 * Template Loader
 *
 * Utility for loading and registering built-in templates
 */
import { templateRegistry } from './template';
// Import template JSON files (will be bundled by build tool)
// Note: In actual implementation, these would be imported as:
// import isoTemplate from '../../templates/iso.template.json'
// For now, we'll use a dynamic loading approach
/**
 * Load built-in ISO template
 */
export function loadISOTemplate() {
    const template = {
        type: 'iso',
        name: 'ISO Merchant Services Dashboard',
        version: '1.0.0',
        description: 'Payment processing and merchant management platform for Independent Sales Organizations',
        contracts: [
            {
                name: 'MerchantRegistry',
                description: 'Merchant registration and management',
                abi: '../../contracts/abis/iso/MerchantRegistry.json',
                addresses: {
                    'arbitrum-sepolia': '',
                    'arbitrum-l3-testnet': '',
                    'arbitrum-l3-mainnet': ''
                },
                required: true
            },
            {
                name: 'TransactionVault',
                description: 'Transaction recording and storage',
                abi: '../../contracts/abis/iso/TransactionVault.json',
                addresses: {
                    'arbitrum-sepolia': '',
                    'arbitrum-l3-testnet': '',
                    'arbitrum-l3-mainnet': ''
                },
                required: true
            },
            {
                name: 'RepPerformance',
                description: 'Sales representative performance tracking',
                abi: '../../contracts/abis/iso/RepPerformance.json',
                addresses: {
                    'arbitrum-sepolia': '',
                    'arbitrum-l3-testnet': '',
                    'arbitrum-l3-mainnet': ''
                },
                required: true
            },
            {
                name: 'ResidualCalculator',
                description: 'Residual income calculation and distribution',
                abi: '../../contracts/abis/iso/ResidualCalculator.json',
                addresses: {
                    'arbitrum-sepolia': '',
                    'arbitrum-l3-testnet': '',
                    'arbitrum-l3-mainnet': ''
                },
                required: true
            },
            {
                name: 'AccessControlRegistry',
                description: 'Role-based access control',
                abi: '../../contracts/abis/iso/AccessControlRegistry.json',
                addresses: {
                    'arbitrum-sepolia': '',
                    'arbitrum-l3-testnet': '',
                    'arbitrum-l3-mainnet': ''
                },
                required: true
            },
            {
                name: 'DataProofRegistry',
                description: 'Data integrity and ownership proofs',
                abi: '../../contracts/abis/iso/DataProofRegistry.json',
                addresses: {
                    'arbitrum-sepolia': '',
                    'arbitrum-l3-testnet': '',
                    'arbitrum-l3-mainnet': ''
                },
                required: true
            }
        ],
        entities: [
            {
                name: 'merchant',
                displayName: 'Merchant',
                description: 'Business registered for payment processing',
                idField: 'merchantId',
                displayField: 'businessName',
                fields: [
                    {
                        name: 'merchantId',
                        label: 'Merchant ID',
                        type: 'string',
                        required: true
                    },
                    {
                        name: 'businessName',
                        label: 'Business Name',
                        type: 'string',
                        required: true
                    },
                    {
                        name: 'walletAddress',
                        label: 'Wallet Address',
                        type: 'address',
                        required: true
                    },
                    {
                        name: 'status',
                        label: 'Status',
                        type: 'enum',
                        required: true,
                        enumValues: ['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED']
                    },
                    {
                        name: 'monthlyVolume',
                        label: 'Monthly Volume',
                        type: 'number'
                    },
                    {
                        name: 'onboardedBy',
                        label: 'Onboarded By',
                        type: 'address'
                    }
                ],
                endpoints: {
                    list: '/api/v1/merchants',
                    get: '/api/v1/merchants/:id',
                    create: '/api/v1/merchants',
                    update: '/api/v1/merchants/:id'
                }
            },
            {
                name: 'transaction',
                displayName: 'Transaction',
                description: 'Payment transaction record',
                idField: 'transactionId',
                displayField: 'transactionId',
                fields: [
                    {
                        name: 'transactionId',
                        label: 'Transaction ID',
                        type: 'string',
                        required: true
                    },
                    {
                        name: 'merchantId',
                        label: 'Merchant ID',
                        type: 'string',
                        required: true
                    },
                    {
                        name: 'amount',
                        label: 'Amount',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'type',
                        label: 'Type',
                        type: 'enum',
                        required: true,
                        enumValues: ['SALE', 'REFUND', 'CHARGEBACK', 'ADJUSTMENT']
                    },
                    {
                        name: 'timestamp',
                        label: 'Timestamp',
                        type: 'date',
                        required: true
                    }
                ],
                endpoints: {
                    list: '/api/v1/transactions',
                    get: '/api/v1/transactions/:id',
                    create: '/api/v1/transactions'
                }
            },
            {
                name: 'rep',
                displayName: 'Sales Representative',
                description: 'Sales representative managing merchants',
                idField: 'repAddress',
                displayField: 'repAddress',
                fields: [
                    {
                        name: 'repAddress',
                        label: 'Rep Address',
                        type: 'address',
                        required: true
                    },
                    {
                        name: 'status',
                        label: 'Status',
                        type: 'enum',
                        required: true,
                        enumValues: ['ACTIVE', 'INACTIVE', 'SUSPENDED']
                    },
                    {
                        name: 'totalMerchants',
                        label: 'Total Merchants',
                        type: 'number'
                    },
                    {
                        name: 'totalResiduals',
                        label: 'Total Residuals',
                        type: 'number'
                    }
                ],
                endpoints: {
                    list: '/api/v1/reps',
                    get: '/api/v1/reps/:address',
                    create: '/api/v1/reps'
                }
            }
        ],
        events: [
            {
                name: 'merchant.registered',
                displayName: 'Merchant Registered',
                description: 'New merchant registered for processing',
                category: 'merchant'
            },
            {
                name: 'merchant.updated',
                displayName: 'Merchant Updated',
                description: 'Merchant information updated',
                category: 'merchant'
            },
            {
                name: 'merchant.status_changed',
                displayName: 'Merchant Status Changed',
                description: 'Merchant status changed (activated, suspended, etc.)',
                category: 'merchant'
            },
            {
                name: 'transaction.created',
                displayName: 'Transaction Created',
                description: 'New transaction recorded',
                category: 'transaction'
            },
            {
                name: 'transaction.voided',
                displayName: 'Transaction Voided',
                description: 'Transaction voided or refunded',
                category: 'transaction'
            },
            {
                name: 'rep.registered',
                displayName: 'Rep Registered',
                description: 'New sales representative registered',
                category: 'rep'
            },
            {
                name: 'residual.calculated',
                displayName: 'Residual Calculated',
                description: 'Monthly residual income calculated',
                category: 'residual'
            },
            {
                name: 'residual.paid',
                displayName: 'Residual Paid',
                description: 'Residual income paid to representative',
                category: 'residual'
            }
        ],
        metrics: [
            {
                name: 'total_merchants',
                displayName: 'Total Merchants',
                description: 'Total number of active merchants',
                type: 'count',
                source: '/api/v1/analytics/metrics/merchants/count',
                unit: 'merchants'
            },
            {
                name: 'total_volume',
                displayName: 'Total Processing Volume',
                description: 'Total payment processing volume',
                type: 'sum',
                source: '/api/v1/analytics/metrics/transactions/volume',
                unit: 'USD',
                format: 'currency'
            },
            {
                name: 'avg_transaction_size',
                displayName: 'Average Transaction Size',
                description: 'Average transaction amount',
                type: 'average',
                source: '/api/v1/analytics/metrics/transactions/avg_size',
                unit: 'USD',
                format: 'currency'
            },
            {
                name: 'chargeback_rate',
                displayName: 'Chargeback Rate',
                description: 'Percentage of transactions resulting in chargebacks',
                type: 'percentage',
                source: '/api/v1/analytics/metrics/transactions/chargeback_rate',
                unit: '%',
                format: 'percentage'
            },
            {
                name: 'active_reps',
                displayName: 'Active Representatives',
                description: 'Number of active sales representatives',
                type: 'count',
                source: '/api/v1/analytics/metrics/reps/active_count',
                unit: 'reps'
            }
        ],
        dashboards: [
            {
                name: 'overview',
                displayName: 'Overview Dashboard',
                description: 'High-level metrics and KPIs',
                defaultTimeRange: 'last_30_days',
                widgets: [
                    {
                        type: 'kpi',
                        title: 'Total Merchants',
                        source: 'total_merchants',
                        size: { width: 3, height: 2 },
                        position: { x: 0, y: 0 }
                    },
                    {
                        type: 'kpi',
                        title: 'Processing Volume',
                        source: 'total_volume',
                        size: { width: 3, height: 2 },
                        position: { x: 3, y: 0 }
                    },
                    {
                        type: 'chart',
                        title: 'Volume Trend',
                        source: '/api/v1/analytics/trends/volume',
                        size: { width: 6, height: 4 },
                        position: { x: 0, y: 2 },
                        config: { chartType: 'line' }
                    }
                ]
            }
        ],
        storage: {
            customerNamespacePattern: 'customer-iso-{company-id}',
            encryptionEnabled: true,
            litProtocolEnabled: true,
            celestiaDAEnabled: true,
            zkProofsEnabled: true
        },
        api: {
            basePath: '/api/v1/iso'
        },
        features: {
            analytics: true,
            forecasting: true,
            webhooks: true,
            notifications: true,
            export: true,
            cache: true,
            monitoring: true
        }
    };
    templateRegistry.register(template);
    return template;
}
/**
 * Load all built-in templates
 */
export function loadAllTemplates() {
    loadISOTemplate();
    // Future: loadHealthcareTemplate(), loadFinanceTemplate(), loadRetailTemplate()
}
// Auto-load templates when module is imported
loadAllTemplates();
//# sourceMappingURL=template-loader.js.map