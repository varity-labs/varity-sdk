/**
 * API Types for Varity SDK
 *
 * Type-safe definitions for API requests and responses
 */

import { JSONValue, JSONObject, Metadata } from './common';

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
}

/**
 * API error response
 */
export interface APIError {
  message: string;
  code?: string;
  status: number;
  details?: JSONObject;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * API request configuration
 */
export interface APIRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * HTTP method types
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * User profile data from API
 */
export interface UserProfile {
  address: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  metadata?: Metadata;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  user: UserProfile;
}

/**
 * Authentication token data
 */
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer' | string;
  expiresIn?: number;
  expiresAt?: string;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: JSONObject;
  metadata?: Metadata;
}

/**
 * Oracle data response
 */
export interface OracleData {
  value: JSONValue;
  timestamp: number;
  source: string;
  confidence: number;
  metadata?: Metadata;
}

/**
 * Price data from oracle
 */
export interface PriceData {
  asset: string;
  price: number;
  currency: string;
  timestamp: number;
  sources: string[];
  confidence?: number;
}

/**
 * Analytics KPI
 */
export interface KPI {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  metadata?: Metadata;
}

/**
 * Analytics KPI result
 */
export interface KPIResult {
  kpis: KPI[];
  metrics?: Record<string, number | string>;
  timestamp?: string;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  metadata?: Metadata;
}

/**
 * Trend data response
 */
export interface TrendResponse {
  data: TimeSeriesDataPoint[];
  aggregation?: 'hour' | 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  id: string;
  title: string;
  description?: string;
  widgets: DashboardWidget[];
  layout?: DashboardLayout;
  theme?: DashboardTheme;
  metadata?: Metadata;
}

/**
 * Dashboard widget
 */
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

/**
 * Dashboard layout
 */
export type DashboardLayout = 'grid' | 'flex' | 'masonry' | string;

/**
 * Dashboard theme
 */
export type DashboardTheme = 'light' | 'dark' | 'auto' | string;

/**
 * Analytics period
 */
export type AnalyticsPeriod =
  | 'current_day'
  | 'current_week'
  | 'current_month'
  | 'current_year'
  | 'custom';

/**
 * Event tracking data
 */
export interface EventData {
  event: string;
  properties: Record<string, JSONValue>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

/**
 * File upload data
 */
export interface UploadData {
  file: File | Blob;
  fileName?: string;
  contentType?: string;
  metadata?: Metadata;
}

/**
 * File upload response
 */
export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  metadata?: Metadata;
}
