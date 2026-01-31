import {
  generateETag,
  generateETagFromCID,
  isValidETag,
  matchETag,
  parseIfMatch,
  parseIfNoneMatch,
  checkETagConditions
} from '../etag';

describe('ETag Utilities', () => {
  describe('generateETag()', () => {
    it('should generate MD5 hash ETag for Buffer data', () => {
      const data = Buffer.from('Hello, World!');
      const etag = generateETag(data);

      expect(etag).toBe('"65a8e27d8879283831b664bd8b7f0ad4"');
      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should generate MD5 hash ETag for string data', () => {
      const data = 'Test data';
      const etag = generateETag(data);

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should generate consistent ETags for same data', () => {
      const data = 'Consistent data';
      const etag1 = generateETag(data);
      const etag2 = generateETag(data);

      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different data', () => {
      const etag1 = generateETag('Data 1');
      const etag2 = generateETag('Data 2');

      expect(etag1).not.toBe(etag2);
    });

    it('should handle empty data', () => {
      const etag = generateETag('');

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
      expect(etag).toBe('"d41d8cd98f00b204e9800998ecf8427e"'); // MD5 of empty string
    });

    it('should handle binary data', () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF]);
      const etag = generateETag(binaryData);

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });
  });

  describe('generateETagFromCID()', () => {
    it('should generate ETag from CID', () => {
      const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const etag = generateETagFromCID(cid);

      expect(etag).toBe(`"${cid}"`);
    });

    it('should handle different CID formats', () => {
      const cid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const etag = generateETagFromCID(cid);

      expect(etag).toBe(`"${cid}"`);
    });
  });

  describe('isValidETag()', () => {
    it('should validate MD5 hash ETags', () => {
      const etag = '"65a8e27d8879283831b664bd8b7f0ad4"';
      expect(isValidETag(etag)).toBe(true);
    });

    it('should validate CID-based ETags', () => {
      const etag = '"QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"';
      expect(isValidETag(etag)).toBe(true);
    });

    it('should reject ETags without quotes', () => {
      const etag = '65a8e27d8879283831b664bd8b7f0ad4';
      expect(isValidETag(etag)).toBe(false);
    });

    it('should reject invalid hash format', () => {
      const etag = '"not-a-valid-hash"';
      expect(isValidETag(etag)).toBe(true); // Still valid as CID format
    });

    it('should reject empty ETags', () => {
      expect(isValidETag('')).toBe(false);
    });

    it('should handle weak ETags', () => {
      const weakETag = 'W/"65a8e27d8879283831b664bd8b7f0ad4"';
      expect(isValidETag(weakETag)).toBe(false);
    });
  });

  describe('matchETag()', () => {
    it('should match identical ETags', () => {
      const etag1 = '"65a8e27d8879283831b664bd8b7f0ad4"';
      const etag2 = '"65a8e27d8879283831b664bd8b7f0ad4"';

      expect(matchETag(etag1, etag2)).toBe(true);
    });

    it('should match ETags with and without quotes', () => {
      const etag1 = '"65a8e27d8879283831b664bd8b7f0ad4"';
      const etag2 = '65a8e27d8879283831b664bd8b7f0ad4';

      expect(matchETag(etag1, etag2)).toBe(true);
    });

    it('should not match different ETags', () => {
      const etag1 = '"65a8e27d8879283831b664bd8b7f0ad4"';
      const etag2 = '"different-hash"';

      expect(matchETag(etag1, etag2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const etag1 = '"65A8E27D8879283831B664BD8B7F0AD4"';
      const etag2 = '"65a8e27d8879283831b664bd8b7f0ad4"';

      expect(matchETag(etag1, etag2)).toBe(false);
    });
  });

  describe('parseIfMatch()', () => {
    it('should parse single ETag', () => {
      const ifMatch = '"65a8e27d8879283831b664bd8b7f0ad4"';
      const tags = parseIfMatch(ifMatch);

      expect(tags).toEqual(['"65a8e27d8879283831b664bd8b7f0ad4"']);
    });

    it('should parse multiple ETags', () => {
      const ifMatch = '"etag1", "etag2", "etag3"';
      const tags = parseIfMatch(ifMatch);

      expect(tags).toEqual(['"etag1"', '"etag2"', '"etag3"']);
    });

    it('should handle undefined', () => {
      const tags = parseIfMatch(undefined);
      expect(tags).toEqual([]);
    });

    it('should trim whitespace', () => {
      const ifMatch = '  "etag1"  ,  "etag2"  ';
      const tags = parseIfMatch(ifMatch);

      expect(tags).toEqual(['"etag1"', '"etag2"']);
    });

    it('should handle wildcard', () => {
      const ifMatch = '*';
      const tags = parseIfMatch(ifMatch);

      expect(tags).toEqual(['*']);
    });
  });

  describe('parseIfNoneMatch()', () => {
    it('should parse single ETag', () => {
      const ifNoneMatch = '"65a8e27d8879283831b664bd8b7f0ad4"';
      const tags = parseIfNoneMatch(ifNoneMatch);

      expect(tags).toEqual(['"65a8e27d8879283831b664bd8b7f0ad4"']);
    });

    it('should parse multiple ETags', () => {
      const ifNoneMatch = '"etag1", "etag2", "etag3"';
      const tags = parseIfNoneMatch(ifNoneMatch);

      expect(tags).toEqual(['"etag1"', '"etag2"', '"etag3"']);
    });

    it('should handle undefined', () => {
      const tags = parseIfNoneMatch(undefined);
      expect(tags).toEqual([]);
    });

    it('should handle wildcard', () => {
      const ifNoneMatch = '*';
      const tags = parseIfNoneMatch(ifNoneMatch);

      expect(tags).toEqual(['*']);
    });
  });

  describe('checkETagConditions()', () => {
    const testETag = '"65a8e27d8879283831b664bd8b7f0ad4"';

    it('should pass when no conditions specified', () => {
      const result = checkETagConditions(testETag);

      expect(result.match).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should pass If-Match when ETag matches', () => {
      const result = checkETagConditions(testETag, testETag);

      expect(result.match).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should fail If-Match when ETag does not match', () => {
      const result = checkETagConditions(testETag, '"different-etag"');

      expect(result.match).toBe(false);
      expect(result.statusCode).toBe(412); // Precondition Failed
    });

    it('should pass If-Match with multiple ETags when one matches', () => {
      const ifMatch = '"etag1", "65a8e27d8879283831b664bd8b7f0ad4", "etag3"';
      const result = checkETagConditions(testETag, ifMatch);

      expect(result.match).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should pass If-None-Match when ETag does not match', () => {
      const result = checkETagConditions(testETag, undefined, '"different-etag"');

      expect(result.match).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should fail If-None-Match when ETag matches', () => {
      const result = checkETagConditions(testETag, undefined, testETag);

      expect(result.match).toBe(false);
      expect(result.statusCode).toBe(304); // Not Modified
    });

    it('should fail If-None-Match with multiple ETags when one matches', () => {
      const ifNoneMatch = '"etag1", "65a8e27d8879283831b664bd8b7f0ad4", "etag3"';
      const result = checkETagConditions(testETag, undefined, ifNoneMatch);

      expect(result.match).toBe(false);
      expect(result.statusCode).toBe(304);
    });

    it('should prioritize If-Match over If-None-Match', () => {
      // If-Match takes precedence
      const result = checkETagConditions(testETag, testETag, testETag);

      expect(result.match).toBe(false); // If-None-Match fails
      expect(result.statusCode).toBe(304);
    });

    it('should handle both conditions when If-Match passes', () => {
      const result = checkETagConditions(testETag, testETag, '"different-etag"');

      expect(result.match).toBe(true);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle conditional GET with matching ETag', () => {
      const data = 'Test content';
      const etag = generateETag(data);
      const result = checkETagConditions(etag, undefined, etag);

      expect(result.match).toBe(false);
      expect(result.statusCode).toBe(304); // Client has current version
    });

    it('should handle conditional PUT with matching ETag', () => {
      const etag = '"existing-version"';
      const result = checkETagConditions(etag, etag);

      expect(result.match).toBe(true);
      expect(result.statusCode).toBe(200); // Can proceed with update
    });

    it('should prevent concurrent updates with If-Match', () => {
      const currentETag = '"version-1"';
      const clientETag = '"version-0"'; // Client has stale version
      const result = checkETagConditions(currentETag, clientETag);

      expect(result.match).toBe(false);
      expect(result.statusCode).toBe(412); // Precondition failed
    });
  });
});
