/**
 * Database Module Tests
 *
 * Tests for the zero-config database API (the primary MVP export).
 */

import { Database, db, Collection } from '../index';
import type { DatabaseConfig, QueryOptions, Document, CollectionResponse } from '../types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('Database', () => {
  describe('constructor', () => {
    it('should create instance with default config', () => {
      const database = new Database();
      expect(database).toBeInstanceOf(Database);
    });

    it('should accept custom config', () => {
      const database = new Database({
        proxyUrl: 'https://custom-proxy.example.com',
        appToken: 'test-token-123',
      });
      expect(database).toBeInstanceOf(Database);
    });

    it('should warn when no app token is set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Clear env vars that might have tokens
      const origToken = process.env.NEXT_PUBLIC_VARITY_APP_TOKEN;
      delete process.env.NEXT_PUBLIC_VARITY_APP_TOKEN;
      delete process.env.VITE_VARITY_APP_TOKEN;
      delete process.env.REACT_APP_VARITY_APP_TOKEN;

      new Database({ proxyUrl: 'http://localhost:3001', appToken: '' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No app token found')
      );
      consoleSpy.mockRestore();
      if (origToken) process.env.NEXT_PUBLIC_VARITY_APP_TOKEN = origToken;
    });

    it('should not warn when app token is provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      new Database({ proxyUrl: 'http://localhost:3001', appToken: 'valid-token' });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('collection()', () => {
    it('should return a Collection instance', () => {
      const database = new Database({ proxyUrl: 'http://localhost', appToken: 'tok' });
      const col = database.collection('products');
      expect(col).toBeInstanceOf(Collection);
    });

    it('should support generic type parameter', () => {
      interface Product { name: string; price: number; }
      const database = new Database({ proxyUrl: 'http://localhost', appToken: 'tok' });
      const col = database.collection<Product>('products');
      expect(col).toBeInstanceOf(Collection);
    });
  });
});

describe('db singleton', () => {
  it('should be a Database instance', () => {
    expect(db).toBeInstanceOf(Database);
  });

  it('should return Collection from collection()', () => {
    const col = db.collection('test');
    expect(col).toBeInstanceOf(Collection);
  });
});

describe('Collection', () => {
  const proxyUrl = 'http://localhost:3001';
  const appToken = 'test-jwt-token';

  describe('add()', () => {
    it('should POST to the correct endpoint', async () => {
      const mockData = { id: 'uuid-1', name: 'Widget', price: 29.99, created_at: '2026-01-01' };
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      const result = await col.add({ name: 'Widget', price: 29.99 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/db/products/add',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Widget', price: 29.99 }),
        })
      );
      expect(result.id).toBe('uuid-1');
      expect(result.name).toBe('Widget');
    });

    it('should throw on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Insert failed' }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      await expect(col.add({ name: 'Bad' })).rejects.toThrow('Insert failed');
    });

    it('should throw generic error when no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      await expect(col.add({})).rejects.toThrow('Failed to insert document');
    });
  });

  describe('get()', () => {
    it('should GET from the correct endpoint', async () => {
      const mockData = [
        { id: '1', name: 'A', created_at: '2026-01-01' },
        { id: '2', name: 'B', created_at: '2026-01-02' },
      ];
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      const result = await col.get();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/db/products/get',
        expect.objectContaining({
          headers: { 'Authorization': 'Bearer test-jwt-token' },
        })
      );
      expect(result).toHaveLength(2);
    });

    it('should pass query options as URL params', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      await col.get({ limit: 10, offset: 20, orderBy: '-price' });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=20');
      expect(calledUrl).toContain('orderBy=-price');
    });

    it('should return empty array when data is null', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: null }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      const result = await col.get();
      expect(result).toEqual([]);
    });

    it('should throw on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Query error' }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      await expect(col.get()).rejects.toThrow('Query error');
    });
  });

  describe('update()', () => {
    it('should PUT to the correct endpoint', async () => {
      const mockData = { id: 'uuid-1', name: 'Widget', price: 24.99, updated_at: '2026-01-02' };
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockData }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      const result = await col.update('uuid-1', { price: 24.99 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/db/products/update/uuid-1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: 24.99 }),
        })
      );
      expect(result.price).toBe(24.99);
    });

    it('should throw on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Not found' }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      await expect(col.update('bad-id', {})).rejects.toThrow('Not found');
    });
  });

  describe('delete()', () => {
    it('should DELETE at the correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      const result = await col.delete('uuid-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/db/products/delete/uuid-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer test-jwt-token' },
        })
      );
      expect(result).toBe(true);
    });

    it('should throw on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Delete failed' }),
      });

      const col = new Collection('products', proxyUrl, appToken);
      await expect(col.delete('bad-id')).rejects.toThrow('Delete failed');
    });
  });
});

describe('Type exports', () => {
  it('should export DatabaseConfig type', () => {
    const config: DatabaseConfig = { proxyUrl: 'http://test', appToken: 'tok' };
    expect(config.proxyUrl).toBe('http://test');
  });

  it('should export QueryOptions type', () => {
    const opts: QueryOptions = { limit: 10, offset: 0, orderBy: '-created_at' };
    expect(opts.limit).toBe(10);
  });

  it('should export Document type', () => {
    const doc: Document = { id: 'test-id', created_at: '2026-01-01' };
    expect(doc.id).toBe('test-id');
  });

  it('should export CollectionResponse type', () => {
    const resp: CollectionResponse = { success: true, data: [] };
    expect(resp.success).toBe(true);
  });
});
