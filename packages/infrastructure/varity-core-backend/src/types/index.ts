/**
 * Varity Core Backend Types
 * PROPRIETARY - DO NOT DISTRIBUTE
 */

// Industry types for template system
export type Industry = 'finance' | 'healthcare' | 'retail' | 'iso';

// Storage layer types (3-layer architecture)
export type StorageLayer = 'varity-internal' | 'industry-rag' | 'customer-data';

// Network configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  isTestnet: boolean;
}

// Template customization options
export interface TemplateCustomization {
  branding: {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  modules: string[]; // Enabled feature modules
  integrations: {
    [key: string]: boolean;
  };
  compliance: {
    required: string[]; // e.g., ['HIPAA', 'PCI-DSS']
    enabled: boolean;
  };
}

// Deployment result
export interface DeploymentResult {
  success: boolean;
  dashboardUrl: string;
  contractAddresses: {
    registry: string;
    template: string;
    accessControl: string;
    billing: string;
  };
  storageReferences: {
    templateCID: string; // Filecoin CID for template
    configCID: string; // Filecoin CID for customer config
    celestiaBlobId?: string; // Celestia blob ID if used
  };
  deploymentTimestamp: number;
  estimatedMonthlyCost: number;
  error?: string;
}

// Template storage metadata
export interface TemplateMetadata {
  industry: Industry;
  version: string;
  createdAt: number;
  updatedAt: number;
  totalDocuments: number;
  storageCID: string;
  encrypted: boolean;
  layer: StorageLayer;
}

// DePIN client configurations
export interface FilecoinConfig {
  pinataApiKey: string;
  pinataSecretKey: string;
  gatewayUrl: string;
}

export interface AkashConfig {
  rpcEndpoint: string;
  walletMnemonic?: string;
  defaultResourceConfig: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface CelestiaConfig {
  rpcEndpoint: string;
  authToken?: string;
  namespace: string;
  enableZKProofs: boolean;
}

// ZKML types
export interface ZKMLProof {
  proof: string;
  publicInputs: string[];
  verificationKey: string;
  timestamp: number;
}

// Lit Protocol types
export interface LitEncryptionConfig {
  chain: string;
  accessControlConditions: AccessControlCondition[];
}

export interface AccessControlCondition {
  contractAddress: string;
  standardContractType: string;
  chain: string;
  method: string;
  parameters: string[];
  returnValueTest: {
    comparator: string;
    value: string;
  };
}

// Oracle feed types
export interface OracleFeed {
  feedId: string;
  provider: 'chainlink' | 'pyth' | 'custom';
  decimals: number;
  description: string;
}

// Contract events
export interface DashboardRegisteredEvent {
  customerId: string;
  dashboardAddress: string;
  industry: Industry;
  templateVersion: string;
  timestamp: number;
}

// Error types
export class VarityError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VarityError';
  }
}

export class ContractError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'CONTRACT_ERROR', details);
    this.name = 'ContractError';
  }
}

export class StorageError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export class DeploymentError extends VarityError {
  constructor(message: string, details?: any) {
    super(message, 'DEPLOYMENT_ERROR', details);
    this.name = 'DeploymentError';
  }
}
