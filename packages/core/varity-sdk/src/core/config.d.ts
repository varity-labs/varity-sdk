/**
 * Varity SDK v1 - Network Configuration
 *
 * Manages network settings and contract addresses for different networks.
 */
import { NetworkConfig, Network } from './types';
/**
 * Network configurations for Varity SDK
 * Contract addresses will be populated after deployment
 */
export declare const NETWORK_CONFIGS: Record<Network, NetworkConfig>;
/**
 * Default SDK configuration
 */
export declare const DEFAULT_CONFIG: {
    network: Network;
    apiEndpoint: string;
    timeout: number;
};
/**
 * Get network configuration
 */
export declare function getNetworkConfig(network: Network): NetworkConfig;
/**
 * Validate contract addresses are configured
 */
export declare function validateContractAddresses(network: Network): void;
/**
 * Backend API endpoints
 */
export declare const API_ENDPOINTS: {
    storage: {
        pin: string;
        retrieve: string;
        unpin: string;
    };
    celestia: {
        submit: string;
        retrieve: string;
        submitBatch: string;
    };
    llm: {
        query: string;
        queryWithRAG: string;
    };
    config: {
        contracts: string;
        networks: string;
    };
};
/**
 * Storage layer configuration
 */
export declare const STORAGE_CONFIG: {
    defaultBackend: "filecoin-ipfs";
    pinata: {
        gateway: string;
        api: string;
    };
    celestia: {
        namespacePrefix: string;
        testnetRPC: string;
    };
    encryption: {
        algorithm: string;
        keyDerivation: string;
        iterations: number;
    };
    multiTier: {
        hotTier: {
            backend: "filecoin-ipfs";
            replication: number;
            costPerGB: number;
            accessLatency: number;
        };
        coldTier: {
            backend: "filecoin-ipfs";
            replication: number;
            costPerGB: number;
            accessLatency: number;
        };
        autoTiering: {
            enabled: boolean;
            policy: "access-based";
            checkInterval: number;
            rules: ({
                name: string;
                description: string;
                condition: {
                    type: "last_accessed";
                    operator: "gt";
                    value: number;
                    unit: "days";
                };
                action: {
                    moveTo: "cold";
                    notify: boolean;
                };
                priority: number;
                enabled: boolean;
            } | {
                name: string;
                description: string;
                condition: {
                    type: "access_count";
                    operator: "gte";
                    value: number;
                    unit: "accesses";
                };
                action: {
                    moveTo: "hot";
                    notify: boolean;
                };
                priority: number;
                enabled: boolean;
            })[];
        };
    };
};
//# sourceMappingURL=config.d.ts.map