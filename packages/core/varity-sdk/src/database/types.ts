/**
 * Database Module Types
 *
 * Type definitions for the Varity zero-config database API.
 */

/**
 * Configuration for the Varity Database
 */
export interface DatabaseConfig {
  /**
   * URL of the Varity DB proxy service
   * @default 'https://db-proxy.varity.so' or process.env.VITE_VARITY_DB_PROXY_URL
   */
  proxyUrl?: string;

  /**
   * JWT token for authenticating with the database proxy
   * Automatically injected by Varity CLI during deployment
   * @default process.env.VITE_VARITY_APP_TOKEN
   */
  appToken?: string;
}

/**
 * Options for querying documents from a collection
 */
export interface QueryOptions {
  /**
   * Maximum number of documents to return
   */
  limit?: number;

  /**
   * Number of documents to skip (for pagination)
   */
  offset?: number;

  /**
   * Field to order results by
   * Format: "fieldName" for ascending, "-fieldName" for descending
   */
  orderBy?: string;
}

/**
 * Base document type with system fields
 */
export interface Document {
  /**
   * Unique identifier (UUID)
   */
  id: string;

  /**
   * Document creation timestamp
   */
  created_at?: string;

  /**
   * Document last update timestamp
   */
  updated_at?: string;

  /**
   * Custom document data
   */
  [key: string]: any;
}

/**
 * Response wrapper for database operations
 */
export interface CollectionResponse<T = any> {
  /**
   * Whether the operation succeeded
   */
  success: boolean;

  /**
   * Response data (if successful)
   */
  data?: T;

  /**
   * Error message (if failed)
   */
  error?: string;
}
