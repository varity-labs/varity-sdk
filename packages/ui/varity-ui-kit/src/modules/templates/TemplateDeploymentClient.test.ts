/**
 * Unit tests for TemplateDeploymentClient
 */

import {
  TemplateDeploymentClient,
  TemplateMetadata,
  DeploymentRequest,
  DeploymentResponse,
  DeploymentStatus,
  DeployedDashboard,
  TemplateCustomization
} from './TemplateDeploymentClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('TemplateDeploymentClient', () => {
  let mockHttp: MockHTTPClient
  let templateClient: TemplateDeploymentClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    templateClient = new TemplateDeploymentClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('listTemplates', () => {
    it('should list all templates', async () => {
      const mockTemplates: TemplateMetadata[] = [
        {
          id: 'finance-basic',
          industry: 'finance',
          name: 'Finance Dashboard Basic',
          description: 'Basic financial dashboard',
          version: '1.0.0',
          features: ['transactions', 'compliance', 'reporting'],
          pricing: { tier: 'basic', monthlyPrice: 99 },
          modules: ['analytics', 'reporting'],
          complianceStandards: ['PCI-DSS', 'SOC2']
        }
      ]

      mockHttp.mockGet('/templates/list', mockTemplates)

      const result = await templateClient.listTemplates()

      expect(result).toEqual(mockTemplates)
      expect(result).toHaveLength(1)
    })

    it('should list templates by industry', async () => {
      const mockTemplates: TemplateMetadata[] = [
        {
          id: 'healthcare-pro',
          industry: 'healthcare',
          name: 'Healthcare Dashboard Professional',
          description: 'Professional healthcare dashboard',
          version: '1.0.0',
          features: ['patient-data', 'hipaa-compliance'],
          pricing: { tier: 'professional', monthlyPrice: 299 },
          modules: ['analytics', 'compliance'],
          complianceStandards: ['HIPAA', 'HITECH']
        }
      ]

      mockHttp.mockGet('/templates/list', mockTemplates)

      const result = await templateClient.listTemplates('healthcare')

      expect(result).toEqual(mockTemplates)
      expect(result[0].industry).toBe('healthcare')
    })
  })

  describe('getTemplate', () => {
    it('should get template details', async () => {
      const mockTemplate: TemplateMetadata = {
        id: 'retail-enterprise',
        industry: 'retail',
        name: 'Retail Dashboard Enterprise',
        description: 'Enterprise retail dashboard',
        version: '2.0.0',
        features: ['inventory', 'supply-chain', 'ecommerce'],
        pricing: { tier: 'enterprise', monthlyPrice: 999 },
        modules: ['analytics', 'inventory', 'forecasting'],
        complianceStandards: ['PCI-DSS']
      }

      mockHttp.mockGet('/templates/retail-enterprise', mockTemplate)

      const result = await templateClient.getTemplate('retail-enterprise')

      expect(result).toEqual(mockTemplate)
      expect(result.id).toBe('retail-enterprise')
    })
  })

  describe('deployTemplate', () => {
    it('should deploy template to Varity L3', async () => {
      const mockResponse: DeploymentResponse = {
        deploymentId: 'deploy-123',
        customerId: 'customer-abc',
        dashboardUrl: 'https://customer-abc.varity.io',
        contractAddress: '0x1234567890abcdef',
        l3ChainId: 421614,
        storageConfig: {
          layer2Namespace: 'industry-finance-rag',
          layer3Namespace: 'customer-abc-private',
          litProtocolEncrypted: true
        },
        status: 'deploying',
        timestamp: '2025-01-01T00:00:00Z',
        estimatedCompletionTime: '2025-01-01T00:05:00Z'
      }

      mockHttp.mockPost('/templates/deploy', mockResponse)

      const customization: TemplateCustomization = {
        branding: {
          companyName: 'Acme Finance',
          primaryColor: '#1E40AF',
          darkMode: true
        },
        modules: {
          enabled: ['analytics', 'reporting', 'compliance'],
          disabled: []
        }
      }

      const request: DeploymentRequest = {
        industry: 'finance',
        templateId: 'finance-basic',
        customization,
        storageLayer: 'layer3',
        deploymentType: 'production'
      }

      const result = await templateClient.deployTemplate(request)

      expect(result).toEqual(mockResponse)
      expect(result.status).toBe('deploying')
      expect(result.storageConfig.litProtocolEncrypted).toBe(true)
    })
  })

  describe('getDeploymentStatus', () => {
    it('should get deployment status', async () => {
      const mockStatus: DeploymentStatus = {
        deploymentId: 'deploy-123',
        status: 'deploying',
        progress: 60,
        currentStep: 'Deploying smart contracts',
        steps: [
          { name: 'Validate configuration', status: 'completed', timestamp: '2025-01-01T00:00:00Z' },
          { name: 'Create L3 namespace', status: 'completed', timestamp: '2025-01-01T00:01:00Z' },
          { name: 'Deploy smart contracts', status: 'in_progress' },
          { name: 'Configure storage layers', status: 'pending' },
          { name: 'Finalize deployment', status: 'pending' }
        ],
        logs: [
          'Starting deployment...',
          'Configuration validated',
          'L3 namespace created: customer-abc-private'
        ]
      }

      mockHttp.mockGet('/templates/deployments/deploy-123/status', mockStatus)

      const result = await templateClient.getDeploymentStatus('deploy-123')

      expect(result).toEqual(mockStatus)
      expect(result.progress).toBe(60)
      expect(result.steps).toHaveLength(5)
    })
  })

  describe('getDeployedDashboard', () => {
    it('should get deployed dashboard', async () => {
      const mockDashboard: DeployedDashboard = {
        customerId: 'customer-abc',
        industry: 'finance',
        template: {
          id: 'finance-basic',
          industry: 'finance',
          name: 'Finance Dashboard Basic',
          description: 'Basic financial dashboard',
          version: '1.0.0',
          features: ['transactions', 'compliance'],
          pricing: { tier: 'basic', monthlyPrice: 99 },
          modules: ['analytics'],
          complianceStandards: ['PCI-DSS']
        },
        customization: {
          branding: {
            companyName: 'Acme Finance',
            primaryColor: '#1E40AF'
          }
        },
        dashboardUrl: 'https://customer-abc.varity.io',
        apiEndpoint: 'https://api.varity.io/customer-abc',
        contractAddress: '0x1234567890abcdef',
        storage: {
          layer2Namespace: 'industry-finance-rag',
          layer3Namespace: 'customer-abc-private',
          totalDocuments: 1000,
          storageUsedGB: 2.5
        },
        metrics: {
          uptime: 99.99,
          requestsPerDay: 10000,
          activeUsers: 50
        },
        deployedAt: '2025-01-01T00:00:00Z',
        lastUpdated: '2025-01-01T00:00:00Z'
      }

      mockHttp.mockGet('/templates/dashboards/customer-abc', mockDashboard)

      const result = await templateClient.getDeployedDashboard('customer-abc')

      expect(result).toEqual(mockDashboard)
      expect(result.metrics.uptime).toBe(99.99)
      expect(result.storage.litProtocolEncrypted).toBeUndefined() // Not in this response
    })
  })

  describe('updateCustomization', () => {
    it('should update template customization', async () => {
      const mockDashboard: Partial<DeployedDashboard> = {
        customerId: 'customer-abc',
        customization: {
          branding: {
            companyName: 'Acme Finance Updated',
            primaryColor: '#0EA5E9'
          }
        }
      }

      mockHttp.mockPut('/templates/dashboards/customer-abc/customization', mockDashboard as DeployedDashboard)

      const updates: Partial<TemplateCustomization> = {
        branding: {
          companyName: 'Acme Finance Updated',
          primaryColor: '#0EA5E9'
        }
      }

      const result = await templateClient.updateCustomization('customer-abc', updates)

      expect(result.customization?.branding?.companyName).toBe('Acme Finance Updated')
    })
  })

  describe('deleteDashboard', () => {
    it('should delete deployed dashboard', async () => {
      mockHttp.mockDelete('/templates/dashboards/customer-abc', undefined)

      await templateClient.deleteDashboard('customer-abc')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'DELETE',
        path: '/templates/dashboards/customer-abc'
      })
    })
  })

  describe('getIndustryBestPractices', () => {
    it('should get industry best practices from Layer 2 RAG', async () => {
      const mockBestPractices = {
        industry: 'finance' as const,
        bestPractices: [
          {
            category: 'compliance',
            title: 'PCI-DSS Implementation',
            description: 'Best practices for PCI-DSS compliance',
            source: 'industry-finance-rag'
          }
        ],
        complianceRequirements: ['PCI-DSS', 'SOC2', 'GDPR'],
        recommendedModules: ['analytics', 'compliance', 'reporting']
      }

      mockHttp.mockGet('/templates/industries/finance/best-practices', mockBestPractices)

      const result = await templateClient.getIndustryBestPractices('finance')

      expect(result).toEqual(mockBestPractices)
      expect(result.bestPractices).toHaveLength(1)
      expect(result.complianceRequirements).toContain('PCI-DSS')
    })
  })

  describe('validateDeployment', () => {
    it('should validate deployment configuration', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
        warnings: ['Consider enabling additional compliance modules'],
        estimatedCost: {
          monthly: 99,
          setup: 50,
          currency: 'USD'
        }
      }

      mockHttp.mockPost('/templates/validate', mockValidation)

      const request: DeploymentRequest = {
        industry: 'finance',
        customization: {
          branding: { companyName: 'Test' }
        },
        storageLayer: 'layer3',
        deploymentType: 'test'
      }

      const result = await templateClient.validateDeployment(request)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.estimatedCost.monthly).toBe(99)
    })
  })

  describe('getDeploymentMetrics', () => {
    it('should get deployment metrics', async () => {
      const mockMetrics = {
        uptime: 99.99,
        requests: 300000,
        errors: 10,
        avgResponseTime: 150,
        storageUsed: 2.5,
        costSaved: 1973.20 // 90% savings vs Google Cloud
      }

      mockHttp.mockGet('/templates/dashboards/customer-abc/metrics', mockMetrics)

      const result = await templateClient.getDeploymentMetrics('customer-abc', {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      })

      expect(result).toEqual(mockMetrics)
      expect(result.costSaved).toBe(1973.20)
    })
  })

  describe('listDeployments', () => {
    it('should list all customer deployments', async () => {
      const mockDeployments: DeployedDashboard[] = [
        {
          customerId: 'customer-1',
          industry: 'finance',
          dashboardUrl: 'https://customer-1.varity.io'
        } as DeployedDashboard,
        {
          customerId: 'customer-2',
          industry: 'healthcare',
          dashboardUrl: 'https://customer-2.varity.io'
        } as DeployedDashboard
      ]

      mockHttp.mockGet('/templates/deployments', mockDeployments)

      const result = await templateClient.listDeployments({ industry: 'finance' })

      expect(result).toEqual(mockDeployments)
      expect(result).toHaveLength(2)
    })
  })
})
