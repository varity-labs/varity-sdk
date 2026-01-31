/**
 * Namespace Utilities Unit Tests
 * PROPRIETARY - DO NOT DISTRIBUTE
 */

import {
  generateNamespaceId,
  namespaceToBase64,
  namespaceFromBase64,
  namespaceToHex,
  generateInternalNamespace,
  generateIndustryNamespace,
  generateCustomerNamespace,
  parseNamespaceLayer,
  validateNamespace,
  extractCustomerIdFromNamespace,
  extractIndustryFromNamespace,
  extractCategoryFromNamespace,
  createNamespaceMetadata,
  NAMESPACE_VERSION,
  NAMESPACE_ID_SIZE,
  NAMESPACE_TOTAL_SIZE,
} from '../namespace';

describe('Namespace Utilities', () => {
  describe('generateNamespaceId', () => {
    it('should generate 10-byte namespace ID', () => {
      const namespace = 'varity-test';
      const namespaceId = generateNamespaceId(namespace);

      expect(namespaceId).toBeInstanceOf(Buffer);
      expect(namespaceId.length).toBe(NAMESPACE_TOTAL_SIZE);
    });

    it('should have correct structure', () => {
      const namespaceId = generateNamespaceId('test');

      expect(namespaceId[0]).toBe(NAMESPACE_VERSION); // Version byte
      expect(namespaceId[9]).toBe(0); // Padding byte
    });

    it('should be deterministic', () => {
      const namespace = 'varity-customer-123';
      const id1 = generateNamespaceId(namespace);
      const id2 = generateNamespaceId(namespace);

      expect(id1).toEqual(id2);
    });

    it('should generate different IDs for different namespaces', () => {
      const id1 = generateNamespaceId('namespace1');
      const id2 = generateNamespaceId('namespace2');

      expect(id1).not.toEqual(id2);
    });
  });

  describe('Namespace Encoding/Decoding', () => {
    it('should convert to base64 and back', () => {
      const original = generateNamespaceId('test');
      const base64 = namespaceToBase64(original);
      const decoded = namespaceFromBase64(base64);

      expect(decoded).toEqual(original);
    });

    it('should convert to hex', () => {
      const namespaceId = generateNamespaceId('test');
      const hex = namespaceToHex(namespaceId);

      expect(typeof hex).toBe('string');
      expect(hex.length).toBe(NAMESPACE_TOTAL_SIZE * 2); // 2 hex chars per byte
      expect(/^[0-9a-f]+$/.test(hex)).toBe(true); // Valid hex
    });
  });

  describe('Namespace Generation', () => {
    it('should generate internal namespace', () => {
      const namespace = generateInternalNamespace('platform-docs');

      expect(namespace).toBe('varity-internal-platform-docs');
      expect(namespace.startsWith('varity-internal-')).toBe(true);
    });

    it('should generate industry namespace', () => {
      const namespace = generateIndustryNamespace('finance');

      expect(namespace).toBe('varity-industry-finance-rag');
      expect(namespace.startsWith('varity-industry-')).toBe(true);
      expect(namespace.endsWith('-rag')).toBe(true);
    });

    it('should generate customer namespace', () => {
      const namespace = generateCustomerNamespace('customer-123');

      expect(namespace).toBe('varity-customer-customer-123');
      expect(namespace.startsWith('varity-customer-')).toBe(true);
    });
  });

  describe('parseNamespaceLayer', () => {
    it('should parse internal namespace', () => {
      const namespace = 'varity-internal-docs';
      const layer = parseNamespaceLayer(namespace);

      expect(layer).toBe('varity-internal');
    });

    it('should parse industry namespace', () => {
      const namespace = 'varity-industry-finance-rag';
      const layer = parseNamespaceLayer(namespace);

      expect(layer).toBe('industry-rag');
    });

    it('should parse customer namespace', () => {
      const namespace = 'varity-customer-123';
      const layer = parseNamespaceLayer(namespace);

      expect(layer).toBe('customer-data');
    });

    it('should throw error for unknown namespace', () => {
      expect(() => {
        parseNamespaceLayer('invalid-namespace');
      }).toThrow('Unknown namespace prefix');
    });
  });

  describe('validateNamespace', () => {
    it('should validate internal namespace', () => {
      expect(validateNamespace('varity-internal-docs')).toBe(true);
    });

    it('should validate industry namespace', () => {
      expect(validateNamespace('varity-industry-finance-rag')).toBe(true);
    });

    it('should validate customer namespace', () => {
      expect(validateNamespace('varity-customer-123')).toBe(true);
    });

    it('should reject invalid namespace', () => {
      expect(validateNamespace('invalid-namespace')).toBe(false);
      expect(validateNamespace('random-string')).toBe(false);
      expect(validateNamespace('')).toBe(false);
    });
  });

  describe('extractCustomerIdFromNamespace', () => {
    it('should extract customer ID', () => {
      const namespace = 'varity-customer-customer-123';
      const customerId = extractCustomerIdFromNamespace(namespace);

      expect(customerId).toBe('customer-123');
    });

    it('should handle complex customer IDs', () => {
      const namespace = 'varity-customer-merchant-xyz-456';
      const customerId = extractCustomerIdFromNamespace(namespace);

      expect(customerId).toBe('merchant-xyz-456');
    });

    it('should throw error for non-customer namespace', () => {
      expect(() => {
        extractCustomerIdFromNamespace('varity-internal-docs');
      }).toThrow('Not a customer namespace');
    });
  });

  describe('extractIndustryFromNamespace', () => {
    it('should extract industry', () => {
      const namespace = 'varity-industry-finance-rag';
      const industry = extractIndustryFromNamespace(namespace);

      expect(industry).toBe('finance');
    });

    it('should extract different industries', () => {
      expect(extractIndustryFromNamespace('varity-industry-healthcare-rag')).toBe('healthcare');
      expect(extractIndustryFromNamespace('varity-industry-retail-rag')).toBe('retail');
      expect(extractIndustryFromNamespace('varity-industry-iso-rag')).toBe('iso');
    });

    it('should throw error for non-industry namespace', () => {
      expect(() => {
        extractIndustryFromNamespace('varity-customer-123');
      }).toThrow('Not an industry namespace');
    });
  });

  describe('extractCategoryFromNamespace', () => {
    it('should extract category', () => {
      const namespace = 'varity-internal-platform-docs';
      const category = extractCategoryFromNamespace(namespace);

      expect(category).toBe('platform-docs');
    });

    it('should handle multi-part categories', () => {
      const namespace = 'varity-internal-marketing-materials-2024';
      const category = extractCategoryFromNamespace(namespace);

      expect(category).toBe('marketing-materials-2024');
    });

    it('should throw error for non-internal namespace', () => {
      expect(() => {
        extractCategoryFromNamespace('varity-customer-123');
      }).toThrow('Not an internal namespace');
    });
  });

  describe('createNamespaceMetadata', () => {
    it('should create complete metadata', () => {
      const namespace = 'varity-customer-123';
      const metadata = createNamespaceMetadata(namespace);

      expect(metadata.namespace).toBe(namespace);
      expect(metadata.namespaceId).toBeTruthy();
      expect(metadata.namespaceBase64).toBeTruthy();
      expect(metadata.layer).toBe('customer-data');
      expect(metadata.createdAt).toBeGreaterThan(0);
    });

    it('should create metadata for internal namespace', () => {
      const namespace = 'varity-internal-docs';
      const metadata = createNamespaceMetadata(namespace);

      expect(metadata.layer).toBe('varity-internal');
    });

    it('should create metadata for industry namespace', () => {
      const namespace = 'varity-industry-finance-rag';
      const metadata = createNamespaceMetadata(namespace);

      expect(metadata.layer).toBe('industry-rag');
    });

    it('should generate valid hex and base64 encodings', () => {
      const metadata = createNamespaceMetadata('varity-test');

      expect(metadata.namespaceId.length).toBe(NAMESPACE_TOTAL_SIZE * 2); // Hex
      expect(() => Buffer.from(metadata.namespaceBase64, 'base64')).not.toThrow();
    });
  });

  describe('Namespace Isolation', () => {
    it('should generate unique namespaces for different customers', () => {
      const customer1 = generateCustomerNamespace('customer-1');
      const customer2 = generateCustomerNamespace('customer-2');

      expect(customer1).not.toBe(customer2);

      const id1 = generateNamespaceId(customer1);
      const id2 = generateNamespaceId(customer2);

      expect(id1).not.toEqual(id2);
    });

    it('should generate unique namespaces for different industries', () => {
      const finance = generateIndustryNamespace('finance');
      const healthcare = generateIndustryNamespace('healthcare');

      expect(finance).not.toBe(healthcare);

      const id1 = generateNamespaceId(finance);
      const id2 = generateNamespaceId(healthcare);

      expect(id1).not.toEqual(id2);
    });

    it('should ensure layer isolation', () => {
      const internal = generateInternalNamespace('docs');
      const industry = generateIndustryNamespace('finance');
      const customer = generateCustomerNamespace('123');

      const id1 = generateNamespaceId(internal);
      const id2 = generateNamespaceId(industry);
      const id3 = generateNamespaceId(customer);

      // All should be different
      expect(id1).not.toEqual(id2);
      expect(id2).not.toEqual(id3);
      expect(id1).not.toEqual(id3);
    });
  });
});
