/**
 * Finance Template TypeScript Type Definitions
 * Auto-generated for {{ company_name }}
 */

// Transaction types
export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  timestamp: Date;
  type: 'transfer' | 'payment' | 'withdrawal' | 'deposit';
  riskScore: number;
  metadata?: Record<string, any>;
}

export interface TransactionFilter {
  startDate: Date;
  endDate: Date;
  status: 'all' | 'pending' | 'completed' | 'failed' | 'flagged';
  minAmount: number | null;
  maxAmount: number | null;
  type?: string;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalVolume: number;
  flaggedCount: number;
  avgRiskScore: number;
  transactionChange: number;
  volumeChange: number;
  flaggedChange: number;
  riskChange: number;
  transactionTrend: 'up' | 'down' | 'neutral';
  volumeTrend: 'up' | 'down' | 'neutral';
  flaggedTrend: 'up' | 'down' | 'neutral';
  riskTrend: 'up' | 'down' | 'neutral';
  volumeChart: ChartDataPoint[];
}

// Compliance types
export interface ComplianceReport {
  id: string;
  type: 'AML' | 'KYC' | 'CTF' | 'SAR' | 'Other';
  status: 'passed' | 'failed' | 'pending';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  framework: 'us' | 'eu' | 'uk' | 'global';
  description: string;
  findings: string[];
  recommendations: string[];
}

export interface ComplianceFilter {
  framework: string;
  status: 'all' | 'passed' | 'failed' | 'pending';
  severity: 'all' | 'low' | 'medium' | 'high';
}

export interface ComplianceMetrics {
  complianceScore: number;
  activeAlerts: number;
  reportsFiled: number;
  scoreChange: number;
  alertsChange: number;
  reportsChange: number;
  scoreTrend: 'up' | 'down' | 'neutral';
  alertsTrend: 'up' | 'down' | 'neutral';
  reportsTrend: 'up' | 'down' | 'neutral';
  scoreHistory: ChartDataPoint[];
  alertDistribution: PieChartData[];
}

export interface AMLAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  relatedTransactions: string[];
  status: 'open' | 'investigating' | 'resolved';
}

// KYC types
export interface KYCApplication {
  id: string;
  customerName: string;
  email: string;
  type: 'individual' | 'business';
  status: 'pending' | 'approved' | 'rejected' | 'review';
  documentsSubmitted: number;
  documentsRequired: number;
  riskLevel: 'low' | 'medium' | 'high';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

export interface KYCMetrics {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  approvalRate: number;
  applicationsChange: number;
  pendingChange: number;
  approvedChange: number;
  rateChange: number;
  applicationsTrend: 'up' | 'down' | 'neutral';
  approvedTrend: 'up' | 'down' | 'neutral';
  rateTrend: 'up' | 'down' | 'neutral';
}

export interface KYCStatus {
  pending: number;
  approved: number;
  rejected: number;
  pendingChange: number;
}

// Fraud Detection types
export interface FraudAlert {
  id: string;
  fraudType: string;
  pattern: string;
  riskScore: number;
  amount: number;
  status: 'open' | 'investigating' | 'resolved';
  aiConfidence: number;
  detectedAt: Date;
  transactionId: string;
  customerId: string;
  resolution?: string;
}

export interface FraudMetrics {
  activeAlerts: number;
  blockedAmount: number;
  detectionRate: number;
  falsePositiveRate: number;
  alertsChange: number;
  blockedChange: number;
  rateChange: number;
  fpChange: number;
  alertsTrend: 'up' | 'down' | 'neutral';
  blockedTrend: 'up' | 'down' | 'neutral';
  rateTrend: 'up' | 'down' | 'neutral';
  fraudTrend: ChartDataPoint[];
}

export interface FraudPattern {
  id: string;
  name: string;
  description: string;
  occurrences: number;
  confidence: number;
  lastSeen: Date;
}

// Risk types
export interface RiskMetric {
  category: string;
  exposure: number;
  var95: number;
  var99: number;
  concentration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskMetrics {
  totalExposure: number;
  portfolioVaR95: number;
  riskScore: number;
  capitalAdequacy: number;
  exposureChange: number;
  varChange: number;
  scoreChange: number;
  capitalChange: number;
  exposureTrend: 'up' | 'down' | 'neutral';
  varTrend: 'up' | 'down' | 'neutral';
  scoreTrend: 'up' | 'down' | 'neutral';
  capitalTrend: 'up' | 'down' | 'neutral';
  varHistory: ChartDataPoint[];
}

export interface Portfolio {
  exposureByCategory: ChartDataPoint[];
  concentrationMap: ConcentrationCell[];
  riskMetrics: RiskMetric[];
}

export interface ConcentrationCell {
  sector: string;
  concentration: number;
}

export interface StressTest {
  id: string;
  scenario: string;
  potentialLoss: number;
  impact: 'low' | 'moderate' | 'severe';
  probability: number;
}

export interface RiskForecast {
  predictions: ForecastPoint[];
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

// Chart types
export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface PieChartData {
  category: string;
  value: number;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface APIError {
  message: string;
  code: string;
  details?: any;
}
