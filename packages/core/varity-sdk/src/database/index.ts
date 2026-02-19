/**
 * Varity Database Module
 *
 * Zero-config database API for Varity applications.
 * Provides a simple, MongoDB-like interface for data persistence.
 *
 * @example
 * ```typescript
 * import { db } from '@varity-labs/sdk';
 *
 * // Insert
 * await db.collection('products').add({ name: 'Widget', price: 29.99 });
 *
 * // Query
 * const products = await db.collection('products').get();
 *
 * // Update
 * await db.collection('products').update(id, { price: 24.99 });
 *
 * // Delete
 * await db.collection('products').delete(id);
 * ```
 */

import { Collection } from './collection';
import { VARITY_DEV_DB_CREDENTIALS } from '../core/credentials';
import type { DatabaseConfig } from './types';

/**
 * Main Database class
 *
 * Provides access to database collections with zero configuration.
 * Configuration is automatically injected by Varity CLI during deployment.
 */
export class Database {
  private config: Required<DatabaseConfig>;

  /**
   * Create a new Database instance
   *
   * @param config - Optional configuration (auto-configured by Varity CLI)
   *
   * @example
   * ```typescript
   * // Default instance (recommended)
   * import { db } from '@varity-labs/sdk';
   *
   * // Custom instance (advanced)
   * import { Database } from '@varity-labs/sdk';
   * const customDb = new Database({
   *   proxyUrl: 'https://custom-proxy.example.com',
   *   appToken: 'custom-jwt-token'
   * });
   * ```
   */
  constructor(config?: Partial<DatabaseConfig>) {
    // Resolve configuration from environment or defaults
    // Use literal process.env.NEXT_PUBLIC_* for Next.js build-time replacement
    this.config = {
      proxyUrl:
        config?.proxyUrl ||
        process.env.NEXT_PUBLIC_VARITY_DB_PROXY_URL ||
        process.env.VITE_VARITY_DB_PROXY_URL ||
        process.env.REACT_APP_VARITY_DB_PROXY_URL ||
        'http://provider.akashprovid.com:31782',
      appToken:
        config?.appToken ||
        process.env.NEXT_PUBLIC_VARITY_APP_TOKEN ||
        process.env.VITE_VARITY_APP_TOKEN ||
        process.env.REACT_APP_VARITY_APP_TOKEN ||
        VARITY_DEV_DB_CREDENTIALS.token,
    };

    // Log when using shared development database
    if (this.config.appToken === VARITY_DEV_DB_CREDENTIALS.token && typeof console !== 'undefined') {
      console.info(
        '[Varity Database] Using shared development database. ' +
        'Data is stored in an isolated dev schema.\n' +
        'Deploy with `varitykit app deploy` to get your own private database.'
      );
    }
  }

  /**
   * Get a collection instance for performing CRUD operations
   *
   * @param name - Collection name (e.g., 'products', 'users', 'orders')
   * @returns Collection instance with CRUD methods
   *
   * @example
   * ```typescript
   * // Type-safe collection
   * interface Product {
   *   name: string;
   *   price: number;
   *   stock: number;
   * }
   *
   * const products = db.collection<Product>('products');
   * const product = await products.add({ name: 'Widget', price: 29.99, stock: 100 });
   * // product.id is string
   * // product.name is string
   * // product.price is number
   * ```
   */
  collection<T = any>(name: string): Collection<T> {
    return new Collection<T>(name, this.config.proxyUrl, this.config.appToken);
  }
}

/**
 * Default database instance
 *
 * Pre-configured singleton for immediate use.
 * This is the recommended way to use the database in your app.
 *
 * @example
 * ```typescript
 * import { db } from '@varity-labs/sdk';
 *
 * await db.collection('products').add({ name: 'Widget', price: 29.99 });
 * const products = await db.collection('products').get();
 * ```
 */
export const db = new Database();

// Export types and classes
export * from './types';
export { Collection } from './collection';
