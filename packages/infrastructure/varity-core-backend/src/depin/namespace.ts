/**
 * Celestia Namespace Utilities
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Utilities for managing Celestia namespaces in Varity's 3-layer storage architecture
 */

import crypto from 'crypto';
import { StorageLayer } from '../types';

/**
 * Celestia namespace constants
 */
export const NAMESPACE_VERSION = 0;
export const NAMESPACE_ID_SIZE = 8; // 8 bytes
export const NAMESPACE_TOTAL_SIZE = 10; // version(1) + id(8) + padding(1)

/**
 * Namespace prefix for Varity storage layers
 */
export enum NamespacePrefix {
  VARITY_INTERNAL = 'varity-internal',
  INDUSTRY_RAG = 'varity-industry',
  CUSTOMER_DATA = 'varity-customer',
}

/**
 * Generate a Celestia namespace ID from a string identifier
 * Returns a 10-byte buffer: [version(1)][namespace_id(8)][padding(1)]
 */
export function generateNamespaceId(identifier: string): Buffer {
  // Hash the identifier to get deterministic namespace ID
  const hash = crypto.createHash('sha256').update(identifier).digest();

  // Take first 8 bytes for namespace ID
  const namespaceId = hash.subarray(0, NAMESPACE_ID_SIZE);

  // Create 10-byte namespace with version prefix
  const fullNamespace = Buffer.alloc(NAMESPACE_TOTAL_SIZE);
  fullNamespace[0] = NAMESPACE_VERSION; // Version byte
  namespaceId.copy(fullNamespace, 1); // 8-byte namespace ID
  fullNamespace[9] = 0; // Padding byte

  return fullNamespace;
}

/**
 * Convert namespace Buffer to base64 string (required for Celestia RPC)
 */
export function namespaceToBase64(namespaceBuffer: Buffer): string {
  return namespaceBuffer.toString('base64');
}

/**
 * Convert base64 namespace string to Buffer
 */
export function namespaceFromBase64(namespaceBase64: string): Buffer {
  return Buffer.from(namespaceBase64, 'base64');
}

/**
 * Convert namespace Buffer to hex string
 */
export function namespaceToHex(namespaceBuffer: Buffer): string {
  return namespaceBuffer.toString('hex');
}

/**
 * Generate namespace for Varity internal storage (Layer 1)
 */
export function generateInternalNamespace(category: string): string {
  return `${NamespacePrefix.VARITY_INTERNAL}-${category}`;
}

/**
 * Generate namespace for industry RAG storage (Layer 2)
 */
export function generateIndustryNamespace(industry: string): string {
  return `${NamespacePrefix.INDUSTRY_RAG}-${industry}-rag`;
}

/**
 * Generate namespace for customer-specific storage (Layer 3)
 */
export function generateCustomerNamespace(customerId: string): string {
  return `${NamespacePrefix.CUSTOMER_DATA}-${customerId}`;
}

/**
 * Parse namespace string to determine storage layer
 */
export function parseNamespaceLayer(namespace: string): StorageLayer {
  if (namespace.startsWith(NamespacePrefix.VARITY_INTERNAL)) {
    return 'varity-internal';
  } else if (namespace.startsWith(NamespacePrefix.INDUSTRY_RAG)) {
    return 'industry-rag';
  } else if (namespace.startsWith(NamespacePrefix.CUSTOMER_DATA)) {
    return 'customer-data';
  }
  throw new Error(`Unknown namespace prefix: ${namespace}`);
}

/**
 * Validate namespace format
 */
export function validateNamespace(namespace: string): boolean {
  // Check if namespace starts with valid prefix
  const validPrefixes = Object.values(NamespacePrefix);
  return validPrefixes.some((prefix) => namespace.startsWith(prefix));
}

/**
 * Extract customer ID from customer namespace
 */
export function extractCustomerIdFromNamespace(namespace: string): string {
  if (!namespace.startsWith(NamespacePrefix.CUSTOMER_DATA)) {
    throw new Error('Not a customer namespace');
  }
  const parts = namespace.split('-');
  return parts.slice(2).join('-'); // Everything after 'varity-customer-'
}

/**
 * Extract industry from industry namespace
 */
export function extractIndustryFromNamespace(namespace: string): string {
  if (!namespace.startsWith(NamespacePrefix.INDUSTRY_RAG)) {
    throw new Error('Not an industry namespace');
  }
  const parts = namespace.split('-');
  return parts[2]; // The industry part in 'varity-industry-{industry}-rag'
}

/**
 * Extract category from internal namespace
 */
export function extractCategoryFromNamespace(namespace: string): string {
  if (!namespace.startsWith(NamespacePrefix.VARITY_INTERNAL)) {
    throw new Error('Not an internal namespace');
  }
  const parts = namespace.split('-');
  return parts.slice(2).join('-'); // Everything after 'varity-internal-'
}

/**
 * Generate namespace metadata for database storage
 */
export interface NamespaceMetadata {
  namespace: string;
  namespaceId: string; // hex representation
  namespaceBase64: string; // base64 for RPC
  layer: StorageLayer;
  createdAt: number;
}

export function createNamespaceMetadata(namespace: string): NamespaceMetadata {
  const namespaceId = generateNamespaceId(namespace);
  return {
    namespace,
    namespaceId: namespaceToHex(namespaceId),
    namespaceBase64: namespaceToBase64(namespaceId),
    layer: parseNamespaceLayer(namespace),
    createdAt: Date.now(),
  };
}
