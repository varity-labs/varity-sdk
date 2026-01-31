import crypto from 'crypto';

export interface AWSSignatureV4Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: Buffer;
}

export interface AWSSignatureV4Result {
  valid: boolean;
  accessKeyId?: string;
  error?: string;
  timestamp: Date;
}

export interface ParsedAuthHeader {
  credential: string;
  accessKeyId: string;
  date: string;
  region: string;
  service: string;
  signedHeaders: string;
  signature: string;
}

/**
 * AWS Signature Version 4 Verifier
 * Implements the complete AWS Signature V4 authentication process
 * https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
 */
export class SignatureV4Verifier {
  /**
   * Verify AWS Signature V4 authentication
   */
  static verify(request: AWSSignatureV4Request, secretAccessKey: string): AWSSignatureV4Result {
    try {
      const authHeader = request.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('AWS4-HMAC-SHA256')) {
        return {
          valid: false,
          error: 'Invalid or missing Authorization header',
          timestamp: new Date()
        };
      }

      // Parse authorization header
      const parsed = this.parseAuthHeader(authHeader);
      const accessKeyId = parsed.credential.split('/')[0];

      // Build canonical request
      const canonicalRequest = this.buildCanonicalRequest(request, parsed.signedHeaders);

      // Build string to sign
      const credentialScope = parsed.credential.substring(parsed.credential.indexOf('/') + 1);
      const stringToSign = this.buildStringToSign(
        request.headers['x-amz-date'] || '',
        credentialScope,
        canonicalRequest
      );

      // Calculate signature
      const signature = this.calculateSignature(
        secretAccessKey,
        request.headers['x-amz-date'] || '',
        parsed.region,
        parsed.service,
        stringToSign
      );

      const valid = signature === parsed.signature;

      return {
        valid,
        accessKeyId: valid ? accessKeyId : undefined,
        error: valid ? undefined : 'Signature mismatch',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        timestamp: new Date()
      };
    }
  }

  /**
   * Parse AWS4-HMAC-SHA256 Authorization header
   */
  private static parseAuthHeader(header: string): ParsedAuthHeader {
    // AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-date, Signature=...
    const parts = header.substring('AWS4-HMAC-SHA256 '.length).split(', ');

    const credentialMatch = parts[0].match(/Credential=([^,]+)/);
    const signedHeadersMatch = parts[1].match(/SignedHeaders=([^,]+)/);
    const signatureMatch = parts[2].match(/Signature=([^,]+)/);

    if (!credentialMatch || !signedHeadersMatch || !signatureMatch) {
      throw new Error('Malformed Authorization header');
    }

    const credential = credentialMatch[1];
    const signedHeaders = signedHeadersMatch[1];
    const signature = signatureMatch[1];

    const credentialParts = credential.split('/');
    if (credentialParts.length !== 5) {
      throw new Error('Invalid credential format');
    }

    return {
      credential,
      accessKeyId: credentialParts[0],
      date: credentialParts[1],
      region: credentialParts[2],
      service: credentialParts[3],
      signedHeaders,
      signature
    };
  }

  /**
   * Build canonical request string
   */
  private static buildCanonicalRequest(
    request: AWSSignatureV4Request,
    signedHeaderNames: string
  ): string {
    const method = request.method.toUpperCase();
    const uri = this.buildCanonicalURI(request.url);
    const queryString = this.buildCanonicalQueryString(request.query || {});
    const canonicalHeaders = this.buildCanonicalHeaders(request.headers, signedHeaderNames);
    const payloadHash = request.headers['x-amz-content-sha256'] || 'UNSIGNED-PAYLOAD';

    return `${method}\n${uri}\n${queryString}\n${canonicalHeaders}\n${signedHeaderNames}\n${payloadHash}`;
  }

  /**
   * Build canonical URI (URL-encoded path)
   */
  private static buildCanonicalURI(url: string): string {
    const path = url.split('?')[0];
    // Encode URI path according to RFC 3986
    return path.split('/').map(segment => encodeURIComponent(segment)).join('/').replace(/%2F/g, '/');
  }

  /**
   * Build canonical query string (sorted and encoded)
   */
  private static buildCanonicalQueryString(query: Record<string, string>): string {
    return Object.keys(query)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&');
  }

  /**
   * Build canonical headers string
   */
  private static buildCanonicalHeaders(
    headers: Record<string, string>,
    signedHeaderNames: string
  ): string {
    const headerNames = signedHeaderNames.split(';');
    return headerNames
      .map(name => {
        const value = headers[name.toLowerCase()] || headers[name] || '';
        return `${name.toLowerCase()}:${value.trim()}`;
      })
      .join('\n') + '\n';
  }

  /**
   * Build string to sign
   */
  private static buildStringToSign(
    date: string,
    credentialScope: string,
    canonicalRequest: string
  ): string {
    const hashedCanonicalRequest = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');

    return `AWS4-HMAC-SHA256\n${date}\n${credentialScope}\n${hashedCanonicalRequest}`;
  }

  /**
   * Calculate AWS Signature V4 signature
   */
  private static calculateSignature(
    secretAccessKey: string,
    date: string,
    region: string,
    service: string,
    stringToSign: string
  ): string {
    const dateStamp = date.substring(0, 8);
    const dateKey = this.hmac(`AWS4${secretAccessKey}`, dateStamp);
    const regionKey = this.hmac(dateKey, region);
    const serviceKey = this.hmac(regionKey, service);
    const signingKey = this.hmac(serviceKey, 'aws4_request');

    return this.hmac(signingKey, stringToSign, 'hex') as string;
  }

  /**
   * HMAC-SHA256 helper
   */
  private static hmac(
    key: string | Buffer,
    data: string,
    encoding?: 'hex'
  ): Buffer | string {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return encoding ? hmac.digest(encoding) : hmac.digest();
  }
}
