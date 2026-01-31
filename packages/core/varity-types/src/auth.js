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
export var AuthProvider;
(function (AuthProvider) {
    AuthProvider["AWS_SIGNATURE_V4"] = "aws-signature-v4";
    AuthProvider["GCS_OAUTH2"] = "gcs-oauth2";
    AuthProvider["GCS_SERVICE_ACCOUNT"] = "gcs-service-account";
    AuthProvider["VARITY_API_KEY"] = "varity-api-key";
    AuthProvider["WEB3_WALLET"] = "web3-wallet";
})(AuthProvider || (AuthProvider = {}));
// ============================================================================
// Access Key Management
// ============================================================================
/**
 * Access key status
 */
export var AccessKeyStatus;
(function (AccessKeyStatus) {
    AccessKeyStatus["ACTIVE"] = "active";
    AccessKeyStatus["INACTIVE"] = "inactive";
    AccessKeyStatus["REVOKED"] = "revoked";
    AccessKeyStatus["EXPIRED"] = "expired";
})(AccessKeyStatus || (AccessKeyStatus = {}));
// ============================================================================
// Permission System
// ============================================================================
/**
 * Permission effect (allow or deny)
 */
export var PermissionEffect;
(function (PermissionEffect) {
    PermissionEffect["ALLOW"] = "allow";
    PermissionEffect["DENY"] = "deny";
})(PermissionEffect || (PermissionEffect = {}));
/**
 * Storage and administrative actions
 */
export var Action;
(function (Action) {
    // Storage object actions
    Action["GET_OBJECT"] = "storage:GetObject";
    Action["PUT_OBJECT"] = "storage:PutObject";
    Action["DELETE_OBJECT"] = "storage:DeleteObject";
    Action["LIST_OBJECTS"] = "storage:ListObjects";
    // Bucket actions
    Action["CREATE_BUCKET"] = "storage:CreateBucket";
    Action["DELETE_BUCKET"] = "storage:DeleteBucket";
    Action["LIST_BUCKETS"] = "storage:ListBuckets";
    Action["GET_BUCKET_METADATA"] = "storage:GetBucketMetadata";
    Action["PUT_BUCKET_POLICY"] = "storage:PutBucketPolicy";
    Action["GET_BUCKET_POLICY"] = "storage:GetBucketPolicy";
    // Multipart upload actions
    Action["INITIATE_MULTIPART_UPLOAD"] = "storage:InitiateMultipartUpload";
    Action["UPLOAD_PART"] = "storage:UploadPart";
    Action["COMPLETE_MULTIPART_UPLOAD"] = "storage:CompleteMultipartUpload";
    Action["ABORT_MULTIPART_UPLOAD"] = "storage:AbortMultipartUpload";
    // Administrative actions
    Action["MANAGE_ACCESS_KEYS"] = "admin:ManageAccessKeys";
    Action["VIEW_METRICS"] = "admin:ViewMetrics";
    Action["MANAGE_BILLING"] = "admin:ManageBilling";
    Action["MANAGE_ENCRYPTION"] = "admin:ManageEncryption";
    // Wildcard
    Action["ALL_ACTIONS"] = "*";
})(Action || (Action = {}));
// ============================================================================
// Authorization Policies
// ============================================================================
/**
 * Policy condition types
 */
export var ConditionType;
(function (ConditionType) {
    ConditionType["STRING_EQUALS"] = "StringEquals";
    ConditionType["STRING_NOT_EQUALS"] = "StringNotEquals";
    ConditionType["STRING_LIKE"] = "StringLike";
    ConditionType["NUMERIC_EQUALS"] = "NumericEquals";
    ConditionType["NUMERIC_LESS_THAN"] = "NumericLessThan";
    ConditionType["NUMERIC_GREATER_THAN"] = "NumericGreaterThan";
    ConditionType["DATE_EQUALS"] = "DateEquals";
    ConditionType["DATE_LESS_THAN"] = "DateLessThan";
    ConditionType["DATE_GREATER_THAN"] = "DateGreaterThan";
    ConditionType["BOOL"] = "Bool";
    ConditionType["IP_ADDRESS"] = "IpAddress";
    ConditionType["NOT_IP_ADDRESS"] = "NotIpAddress";
})(ConditionType || (ConditionType = {}));
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
    static isAllowed(permissions, action, resource) {
        // Check for explicit deny first (deny always wins)
        for (const permission of permissions) {
            if (permission.effect === PermissionEffect.DENY &&
                this.matchesAction(permission.actions, action) &&
                this.matchesResource(permission.resource, resource)) {
                return false;
            }
        }
        // Check for explicit allow
        for (const permission of permissions) {
            if (permission.effect === PermissionEffect.ALLOW &&
                this.matchesAction(permission.actions, action) &&
                this.matchesResource(permission.resource, resource)) {
                return true;
            }
        }
        // Default deny (principle of least privilege)
        return false;
    }
    /**
     * Check if an action matches the allowed actions
     */
    static matchesAction(allowedActions, action) {
        return (allowedActions.indexOf(action) !== -1 ||
            allowedActions.indexOf(Action.ALL_ACTIONS) !== -1);
    }
    /**
     * Check if a resource matches a resource pattern
     * Supports wildcards: * (match any) and ? (match single character)
     */
    static matchesResource(pattern, resource) {
        // Convert wildcard pattern to regex
        // bucket:* matches bucket:my-bucket
        // bucket:my-bucket/* matches bucket:my-bucket/file.txt
        // bucket:my-bucket/prefix-* matches bucket:my-bucket/prefix-123
        const regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
            .replace(/\*/g, '.*') // * matches any characters
            .replace(/\?/g, '.'); // ? matches single character
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(resource);
    }
    /**
     * Check if an action is allowed with detailed reason
     */
    static checkPermission(permissions, action, resource) {
        // Check for explicit deny first
        for (const permission of permissions) {
            if (permission.effect === PermissionEffect.DENY &&
                this.matchesAction(permission.actions, action) &&
                this.matchesResource(permission.resource, resource)) {
                return {
                    allowed: false,
                    reason: `Explicitly denied by policy`,
                    deniedBy: `resource:${permission.resource} action:${action}`
                };
            }
        }
        // Check for explicit allow
        for (const permission of permissions) {
            if (permission.effect === PermissionEffect.ALLOW &&
                this.matchesAction(permission.actions, action) &&
                this.matchesResource(permission.resource, resource)) {
                return {
                    allowed: true,
                    reason: `Allowed by policy`,
                    matchedPolicy: `resource:${permission.resource} action:${action}`
                };
            }
        }
        // Default deny
        return {
            allowed: false,
            reason: `No matching allow policy found (default deny)`
        };
    }
}
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if credentials are AWS Signature V4 credentials
 */
export function isAWSSignatureV4Credentials(credentials) {
    return (typeof credentials === 'object' &&
        typeof credentials.accessKeyId === 'string' &&
        typeof credentials.secretAccessKey === 'string' &&
        typeof credentials.region === 'string' &&
        typeof credentials.service === 'string');
}
/**
 * Check if credentials are GCS Service Account credentials
 */
export function isGCSServiceAccount(credentials) {
    return (typeof credentials === 'object' &&
        credentials.type === 'service_account' &&
        typeof credentials.projectId === 'string' &&
        typeof credentials.privateKey === 'string' &&
        typeof credentials.clientEmail === 'string');
}
/**
 * Check if token is a GCS OAuth2 token
 */
export function isGCSOAuth2Token(token) {
    return (typeof token === 'object' &&
        typeof token.accessToken === 'string' &&
        token.tokenType === 'Bearer' &&
        typeof token.expiresIn === 'number');
}
//# sourceMappingURL=auth.js.map