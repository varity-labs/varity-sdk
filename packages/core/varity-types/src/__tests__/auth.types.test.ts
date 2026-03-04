/**
 * Comprehensive tests for authentication and authorization types
 * Target: 25+ tests covering all auth types, enums, and type guards
 */

import {
  AuthProvider,
  AccessKeyStatus,
  PermissionEffect,
  Action,
  ConditionType,
  AccessKey,
  Permission,
  AWSSignatureV4Request,
  AWSSignatureV4Credentials,
  AWSSignatureV4Result,
  S3SignatureV4Components,
  GCSOAuth2Token,
  GCSOAuth2ValidationResult,
  GCSServiceAccount,
  GCSServiceAccountToken,
  VarityAPIKey,
  RateLimit,
  Web3AuthRequest,
  Web3AuthResult,
  PolicyStatement,
  PolicyCondition,
  AuthorizationPolicy,
  AuthorizationContext,
  AuthorizationResult,
  Session,
  PermissionChecker,
  isAWSSignatureV4Credentials,
  isGCSServiceAccount,
  isGCSOAuth2Token
} from '../auth'

describe('Authentication Enums', () => {
  test('AuthProvider enum should have all provider types', () => {
    expect(AuthProvider.AWS_SIGNATURE_V4).toBe('aws-signature-v4')
    expect(AuthProvider.GCS_OAUTH2).toBe('gcs-oauth2')
    expect(AuthProvider.GCS_SERVICE_ACCOUNT).toBe('gcs-service-account')
    expect(AuthProvider.VARITY_API_KEY).toBe('varity-api-key')
    expect(AuthProvider.EMBEDDED_KEY).toBe('embedded-key')
  })

  test('AccessKeyStatus enum should have all status values', () => {
    expect(AccessKeyStatus.ACTIVE).toBe('active')
    expect(AccessKeyStatus.INACTIVE).toBe('inactive')
    expect(AccessKeyStatus.REVOKED).toBe('revoked')
    expect(AccessKeyStatus.EXPIRED).toBe('expired')
  })

  test('PermissionEffect enum should have allow and deny', () => {
    expect(PermissionEffect.ALLOW).toBe('allow')
    expect(PermissionEffect.DENY).toBe('deny')
  })

  test('Action enum should have storage and admin actions', () => {
    expect(Action.GET_OBJECT).toBe('storage:GetObject')
    expect(Action.PUT_OBJECT).toBe('storage:PutObject')
    expect(Action.DELETE_OBJECT).toBe('storage:DeleteObject')
    expect(Action.LIST_OBJECTS).toBe('storage:ListObjects')
    expect(Action.MANAGE_ACCESS_KEYS).toBe('admin:ManageAccessKeys')
    expect(Action.ALL_ACTIONS).toBe('*')
  })

  test('ConditionType enum should have all comparison types', () => {
    expect(ConditionType.STRING_EQUALS).toBe('StringEquals')
    expect(ConditionType.NUMERIC_EQUALS).toBe('NumericEquals')
    expect(ConditionType.DATE_LESS_THAN).toBe('DateLessThan')
    expect(ConditionType.IP_ADDRESS).toBe('IpAddress')
    expect(ConditionType.BOOL).toBe('Bool')
  })
})

describe('AccessKey Interface', () => {
  test('should create valid access key with all fields', () => {
    const accessKey: AccessKey = {
      accessKeyId: 'VARIETYAK123456789',
      secretAccessKey: 'secret123abc',
      customerId: 'customer-001',
      name: 'Production Access Key',
      description: 'Key for production environment',
      permissions: [
        {
          resource: 'bucket:production/*',
          actions: [Action.GET_OBJECT, Action.PUT_OBJECT],
          effect: PermissionEffect.ALLOW
        }
      ],
      status: AccessKeyStatus.ACTIVE,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date('2025-12-31')
    }

    expect(accessKey.accessKeyId).toBe('VARIETYAK123456789')
    expect(accessKey.status).toBe(AccessKeyStatus.ACTIVE)
    expect(accessKey.permissions.length).toBe(1)
  })

  test('should create access key without optional fields', () => {
    const accessKey: AccessKey = {
      accessKeyId: 'VARIETYAK987654321',
      secretAccessKey: 'secret789xyz',
      customerId: 'customer-002',
      name: 'Test Key',
      permissions: [],
      status: AccessKeyStatus.INACTIVE,
      createdAt: new Date()
    }

    expect(accessKey.lastUsedAt).toBeUndefined()
    expect(accessKey.expiresAt).toBeUndefined()
    expect(accessKey.description).toBeUndefined()
  })
})

describe('Permission Interface', () => {
  test('should define allow permission for specific resources', () => {
    const permission: Permission = {
      resource: 'bucket:my-bucket/documents/*',
      actions: [Action.GET_OBJECT, Action.LIST_OBJECTS],
      effect: PermissionEffect.ALLOW
    }

    expect(permission.effect).toBe(PermissionEffect.ALLOW)
    expect(permission.actions).toContain(Action.GET_OBJECT)
  })

  test('should define deny permission with wildcard', () => {
    const permission: Permission = {
      resource: 'bucket:restricted/*',
      actions: [Action.ALL_ACTIONS],
      effect: PermissionEffect.DENY
    }

    expect(permission.effect).toBe(PermissionEffect.DENY)
    expect(permission.actions).toContain(Action.ALL_ACTIONS)
  })
})

describe('AWS Signature V4 Types', () => {
  test('should create AWS Signature V4 request', () => {
    const request: AWSSignatureV4Request = {
      method: 'PUT',
      url: 'https://s3.varity.io/bucket/object.txt',
      headers: {
        'host': 's3.varity.io',
        'x-amz-date': '20240101T120000Z',
        'content-type': 'text/plain'
      },
      body: 'file contents',
      query: { 'versioning': 'enabled' }
    }

    expect(request.method).toBe('PUT')
    expect(request.headers['host']).toBe('s3.varity.io')
  })

  test('should create AWS Signature V4 credentials', () => {
    const credentials: AWSSignatureV4Credentials = {
      accessKeyId: 'VARIETYAK123',
      secretAccessKey: 'secret123',
      sessionToken: 'session-token',
      region: 'us-east-1',
      service: 's3'
    }

    expect(credentials.region).toBe('us-east-1')
    expect(credentials.service).toBe('s3')
  })

  test('should validate AWS Signature V4 result', () => {
    const result: AWSSignatureV4Result = {
      valid: true,
      accessKeyId: 'VARIETYAK123',
      timestamp: new Date()
    }

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  test('should handle invalid signature result', () => {
    const result: AWSSignatureV4Result = {
      valid: false,
      error: 'Signature does not match',
      timestamp: new Date()
    }

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Signature does not match')
  })
})

describe('GCS OAuth2 Types', () => {
  test('should create GCS OAuth2 token', () => {
    const token: GCSOAuth2Token = {
      accessToken: 'ya29.abc123',
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'refresh-token',
      scope: ['https://www.googleapis.com/auth/devstorage.full_control'],
      issuedAt: new Date()
    }

    expect(token.tokenType).toBe('Bearer')
    expect(token.expiresIn).toBe(3600)
    expect(token.scope).toContain('https://www.googleapis.com/auth/devstorage.full_control')
  })

  test('should create GCS OAuth2 validation result', () => {
    const result: GCSOAuth2ValidationResult = {
      valid: true,
      email: 'user@example.com',
      projectId: 'my-project',
      scopes: ['storage.full_control']
    }

    expect(result.valid).toBe(true)
    expect(result.email).toBe('user@example.com')
  })
})

describe('GCS Service Account Types', () => {
  test('should create GCS service account credentials', () => {
    const serviceAccount: GCSServiceAccount = {
      type: 'service_account',
      projectId: 'my-project-123',
      privateKeyId: 'key-123',
      privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
      clientEmail: 'service@my-project.iam.gserviceaccount.com',
      clientId: '123456789',
      authUri: 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: 'https://oauth2.googleapis.com/token',
      authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
      clientX509CertUrl: 'https://www.googleapis.com/robot/v1/metadata/x509/service@my-project.iam.gserviceaccount.com'
    }

    expect(serviceAccount.type).toBe('service_account')
    expect(serviceAccount.projectId).toBe('my-project-123')
    expect(serviceAccount.clientEmail).toContain('iam.gserviceaccount.com')
  })

  test('should create GCS service account token', () => {
    const token: GCSServiceAccountToken = {
      accessToken: 'ya29.xyz789',
      expiresIn: 3600,
      tokenType: 'Bearer'
    }

    expect(token.tokenType).toBe('Bearer')
    expect(token.expiresIn).toBe(3600)
  })
})

describe('Varity API Key Types', () => {
  test('should create Varity API key with rate limits', () => {
    const apiKey: VarityAPIKey = {
      keyId: 'varity-key-123',
      keySecret: 'secret-abc-xyz',
      customerId: 'customer-001',
      permissions: [
        {
          resource: 'bucket:*',
          actions: [Action.GET_OBJECT],
          effect: PermissionEffect.ALLOW
        }
      ],
      rateLimit: {
        requestsPerSecond: 100,
        requestsPerDay: 1000000,
        bandwidthPerDay: 107374182400
      },
      status: AccessKeyStatus.ACTIVE
    }

    expect(apiKey.rateLimit.requestsPerSecond).toBe(100)
    expect(apiKey.status).toBe(AccessKeyStatus.ACTIVE)
  })
})

describe('Web3 Authentication Types', () => {
  test('should create Web3 auth request', () => {
    const request: Web3AuthRequest = {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      signature: '0xabcdef123456...',
      message: 'Sign in to Varity',
      timestamp: Date.now()
    }

    expect(request.walletAddress.startsWith('0x')).toBe(true)
    expect(request.message).toBe('Sign in to Varity')
  })

  test('should create Web3 auth result', () => {
    const result: Web3AuthResult = {
      valid: true,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    }

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })
})

describe('Authorization Policy Types', () => {
  test('should create policy statement with conditions', () => {
    const statement: PolicyStatement = {
      sid: 'AllowReadFromProductionBucket',
      effect: PermissionEffect.ALLOW,
      actions: [Action.GET_OBJECT, Action.LIST_OBJECTS],
      resources: ['bucket:production/*'],
      conditions: [
        {
          type: ConditionType.IP_ADDRESS,
          key: 'aws:SourceIp',
          value: '203.0.113.0/24'
        }
      ]
    }

    expect(statement.effect).toBe(PermissionEffect.ALLOW)
    expect(statement.conditions?.length).toBe(1)
  })

  test('should create complete authorization policy', () => {
    const policy: AuthorizationPolicy = {
      policyId: 'policy-123',
      name: 'Production Access Policy',
      description: 'Allows read access to production bucket',
      statements: [
        {
          effect: PermissionEffect.ALLOW,
          actions: [Action.GET_OBJECT],
          resources: ['bucket:production/*']
        }
      ],
      version: '2024-01-01'
    }

    expect(policy.statements.length).toBe(1)
    expect(policy.version).toBe('2024-01-01')
  })
})

describe('Authorization Context and Result', () => {
  test('should create authorization context', () => {
    const context: AuthorizationContext = {
      customerId: 'customer-001',
      accessKeyId: 'VARIETYAK123',
      action: Action.GET_OBJECT,
      resource: 'bucket:my-bucket/file.txt',
      ipAddress: '203.0.113.42',
      timestamp: new Date()
    }

    expect(context.action).toBe(Action.GET_OBJECT)
    expect(context.resource).toBe('bucket:my-bucket/file.txt')
  })

  test('should create authorization result for allowed action', () => {
    const result: AuthorizationResult = {
      allowed: true,
      reason: 'Allowed by policy',
      matchedPolicy: 'policy-123'
    }

    expect(result.allowed).toBe(true)
    expect(result.matchedPolicy).toBe('policy-123')
  })

  test('should create authorization result for denied action', () => {
    const result: AuthorizationResult = {
      allowed: false,
      reason: 'Explicitly denied by policy',
      deniedBy: 'deny-policy-456'
    }

    expect(result.allowed).toBe(false)
    expect(result.deniedBy).toBe('deny-policy-456')
  })
})

describe('Session Management', () => {
  test('should create user session', () => {
    const session: Session = {
      sessionId: 'session-abc123',
      customerId: 'customer-001',
      authProvider: AuthProvider.EMBEDDED_KEY,
      credentials: { walletAddress: '0x123...' },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      lastActivityAt: new Date()
    }

    expect(session.authProvider).toBe(AuthProvider.EMBEDDED_KEY)
    expect(session.sessionId).toBe('session-abc123')
  })
})

describe('PermissionChecker Utility Class', () => {
  test('should allow action when permission matches', () => {
    const permissions: Permission[] = [
      {
        resource: 'bucket:my-bucket/*',
        actions: [Action.GET_OBJECT],
        effect: PermissionEffect.ALLOW
      }
    ]

    const allowed = PermissionChecker.isAllowed(
      permissions,
      Action.GET_OBJECT,
      'bucket:my-bucket/file.txt'
    )

    expect(allowed).toBe(true)
  })

  test('should deny action when no matching permission', () => {
    const permissions: Permission[] = [
      {
        resource: 'bucket:other-bucket/*',
        actions: [Action.GET_OBJECT],
        effect: PermissionEffect.ALLOW
      }
    ]

    const allowed = PermissionChecker.isAllowed(
      permissions,
      Action.GET_OBJECT,
      'bucket:my-bucket/file.txt'
    )

    expect(allowed).toBe(false)
  })

  test('should deny action when explicit deny exists', () => {
    const permissions: Permission[] = [
      {
        resource: 'bucket:*',
        actions: [Action.ALL_ACTIONS],
        effect: PermissionEffect.ALLOW
      },
      {
        resource: 'bucket:restricted/*',
        actions: [Action.ALL_ACTIONS],
        effect: PermissionEffect.DENY
      }
    ]

    const allowed = PermissionChecker.isAllowed(
      permissions,
      Action.GET_OBJECT,
      'bucket:restricted/secret.txt'
    )

    expect(allowed).toBe(false)
  })

  test('should support wildcard action matching', () => {
    const permissions: Permission[] = [
      {
        resource: 'bucket:my-bucket/*',
        actions: [Action.ALL_ACTIONS],
        effect: PermissionEffect.ALLOW
      }
    ]

    const allowed = PermissionChecker.isAllowed(
      permissions,
      Action.DELETE_OBJECT,
      'bucket:my-bucket/file.txt'
    )

    expect(allowed).toBe(true)
  })

  test('should provide detailed authorization result', () => {
    const permissions: Permission[] = [
      {
        resource: 'bucket:my-bucket/*',
        actions: [Action.GET_OBJECT],
        effect: PermissionEffect.ALLOW
      }
    ]

    const result = PermissionChecker.checkPermission(
      permissions,
      Action.GET_OBJECT,
      'bucket:my-bucket/file.txt'
    )

    expect(result.allowed).toBe(true)
    expect(result.reason).toContain('Allowed by policy')
  })

  test('should provide detailed denial reason', () => {
    const permissions: Permission[] = [
      {
        resource: 'bucket:restricted/*',
        actions: [Action.ALL_ACTIONS],
        effect: PermissionEffect.DENY
      }
    ]

    const result = PermissionChecker.checkPermission(
      permissions,
      Action.GET_OBJECT,
      'bucket:restricted/secret.txt'
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Explicitly denied')
  })
})

describe('Type Guards', () => {
  test('isAWSSignatureV4Credentials should validate AWS credentials', () => {
    const validCredentials = {
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      region: 'us-east-1',
      service: 's3'
    }

    expect(isAWSSignatureV4Credentials(validCredentials)).toBe(true)
  })

  test('isAWSSignatureV4Credentials should reject invalid credentials', () => {
    const invalidCredentials = {
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      // missing region and service
    }

    expect(isAWSSignatureV4Credentials(invalidCredentials)).toBe(false)
  })

  test('isGCSServiceAccount should validate service account', () => {
    const validServiceAccount = {
      type: 'service_account',
      projectId: 'my-project',
      privateKey: '-----BEGIN PRIVATE KEY-----\n...',
      clientEmail: 'service@my-project.iam.gserviceaccount.com'
    }

    expect(isGCSServiceAccount(validServiceAccount)).toBe(true)
  })

  test('isGCSServiceAccount should reject invalid service account', () => {
    const invalidServiceAccount = {
      type: 'user_account',
      projectId: 'my-project'
    }

    expect(isGCSServiceAccount(invalidServiceAccount)).toBe(false)
  })

  test('isGCSOAuth2Token should validate OAuth2 token', () => {
    const validToken = {
      accessToken: 'ya29.abc123',
      tokenType: 'Bearer',
      expiresIn: 3600
    }

    expect(isGCSOAuth2Token(validToken)).toBe(true)
  })

  test('isGCSOAuth2Token should reject invalid token', () => {
    const invalidToken = {
      accessToken: 'ya29.abc123',
      tokenType: 'NotBearer',
      expiresIn: 3600
    }

    expect(isGCSOAuth2Token(invalidToken)).toBe(false)
  })
})
