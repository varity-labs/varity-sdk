import path from 'path';

const IPFS_IO_GATEWAY = 'https://ipfs.io/ipfs';

/**
 * Build the full IPFS URL for an asset.
 *
 * CIDv0 (`Qm...`) cannot be used as a subdomain, so it falls back to
 * the path-based `ipfs.io` gateway. CIDv1 (`bafy...`) uses the
 * configured subdomain-style backend (e.g. `dweb.link`).
 */
export function buildIpfsUrl(cid: string, assetPath: string, ipfsBackend: string): string {
  if (cid.startsWith('Qm')) {
    return `${IPFS_IO_GATEWAY}/${cid}/${assetPath}`;
  }
  return `https://${cid}.${ipfsBackend}/${assetPath}`;
}

/**
 * Build the IPFS URL for `/index.html` (used for SPA fallback).
 */
export function buildIpfsIndexUrl(cid: string, ipfsBackend: string): string {
  if (cid.startsWith('Qm')) {
    return `${IPFS_IO_GATEWAY}/${cid}/index.html`;
  }
  return `https://${cid}.${ipfsBackend}/index.html`;
}

/**
 * Build a base IPFS URL (no path) for the `/resolve` debug endpoint.
 */
export function buildIpfsBaseUrl(cid: string, ipfsBackend: string): string {
  if (cid.startsWith('Qm')) {
    return `${IPFS_IO_GATEWAY}/${cid}`;
  }
  return `https://${cid}.${ipfsBackend}`;
}

/**
 * Sanitize a URL path to prevent directory traversal attacks.
 *
 * Uses `path.posix.normalize` to collapse sequences like `....//` and
 * `..%2F`, then rejects any remaining `..` segments.
 */
export function sanitizePath(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const normalized = path.posix.normalize(decoded).replace(/^\/+/, '');
  if (normalized === '.' || normalized === '..') return '';
  if (normalized.startsWith('../') || normalized.includes('/../')) return '';
  return normalized;
}
