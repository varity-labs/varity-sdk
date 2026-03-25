/**
 * Collection Class
 *
 * Provides CRUD operations for a database collection.
 * All operations communicate with the Varity DB proxy service.
 */

import type { QueryOptions, Document, CollectionResponse } from './types';

/**
 * Represents a database collection with CRUD operations
 *
 * @example
 * ```typescript
 * const products = db.collection<Product>('products');
 *
 * // Insert
 * const product = await products.add({ name: 'Widget', price: 29.99 });
 *
 * // Query
 * const allProducts = await products.get();
 * const limitedProducts = await products.get({ limit: 10 });
 *
 * // Update
 * await products.update(product.id, { price: 24.99 });
 *
 * // Delete
 * await products.delete(product.id);
 * ```
 */
export class Collection<T = any> {
  constructor(
    private name: string,
    private proxyUrl: string,
    private appToken: string | Promise<string>
  ) {}

  /**
   * Resolve the app token (handles both sync string and async Promise<string>).
   * @internal
   */
  private async resolveToken(): Promise<string> {
    return this.appToken;
  }

  /**
   * Insert a new document into the collection
   *
   * @param data - Document data to insert
   * @returns The inserted document with id and timestamps
   * @throws Error if the operation fails
   *
   * @example
   * ```typescript
   * const product = await db.collection('products').add({
   *   name: 'T-Shirt',
   *   price: 29.99,
   *   stock: 100
   * });
   * console.log(product.id); // "550e8400-e29b-41d4-a716-446655440000"
   * ```
   */
  async add(data: Partial<T>): Promise<T & Document> {
    const token = await this.resolveToken();
    const response = await fetch(`${this.proxyUrl}/db/${this.name}/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: CollectionResponse<T & Document> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to insert document');
    }

    return result.data!;
  }

  /**
   * Query documents from the collection
   *
   * @param options - Query options (limit, offset, orderBy)
   * @returns Array of matching documents
   * @throws Error if the operation fails
   *
   * @example
   * ```typescript
   * // Get all documents
   * const all = await db.collection('products').get();
   *
   * // Get with pagination
   * const page1 = await db.collection('products').get({ limit: 10, offset: 0 });
   * const page2 = await db.collection('products').get({ limit: 10, offset: 10 });
   *
   * // Get with ordering
   * const sorted = await db.collection('products').get({ orderBy: '-price' });
   * ```
   */
  async get(options?: QueryOptions): Promise<(T & Document)[]> {
    // Build query string
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.orderBy) params.set('orderBy', options.orderBy);

    const queryString = params.toString();
    const url = `${this.proxyUrl}/db/${this.name}/get${queryString ? `?${queryString}` : ''}`;

    const token = await this.resolveToken();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: CollectionResponse<(T & Document)[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to query documents');
    }

    return result.data || [];
  }

  /**
   * Update a document in the collection
   *
   * @param id - Document ID to update
   * @param data - Partial document data to update
   * @returns The updated document
   * @throws Error if the operation fails
   *
   * @example
   * ```typescript
   * await db.collection('products').update(productId, {
   *   price: 24.99,
   *   stock: 95
   * });
   * ```
   */
  async update(id: string, data: Partial<T>): Promise<T & Document> {
    const token = await this.resolveToken();
    const response = await fetch(`${this.proxyUrl}/db/${this.name}/update/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: CollectionResponse<T & Document> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update document');
    }

    return result.data!;
  }

  /**
   * Delete a document from the collection
   *
   * @param id - Document ID to delete
   * @returns True if deletion was successful
   * @throws Error if the operation fails
   *
   * @example
   * ```typescript
   * await db.collection('products').delete(productId);
   * ```
   */
  async delete(id: string): Promise<boolean> {
    const token = await this.resolveToken();
    const response = await fetch(`${this.proxyUrl}/db/${this.name}/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: CollectionResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete document');
    }

    return true;
  }
}
