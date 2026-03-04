/**
 * Template Deployment Client - Industry-specific dashboard deployment
 *
 * Handles deployment of industry templates to Varity L3 blockchain
 */

import { HTTPClient } from '../../utils/http'

export type IndustryType = 'finance' | 'healthcare' | 'retail' | 'iso' | 'manufacturing'

export interface TemplateMetadata {
  id: string
  industry: IndustryType
  name: string
  description: string
  version: string
  features: string[]
  pricing: {
    tier: 'basic' | 'professional' | 'enterprise'
    monthlyPrice: number
  }
  modules: string[]
  complianceStandards: string[]
}

export interface TemplateCustomization {
  branding?: {
    companyName: string
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    darkMode?: boolean
  }
  modules?: {
    enabled: string[]
    disabled: string[]
  }
  integrations?: {
    name: string
    config: Record<string, any>
  }[]
  dataRetention?: {
    period: number
    unit: 'days' | 'months' | 'years'
  }
  notifications?: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export interface DeploymentRequest {
  industry: IndustryType
  templateId?: string
  customization: TemplateCustomization
  l3Network?: {
    chainId: number
    rpcUrl: string
  }
  storageLayer: 'layer2' | 'layer3' // Layer 2 = Industry RAG, Layer 3 = Customer-specific
  deploymentType: 'test' | 'production'
}

export interface DeploymentResponse {
  deploymentId: string
  customerId: string
  dashboardUrl: string
  contractAddress?: string
  l3ChainId: number
  storageConfig: {
    layer2Namespace: string // Industry RAG storage (shared)
    layer3Namespace: string // Customer-specific storage (private)
    litProtocolEncrypted: boolean
  }
  status: 'pending' | 'deploying' | 'active' | 'failed'
  timestamp: string
  estimatedCompletionTime?: string
}

export interface DeploymentStatus {
  deploymentId: string
  status: 'pending' | 'deploying' | 'active' | 'failed'
  progress: number
  currentStep: string
  steps: Array<{
    name: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    timestamp?: string
    error?: string
  }>
  logs: string[]
}

export interface DeployedDashboard {
  customerId: string
  industry: IndustryType
  template: TemplateMetadata
  customization: TemplateCustomization
  dashboardUrl: string
  apiEndpoint: string
  contractAddress?: string
  storage: {
    layer2Namespace: string
    layer3Namespace: string
    totalDocuments: number
    storageUsedGB: number
  }
  metrics: {
    uptime: number
    requestsPerDay: number
    activeUsers: number
  }
  deployedAt: string
  lastUpdated: string
}

export class TemplateDeploymentClient {
  constructor(private http: HTTPClient) {}

  /**
   * List available templates by industry
   */
  async listTemplates(industry?: IndustryType): Promise<TemplateMetadata[]> {
    const params = industry ? { industry } : {}
    return this.http.get<TemplateMetadata[]>('/templates/list', { params })
  }

  /**
   * Get template details
   */
  async getTemplate(templateId: string): Promise<TemplateMetadata> {
    return this.http.get<TemplateMetadata>(`/templates/${templateId}`)
  }

  /**
   * Deploy template to Varity L3
   */
  async deployTemplate(request: DeploymentRequest): Promise<DeploymentResponse> {
    return this.http.post<DeploymentResponse>('/templates/deploy', request)
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    return this.http.get<DeploymentStatus>(`/templates/deployments/${deploymentId}/status`)
  }

  /**
   * Get deployed dashboard
   */
  async getDeployedDashboard(customerId: string): Promise<DeployedDashboard> {
    return this.http.get<DeployedDashboard>(`/templates/dashboards/${customerId}`)
  }

  /**
   * Update template customization
   */
  async updateCustomization(
    customerId: string,
    customization: Partial<TemplateCustomization>
  ): Promise<DeployedDashboard> {
    return this.http.put<DeployedDashboard>(
      `/templates/dashboards/${customerId}/customization`,
      customization
    )
  }

  /**
   * Delete deployed dashboard
   */
  async deleteDashboard(customerId: string): Promise<void> {
    return this.http.delete<void>(`/templates/dashboards/${customerId}`)
  }

  /**
   * Clone template configuration
   */
  async cloneTemplate(templateId: string, newName: string): Promise<TemplateMetadata> {
    return this.http.post<TemplateMetadata>(`/templates/${templateId}/clone`, { newName })
  }

  /**
   * Export dashboard configuration
   */
  async exportConfiguration(customerId: string): Promise<{
    template: TemplateMetadata
    customization: TemplateCustomization
  }> {
    return this.http.get(`/templates/dashboards/${customerId}/export`)
  }

  /**
   * Import dashboard configuration
   */
  async importConfiguration(config: {
    template: TemplateMetadata
    customization: TemplateCustomization
  }): Promise<DeploymentResponse> {
    return this.http.post<DeploymentResponse>('/templates/import', config)
  }

  /**
   * Get industry best practices (from Layer 2 Industry RAG)
   */
  async getIndustryBestPractices(industry: IndustryType): Promise<{
    industry: IndustryType
    bestPractices: Array<{
      category: string
      title: string
      description: string
      source: string
    }>
    complianceRequirements: string[]
    recommendedModules: string[]
  }> {
    return this.http.get(`/templates/industries/${industry}/best-practices`)
  }

  /**
   * Validate deployment configuration
   */
  async validateDeployment(request: DeploymentRequest): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
    estimatedCost: {
      monthly: number
      setup: number
      currency: string
    }
  }> {
    return this.http.post('/templates/validate', request)
  }

  /**
   * Get deployment metrics
   */
  async getDeploymentMetrics(customerId: string, period: {
    startDate: string
    endDate: string
  }): Promise<{
    uptime: number
    requests: number
    errors: number
    avgResponseTime: number
    storageUsed: number
    costSaved: number
  }> {
    return this.http.get(`/templates/dashboards/${customerId}/metrics`, {
      params: period
    })
  }

  /**
   * List all customer deployments
   */
  async listDeployments(filters?: {
    industry?: IndustryType
    status?: string
    limit?: number
  }): Promise<DeployedDashboard[]> {
    return this.http.get<DeployedDashboard[]>('/templates/deployments', {
      params: filters
    })
  }
}
