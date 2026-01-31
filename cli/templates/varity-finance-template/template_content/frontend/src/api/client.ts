/**
 * Varity API Client
 * Integrates with @varity-labs/ui-kit and Varity L3 blockchain
 */

import { VarityClient } from '@varity-labs/ui-kit';
import type {
  Transaction,
  TransactionFilter,
  TransactionMetrics,
  ComplianceReport,
  ComplianceFilter,
  ComplianceMetrics,
  KYCApplication,
  KYCMetrics,
  FraudAlert,
  FraudMetrics,
  RiskMetrics,
  Portfolio,
  APIResponse,
  PaginatedResponse
} from '../types';

// Initialize Varity Client
export const varietyClient = new VarityClient({
  apiUrl: import.meta.env.VITE_VARITY_API_URL || '{{ varity_api_url }}',
  apiKey: import.meta.env.VITE_VARITY_API_KEY,
  chainId: {{ varity_chain_id }},
  ragNamespace: '{{ industry_rag_namespace }}'
});

// Transaction API
export const transactionAPI = {
  async getTransactions(filter: TransactionFilter): Promise<PaginatedResponse<Transaction>> {
    return varietyClient.analytics.query({
      endpoint: '/transactions',
      params: filter
    });
  },

  async getMetrics(filter: TransactionFilter): Promise<APIResponse<TransactionMetrics>> {
    return varietyClient.analytics.getMetrics({
      type: 'transactions',
      filter
    });
  },

  async getTransaction(id: string): Promise<APIResponse<Transaction>> {
    return varietyClient.analytics.query({
      endpoint: `/transactions/${id}`
    });
  }
};

// Compliance API
export const complianceAPI = {
  async getReports(filter: ComplianceFilter): Promise<PaginatedResponse<ComplianceReport>> {
    return varietyClient.analytics.query({
      endpoint: '/compliance/reports',
      params: filter
    });
  },

  async getMetrics(filter: ComplianceFilter): Promise<APIResponse<ComplianceMetrics>> {
    return varietyClient.analytics.getMetrics({
      type: 'compliance',
      filter
    });
  },

  async getAMLAlerts(): Promise<APIResponse<any[]>> {
    return varietyClient.analytics.query({
      endpoint: '/compliance/aml-alerts'
    });
  },

  async getKYCStatus(): Promise<APIResponse<any>> {
    return varietyClient.analytics.query({
      endpoint: '/compliance/kyc-status'
    });
  }
};

// KYC API
export const kycAPI = {
  async getApplications(): Promise<PaginatedResponse<KYCApplication>> {
    return varietyClient.analytics.query({
      endpoint: '/kyc/applications'
    });
  },

  async getMetrics(): Promise<APIResponse<KYCMetrics>> {
    return varietyClient.analytics.getMetrics({
      type: 'kyc'
    });
  },

  async submitDocument(applicationId: string, files: File[]): Promise<APIResponse<any>> {
    return varietyClient.storage.uploadEncrypted({
      files,
      namespace: 'customer-kyc-documents',
      metadata: {
        applicationId,
        timestamp: new Date().toISOString()
      }
    });
  },

  async approveApplication(applicationId: string): Promise<APIResponse<any>> {
    return varietyClient.analytics.mutation({
      endpoint: `/kyc/applications/${applicationId}/approve`,
      method: 'POST'
    });
  },

  async rejectApplication(applicationId: string): Promise<APIResponse<any>> {
    return varietyClient.analytics.mutation({
      endpoint: `/kyc/applications/${applicationId}/reject`,
      method: 'POST'
    });
  }
};

// Fraud Detection API
export const fraudAPI = {
  async getAlerts(): Promise<PaginatedResponse<FraudAlert>> {
    return varietyClient.analytics.query({
      endpoint: '/fraud/alerts'
    });
  },

  async getMetrics(): Promise<APIResponse<FraudMetrics>> {
    return varietyClient.analytics.getMetrics({
      type: 'fraud'
    });
  },

  async getPatterns(): Promise<APIResponse<any[]>> {
    return varietyClient.compute.runModel({
      model: 'fraud-pattern-detection',
      data: {}
    });
  },

  async investigateAlert(alertId: string): Promise<APIResponse<any>> {
    return varietyClient.analytics.mutation({
      endpoint: `/fraud/alerts/${alertId}/investigate`,
      method: 'POST'
    });
  },

  async resolveAlert(alertId: string, resolution: string): Promise<APIResponse<any>> {
    return varietyClient.analytics.mutation({
      endpoint: `/fraud/alerts/${alertId}/resolve`,
      method: 'POST',
      data: { resolution }
    });
  }
};

// Risk API
export const riskAPI = {
  async getMetrics(): Promise<APIResponse<RiskMetrics>> {
    return varietyClient.analytics.getMetrics({
      type: 'risk'
    });
  },

  async getPortfolio(): Promise<APIResponse<Portfolio>> {
    return varietyClient.analytics.query({
      endpoint: '/risk/portfolio'
    });
  },

  async getStressTests(): Promise<APIResponse<any[]>> {
    return varietyClient.compute.runModel({
      model: 'stress-testing',
      data: {}
    });
  },

  async getForecast(): Promise<APIResponse<any>> {
    return varietyClient.compute.runModel({
      model: 'risk-forecasting',
      data: { horizon: 30 }
    });
  }
};

export default varietyClient;
