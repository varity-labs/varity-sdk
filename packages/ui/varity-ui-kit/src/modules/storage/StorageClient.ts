/**
 * Storage Client - File storage operations
 *
 * Handles file uploads/downloads via API server (Filecoin/IPFS backend)
 */

import { HTTPClient } from '../../utils/http'

export interface StorageResult {
  cid: string
  gatewayUrl: string
  size: number
  timestamp: number
}

export interface PinResult {
  cid: string
  isPinned: boolean
}

export interface RetrieveOptions {
  decrypt?: boolean
}

export class StorageClient {
  constructor(private http: HTTPClient) {}

  /**
   * Upload file to storage
   */
  async uploadFile(file: File | Blob, metadata?: Record<string, any>): Promise<StorageResult> {
    return this.http.uploadFile<StorageResult>('/storage/upload-file', file, metadata)
  }

  /**
   * Pin content by CID
   */
  async pinCID(cid: string): Promise<PinResult> {
    return this.http.post<PinResult>('/storage/pin', { cid })
  }

  /**
   * Unpin content by CID
   */
  async unpinCID(cid: string): Promise<void> {
    return this.http.post<void>('/storage/unpin', { cid })
  }

  /**
   * List all pinned content
   */
  async listPins(): Promise<string[]> {
    return this.http.get<string[]>('/storage/pins')
  }

  /**
   * Retrieve content by CID
   */
  async retrieve(cid: string, options?: RetrieveOptions): Promise<Blob> {
    const params = options?.decrypt ? { decrypt: true } : {}
    return this.http.get<Blob>(`/storage/retrieve/${cid}`, { params })
  }
}
