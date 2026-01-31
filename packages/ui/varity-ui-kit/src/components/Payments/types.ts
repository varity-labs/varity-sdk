/**
 * Payment Types
 * Type definitions for Varity payment and subscription system
 */

export enum SubscriptionTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIALING = 'trialing',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number; // USDC amount (6 decimals)
  priceDisplay: string; // $99/month
  features: string[];
  maxUsers?: number;
  maxDashboards?: number;
  maxStorage?: number; // in GB
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  isPopular?: boolean;
  isRecommended?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  walletAddress: string;
  planId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  walletAddress: string;
  subscriptionId?: string;
  amount: number; // USDC amount (6 decimals)
  currency: 'USDC';
  status: PaymentStatus;
  transactionHash?: string;
  invoiceId?: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: 'USDC';
  status: 'draft' | 'open' | 'paid' | 'void';
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  downloadUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface UsageMetrics {
  userId: string;
  period: 'current' | 'previous';
  dashboardViews: number;
  apiCalls: number;
  storageUsed: number; // in GB
  activeUsers: number;
  billingCycle: 'monthly' | 'annual';
}

export interface PaymentMethod {
  id: string;
  type: 'wallet' | 'usdc_allowance';
  walletAddress: string;
  chainId: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface CheckoutSession {
  id: string;
  planId: string;
  userId: string;
  walletAddress: string;
  amount: number;
  currency: 'USDC';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  successUrl?: string;
  cancelUrl?: string;
}
