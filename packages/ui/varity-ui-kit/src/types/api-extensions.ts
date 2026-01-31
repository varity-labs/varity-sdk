/**
 * API Type Extensions for Varity UI Kit
 *
 * Extends base API types with additional properties used by UI hooks
 */

import { Metadata, JSONValue, JSONObject } from '@varity-labs/types';

// Extended UserProfile with UI-specific properties
export interface UserProfile {
  address: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  metadata?: Metadata;
}

// Extended LoginResponse with UI-specific properties
export interface LoginResponse {
  token: string;
  address: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  metadata?: Metadata;
}

// KPI Types for Analytics
export interface KPIResult {
  kpis: Array<{
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
  }>;
  metrics?: Record<string, number | string>;
}

// Trend Data Types
export interface TrendDataPoint {
  date: string;
  value: number;
  metadata?: Metadata;
}

export interface TrendResponse {
  data: TrendDataPoint[];
}

// Analytics Period Type (extended with 'custom')
export type AnalyticsPeriod = 'current_day' | 'current_week' | 'current_month' | 'current_year' | 'custom';

// Dashboard Widget Configuration
export interface DashboardWidget {
  id: string;
  type: string;
  title?: string;
  config: JSONObject;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Analytics Client Interface
export interface AnalyticsClient {
  getKPIs(params: { period: AnalyticsPeriod }): Promise<KPIResult>;
  getTrends(params: { startDate: string; endDate: string }): Promise<TrendResponse>;
  getData(config: JSONObject): Promise<JSONValue>;
  trackEvent(params: { event: string; properties: Record<string, JSONValue>; timestamp: string }): Promise<void>;
}

// Dashboard Types
export interface DashboardConfig {
  id: string;
  title: string;
  description?: string;
  widgets: DashboardWidget[];
  layout?: string;
  theme?: string;
}

export interface DashboardClient {
  get(id: string): Promise<DashboardConfig>;
  save(config: DashboardConfig): Promise<void>;
}

// Auth Client Interface
export interface AuthClient {
  me(): Promise<UserProfile>;
  login(message: string, signature: string): Promise<LoginResponse>;
  logout(): Promise<void>;
}

// Extended Varity Client Interface
export interface ExtendedVarityClient {
  auth: AuthClient;
  analytics: AnalyticsClient;
  dashboard: DashboardClient;
  setAPIKey(token: string): void;
}
