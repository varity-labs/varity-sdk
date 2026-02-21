// Type definitions for Varity DB Proxy

export interface AppContext {
  appId: string;
  schema: string;
}

export interface JWTPayload {
  appId: string;
  iat?: number;
  exp?: number;
}

export interface DatabaseQuery {
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface DatabaseResponse {
  success: boolean;
  data?: any;
  error?: string;
}
