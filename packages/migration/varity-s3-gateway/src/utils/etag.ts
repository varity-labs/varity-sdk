import crypto from 'crypto';

/**
 * Generate ETag for S3 objects
 * Uses MD5 hash (same as AWS S3)
 */
export function generateETag(data: Buffer | string): string {
  const hash = crypto.createHash('md5').update(data).digest('hex');
  return `"${hash}"`;
}

/**
 * Generate ETag from CID (for Filecoin/IPFS objects)
 */
export function generateETagFromCID(cid: string): string {
  // Use the CID hash as ETag (already a hash)
  return `"${cid}"`;
}

/**
 * Validate ETag format
 */
export function isValidETag(etag: string): boolean {
  return /^"[a-fA-F0-9]{32}"$/.test(etag) || /^"[a-zA-Z0-9]+"$/.test(etag);
}

/**
 * Compare ETags for conditional requests
 */
export function matchETag(etag1: string, etag2: string): boolean {
  return etag1.replace(/"/g, '') === etag2.replace(/"/g, '');
}

/**
 * Parse If-Match header
 */
export function parseIfMatch(ifMatch: string | undefined): string[] {
  if (!ifMatch) return [];
  return ifMatch.split(',').map(tag => tag.trim());
}

/**
 * Parse If-None-Match header
 */
export function parseIfNoneMatch(ifNoneMatch: string | undefined): string[] {
  if (!ifNoneMatch) return [];
  return ifNoneMatch.split(',').map(tag => tag.trim());
}

/**
 * Check if request matches ETag conditions
 */
export function checkETagConditions(
  etag: string,
  ifMatch?: string,
  ifNoneMatch?: string
): { match: boolean; statusCode: number } {
  // Check If-Match (precondition: resource must match one of the ETags)
  if (ifMatch) {
    const matchTags = parseIfMatch(ifMatch);
    if (matchTags.length > 0 && !matchTags.some(tag => matchETag(tag, etag))) {
      return { match: false, statusCode: 412 }; // Precondition Failed
    }
  }

  // Check If-None-Match (precondition: resource must NOT match any of the ETags)
  if (ifNoneMatch) {
    const noneMatchTags = parseIfNoneMatch(ifNoneMatch);
    if (noneMatchTags.some(tag => matchETag(tag, etag))) {
      return { match: false, statusCode: 304 }; // Not Modified
    }
  }

  return { match: true, statusCode: 200 };
}
