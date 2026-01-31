/**
 * Google Cloud Storage JSON API Type Definitions
 * Compatible with GCS v1 API
 */

export interface GCSObject {
  kind: 'storage#object';
  id: string;
  selfLink?: string;
  mediaLink?: string;
  name: string;
  bucket: string;
  generation: string;
  metageneration?: string;
  contentType?: string;
  storageClass?: string;
  size: string;
  md5Hash: string;
  crc32c?: string;
  etag: string;
  timeCreated: string;
  updated: string;
  timeDeleted?: string;
  timeStorageClassUpdated?: string;
  metadata?: Record<string, string>;
  owner?: {
    entity: string;
    entityId: string;
  };
}

export interface GCSBucket {
  kind: 'storage#bucket';
  id: string;
  selfLink?: string;
  name: string;
  timeCreated: string;
  updated: string;
  location: string;
  locationType?: string;
  storageClass: string;
  etag: string;
  metageneration?: string;
  labels?: Record<string, string>;
  owner?: {
    entity: string;
    entityId: string;
  };
  versioning?: {
    enabled: boolean;
  };
}

export interface GCSObjectList {
  kind: 'storage#objects';
  nextPageToken?: string;
  prefixes?: string[];
  items: GCSObject[];
}

export interface GCSBucketList {
  kind: 'storage#buckets';
  nextPageToken?: string;
  items: GCSBucket[];
}

export interface GCSError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
      locationType?: string;
      location?: string;
    }>;
  };
}

export interface ResumableUploadSession {
  uploadId: string;
  bucket: string;
  objectName: string;
  uploadUrl: string;
  bytesReceived: number;
  totalSize?: number;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, string>;
  contentType?: string;
  chunks: Buffer[];
}

export interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

export interface OAuth2ValidationResult {
  valid: boolean;
  email?: string;
  userId?: string;
  scopes?: string[];
  expiresAt?: Date;
  error?: string;
}

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface GCSUploadOptions {
  bucket: string;
  name: string;
  contentType?: string;
  metadata?: Record<string, string>;
  predefinedAcl?: string;
  uploadType?: 'media' | 'multipart' | 'resumable';
}

export type StorageLayer = 'varity-internal' | 'industry-rag' | 'customer-data';

export interface FilecoinMetadata {
  cid: string;
  size: number;
  pinataUrl?: string;
  ipfsGatewayUrl?: string;
  uploadedAt: string;
  litProtocolEncrypted: boolean;
  celestiaDAEnabled: boolean;
  storageLayer: StorageLayer;
  namespace: string;
}

export interface StorageBackendConfig {
  pinataApiKey: string;
  pinataSecretKey: string;
  ipfsGateway: string;
  litProtocolEnabled: boolean;
  celestiaDAEnabled: boolean;
}

export interface WalletAuthSession {
  address: string;
  chainId: number;
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SIWEAuthRequest {
  message: {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime?: string;
    resources?: string[];
  };
  signature: string;
}

export interface SIWEAuthResponse {
  token: string;
  address: string;
  chainId: number;
  expiresIn: number;
}
