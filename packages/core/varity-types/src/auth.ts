/**
 * Authentication & Authorization Types
 *
 * Comprehensive type definitions for authentication, authorization, and access control
 * across Varity's S3-compatible and GCS-compatible storage gateways.
 *
 * @packageDocumentation
 */

// ============================================================================
// Authentication Provider Types
// ============================================================================

/**
 * Supported authentication providers
 */
export enum AuthProvider {
  AWS_SIGNATURE_V4 = 'aws-signature-v4',
  GCS_OAUTH2 = 'gcs-oauth2',
  GCS_SERVICE_ACCOUNT = 'gcs-service-account',
  VARITY_API_KEY = 'varity-api-key',
  WEB3_WALLET = 'web3-wallet'
}

// ============================================================================
// Access Key Management
// ============================================================================

/**
 * Access key status
 */
export enum AccessKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

/**
 * Access key for S3/GCS API authentication
 */
export interface AccessKey {
  /** Unique access key identifier (e.g., VARIETYXXXXXXXXXXXXXXXX) */
  accessKeyId: string

  /** Secret access key (only returned on creation) */
  secretAccessKey: string

  /** Customer ID that owns this key */
  customerId: string

  /** Human-readable name for the key */
  name: string

  /** Optional description */
  description?: string

  /** Permissions granted to this key */
  permissions: Permission[]

  /** Current status of the key */
  status: AccessKeyStatus

  /** When the key was created */
  createdAt: Date

  /** Last time the key was used */
  lastUsedAt?: Date

  /** Optional expiration date */
  expiresAt?: Date
}

// ============================================================================
// Permission System
// ============================================================================

/**
 * Permission effect (allow or deny)
 */
export enum PermissionEffect {
  ALLOW = 'allow',
  DENY = 'deny'
}

/**
 * Storage and administrative actions
 */
export enum Action {
  // Storage object actions
  GET_OBJECT = 'storage:GetObject',
  PUT_OBJECT = 'storage:PutObject',
  DELETE_OBJECT = 'storage:DeleteObject',
  LIST_OBJECTS = 'storage:ListObjects',

  // Bucket actions
  CREATE_BUCKET = 'storage:CreateBucket',
  DELETE_BUCKET = 'storage:DeleteBucket',
  LIST_BUCKETS = 'storage:ListBuckets',
  GET_BUCKET_METADATA = 'storage:GetBucketMetadata',
  PUT_BUCKET_POLICY = 'storage:PutBucketPolicy',
  GET_BUCKET_POLICY = 'storage:GetBucketPolicy',

  // Multipart upload actions
  INITIATE_MULTIPART_UPLOAD = 'storage:InitiateMultipartUpload',
  UPLOAD_PART = 'storage:UploadPart',
  COMPLETE_MULTIPART_UPLOAD = 'storage:CompleteMultipartUpload',
  ABORT_MULTIPART_UPLOAD = 'storage:AbortMultipartUpload',

  // Administrative actions
  MANAGE_ACCESS_KEYS = 'admin:ManageAccessKeys',
  VIEW_METRICS = 'admin:ViewMetrics',
  MANAGE_BILLING = 'admin:ManageBilling',
  MANAGE_ENCRYPTION = 'admin:ManageEncryption',

  // Wildcard
  ALL_ACTIONS = '*'
}

/**
 * Permission definition for a resource
 */
export interface Permission {
  /** Resource pattern (e.g., "bucket:my-bucket" or "bucket:my-bucket/prefix/*") */
  resource: string

  /** Actions allowed or denied on this resource */
  actions: Action[]

  /** Whether to allow or deny these actions */
  effect: PermissionEffect
}

// ============================================================================
// AWS Signature V4 Authentication
// ============================================================================

/**
 * AWS Signature V4 request data
 */
export interface AWSSignatureV4Request {
  /** HTTP method (GET, PUT, POST, DELETE, etc.) */
  method: string

  /** Full URL including query string */
  url: string

  /** HTTP headers */
  headers: Record<string, string>

  /** Request body (if any) */
  body?: string

  /** Query parameters */
  query?: Record<string, string>
}

/**
 * AWS Signature V4 credentials
 */
export interface AWSSignatureV4Credentials {
  /** Access key ID */
  accessKeyId: string

  /** Secret access key */
  secretAccessKey: string

  /** Optional session token (for temporary credentials) */
  sessionToken?: string

  /** AWS region (e.g., 'us-east-1') */
  region: string

  /** AWS service name (e.g., 's3') */
  service: string
}

/**
 * AWS Signature V4 validation result
 */
export interface AWSSignatureV4Result {
  /** Whether the signature is valid */
  valid: boolean

  /** Access key ID extracted from signature */
  accessKeyId?: string

  /** Error message if validation failed */
  error?: string

  /** Timestamp of validation */
  timestamp: Date
}

/**
 * Parsed AWS Signature V4 components
 */
export interface S3SignatureV4Components {
  /** Algorithm (e.g., 'AWS4-HMAC-SHA256') */
  algorithm: string

  /** Credential scope string */
  credential: string

  /** List of signed headers */
  signedHeaders: string[]

  /** Hex-encoded signature */
  signature: string

  /** Date in YYYYMMDD format */
  date: string

  /** AWS region */
  region: string

  /** AWS service name */
  service: string
}

/**
 * AWS Signature V4 canonical request
 */
export interface S3CanonicalRequest {
  /** HTTP method */
  method: string

  /** Canonical URI */
  uri: string

  /** Canonical query string */
  queryString: string

  /** Canonical headers */
  canonicalHeaders: string

  /** Signed headers */
  signedHeaders: string

  /** SHA256 hash of payload */
  payloadHash: string
}

/**
 * AWS Signature V4 string to sign
 */
export interface S3StringToSign {
  /** Algorithm identifier */
  algorithm: string

  /** Request date-time in ISO format */
  requestDateTime: string

  /** Credential scope */
  credentialScope: string

  /** SHA256 hash of canonical request */
  hashedCanonicalRequest: string
}

// ============================================================================
// GCS OAuth 2.0 Authentication
// ============================================================================

/**
 * GCS OAuth 2.0 token
 */
export interface GCSOAuth2Token {
  /** Bearer token */
  accessToken: string

  /** Token type (always 'Bearer') */
  tokenType: 'Bearer'

  /** Seconds until token expires */
  expiresIn: number

  /** Optional refresh token */
  refreshToken?: string

  /** Granted scopes */
  scope: string[]

  /** When token was issued */
  issuedAt: Date
}

/**
 * GCS OAuth 2.0 validation result
 */
export interface GCSOAuth2ValidationResult {
  /** Whether the token is valid */
  valid: boolean

  /** User email associated with token */
  email?: string

  /** GCP project ID */
  projectId?: string

  /** Authorized scopes */
  scopes?: string[]

  /** Error message if validation failed */
  error?: string
}

// ============================================================================
// GCS Service Account Authentication
// ============================================================================

/**
 * GCS Service Account credentials
 */
export interface GCSServiceAccount {
  /** Account type (always 'service_account') */
  type: 'service_account'

  /** GCP project ID */
  projectId: string

  /** Private key ID */
  privateKeyId: string

  /** Private key in PEM format */
  privateKey: string

  /** Service account email */
  clientEmail: string

  /** Client ID */
  clientId: string

  /** OAuth 2.0 authorization URI */
  authUri: string

  /** OAuth 2.0 token URI */
  tokenUri: string

  /** Auth provider x509 cert URL */
  authProviderX509CertUrl: string

  /** Client x509 cert URL */
  clientX509CertUrl: string
}

/**
 * GCS Service Account token
 */
export interface GCSServiceAccountToken {
  /** Bearer token */
  accessToken: string

  /** Seconds until token expires */
  expiresIn: number

  /** Token type (always 'Bearer') */
  tokenType: 'Bearer'
}

// ============================================================================
// Varity API Key Authentication
// ============================================================================

/**
 * Rate limiting configuration
 */
export interface RateLimit {
  /** Maximum requests per second */
  requestsPerSecond: number

  /** Maximum requests per day */
  requestsPerDay: number

  /** Maximum bandwidth per day (bytes) */
  bandwidthPerDay: number
}

/**
 * Varity API Key
 */
export interface VarityAPIKey {
  /** Key identifier */
  keyId: string

  /** Secret key */
  keySecret: string

  /** Customer ID that owns this key */
  customerId: string

  /** Permissions granted to this key */
  permissions: Permission[]

  /** Rate limiting configuration */
  rateLimit: RateLimit

  /** Key status */
  status: AccessKeyStatus
}

// ============================================================================
// Web3 Wallet Authentication
// ============================================================================

/**
 * Web3 wallet authentication request
 */
export interface Web3AuthRequest {
  /** Wallet address */
  walletAddress: string

  /** Cryptographic signature */
  signature: string

  /** Original message that was signed */
  message: string

  /** Timestamp of signature request */
  timestamp: number
}

/**
 * Web3 authentication result
 */
export interface Web3AuthResult {
  /** Whether the signature is valid */
  valid: boolean

  /** Verified wallet address */
  walletAddress?: string

  /** Error message if validation failed */
  error?: string
}

// ============================================================================
// Authorization Policies
// ============================================================================

/**
 * Policy condition types
 */
export enum ConditionType {
  STRING_EQUALS = 'StringEquals',
  STRING_NOT_EQUALS = 'StringNotEquals',
  STRING_LIKE = 'StringLike',
  NUMERIC_EQUALS = 'NumericEquals',
  NUMERIC_LESS_THAN = 'NumericLessThan',
  NUMERIC_GREATER_THAN = 'NumericGreaterThan',
  DATE_EQUALS = 'DateEquals',
  DATE_LESS_THAN = 'DateLessThan',
  DATE_GREATER_THAN = 'DateGreaterThan',
  BOOL = 'Bool',
  IP_ADDRESS = 'IpAddress',
  NOT_IP_ADDRESS = 'NotIpAddress'
}

/**
 * Policy condition
 */
export interface PolicyCondition {
  /** Condition type */
  type: ConditionType

  /** Condition key */
  key: string

  /** Condition value */
  value: string | number | boolean
}

/**
 * Policy statement
 */
export interface PolicyStatement {
  /** Statement ID (optional) */
  sid?: string

  /** Effect (allow or deny) */
  effect: PermissionEffect

  /** Actions covered by this statement */
  actions: Action[]

  /** Resources covered by this statement */
  resources: string[]

  /** Optional conditions */
  conditions?: PolicyCondition[]
}

/**
 * Authorization policy
 */
export interface AuthorizationPolicy {
  /** Unique policy ID */
  policyId: string

  /** Policy name */
  name: string

  /** Optional description */
  description?: string

  /** Policy statements */
  statements: PolicyStatement[]

  /** Policy version (e.g., '2024-01-01') */
  version: string
}

// ============================================================================
// Authorization Context & Results
// ============================================================================

/**
 * Authorization request context
 */
export interface AuthorizationContext {
  /** Customer ID making the request */
  customerId: string

  /** Access key ID (if using key auth) */
  accessKeyId?: string

  /** Wallet address (if using Web3 auth) */
  walletAddress?: string

  /** Action being requested */
  action: Action

  /** Resource being accessed */
  resource: string

  /** Request IP address */
  ipAddress?: string

  /** Request timestamp */
  timestamp: Date

  /** Request headers */
  requestHeaders?: Record<string, string>
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  /** Whether the action is allowed */
  allowed: boolean

  /** Reason for the decision */
  reason?: string

  /** Policy that allowed the action */
  matchedPolicy?: string

  /** Policy that denied the action */
  deniedBy?: string
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * User session
 */
export interface Session {
  /** Unique session ID */
  sessionId: string

  /** Customer ID */
  customerId: string

  /** Authentication provider used */
  authProvider: AuthProvider

  /** Stored credentials (type depends on provider) */
  credentials: any

  /** When session was created */
  createdAt: Date

  /** When session expires */
  expiresAt: Date

  /** Last activity timestamp */
  lastActivityAt: Date
}

// ============================================================================
// Permission Checker Utility
// ============================================================================

/**
 * Utility class for checking permissions
 */
export class PermissionChecker {
  /**
   * Check if a set of permissions allows a specific action on a resource
   *
   * @param permissions - List of permissions to check
   * @param action - Action being requested
   * @param resource - Resource being accessed
   * @returns true if allowed, false otherwise
   */
  static isAllowed(
    permissions: Permission[],
    action: Action,
    resource: string
  ): boolean {
    // Check for explicit deny first (deny always wins)
    for (const permission of permissions) {
      if (
        permission.effect === PermissionEffect.DENY &&
        this.matchesAction(permission.actions, action) &&
        this.matchesResource(permission.resource, resource)
      ) {
        return false
      }
    }

    // Check for explicit allow
    for (const permission of permissions) {
      if (
        permission.effect === PermissionEffect.ALLOW &&
        this.matchesAction(permission.actions, action) &&
        this.matchesResource(permission.resource, resource)
      ) {
        return true
      }
    }

    // Default deny (principle of least privilege)
    return false
  }

  /**
   * Check if an action matches the allowed actions
   */
  private static matchesAction(allowedActions: Action[], action: Action): boolean {
    return (
      allowedActions.indexOf(action) !== -1 ||
      allowedActions.indexOf(Action.ALL_ACTIONS) !== -1
    )
  }

  /**
   * Check if a resource matches a resource pattern
   * Supports wildcards: * (match any) and ? (match single character)
   */
  private static matchesResource(pattern: string, resource: string): boolean {
    // Convert wildcard pattern to regex
    // bucket:* matches bucket:my-bucket
    // bucket:my-bucket/* matches bucket:my-bucket/file.txt
    // bucket:my-bucket/prefix-* matches bucket:my-bucket/prefix-123
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*')                  // * matches any characters
      .replace(/\?/g, '.')                   // ? matches single character

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(resource)
  }

  /**
   * Check if an action is allowed with detailed reason
   */
  static checkPermission(
    permissions: Permission[],
    action: Action,
    resource: string
  ): AuthorizationResult {
    // Check for explicit deny first
    for (const permission of permissions) {
      if (
        permission.effect === PermissionEffect.DENY &&
        this.matchesAction(permission.actions, action) &&
        this.matchesResource(permission.resource, resource)
      ) {
        return {
          allowed: false,
          reason: `Explicitly denied by policy`,
          deniedBy: `resource:${permission.resource} action:${action}`
        }
      }
    }

    // Check for explicit allow
    for (const permission of permissions) {
      if (
        permission.effect === PermissionEffect.ALLOW &&
        this.matchesAction(permission.actions, action) &&
        this.matchesResource(permission.resource, resource)
      ) {
        return {
          allowed: true,
          reason: `Allowed by policy`,
          matchedPolicy: `resource:${permission.resource} action:${action}`
        }
      }
    }

    // Default deny
    return {
      allowed: false,
      reason: `No matching allow policy found (default deny)`
    }
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if credentials are AWS Signature V4 credentials
 */
export function isAWSSignatureV4Credentials(
  credentials: any
): credentials is AWSSignatureV4Credentials {
  return (
    typeof credentials === 'object' &&
    typeof credentials.accessKeyId === 'string' &&
    typeof credentials.secretAccessKey === 'string' &&
    typeof credentials.region === 'string' &&
    typeof credentials.service === 'string'
  )
}

/**
 * Check if credentials are GCS Service Account credentials
 */
export function isGCSServiceAccount(
  credentials: any
): credentials is GCSServiceAccount {
  return (
    typeof credentials === 'object' &&
    credentials.type === 'service_account' &&
    typeof credentials.projectId === 'string' &&
    typeof credentials.privateKey === 'string' &&
    typeof credentials.clientEmail === 'string'
  )
}

/**
 * Check if token is a GCS OAuth2 token
 */
export function isGCSOAuth2Token(
  token: any
): token is GCSOAuth2Token {
  return (
    typeof token === 'object' &&
    typeof token.accessToken === 'string' &&
    token.tokenType === 'Bearer' &&
    typeof token.expiresIn === 'number'
  )
}
