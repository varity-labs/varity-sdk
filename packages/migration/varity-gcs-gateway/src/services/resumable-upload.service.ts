/**
 * Resumable Upload Service for GCS Gateway
 * Implements GCS-compatible resumable upload protocol
 */

import { v4 as uuidv4 } from 'uuid';
import { ResumableUploadSession } from '../types';

export class ResumableUploadService {
  private sessions: Map<string, ResumableUploadSession> = new Map();
  private readonly SESSION_EXPIRY_HOURS = 24;

  /**
   * Initiate a resumable upload session
   */
  initiateUpload(
    bucket: string,
    objectName: string,
    contentType?: string,
    metadata?: Record<string, string>,
    totalSize?: number
  ): ResumableUploadSession {
    const uploadId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    const session: ResumableUploadSession = {
      uploadId,
      bucket,
      objectName,
      uploadUrl: this.generateUploadUrl(uploadId),
      bytesReceived: 0,
      totalSize,
      createdAt: now,
      expiresAt,
      metadata,
      contentType,
      chunks: []
    };

    this.sessions.set(uploadId, session);

    // Clean up expired sessions
    this.cleanupExpiredSessions();

    return session;
  }

  /**
   * Upload a chunk of data
   */
  uploadChunk(
    uploadId: string,
    data: Buffer,
    contentRange: string
  ): {
    success: boolean;
    bytesReceived: number;
    complete: boolean;
    session?: ResumableUploadSession;
  } {
    const session = this.sessions.get(uploadId);

    if (!session) {
      throw new Error('Upload session not found or expired');
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(uploadId);
      throw new Error('Upload session expired');
    }

    // Parse content range: "bytes start-end/total"
    const rangeMatch = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+|\*)/);
    if (!rangeMatch) {
      throw new Error('Invalid Content-Range header');
    }

    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const total = rangeMatch[3] === '*' ? undefined : parseInt(rangeMatch[3]);

    // Validate range
    if (start !== session.bytesReceived) {
      throw new Error(
        `Invalid range. Expected start: ${session.bytesReceived}, got: ${start}`
      );
    }

    if (end - start + 1 !== data.length) {
      throw new Error('Data length does not match Content-Range');
    }

    // Store chunk
    session.chunks.push(data);
    session.bytesReceived = end + 1;

    if (total !== undefined) {
      session.totalSize = total;
    }

    // Check if upload is complete
    const complete = session.totalSize !== undefined &&
                     session.bytesReceived >= session.totalSize;

    if (complete) {
      // Upload is complete, keep session for retrieval
      return {
        success: true,
        bytesReceived: session.bytesReceived,
        complete: true,
        session
      };
    }

    return {
      success: true,
      bytesReceived: session.bytesReceived,
      complete: false
    };
  }

  /**
   * Get upload session status
   */
  getUploadStatus(uploadId: string): {
    bytesReceived: number;
    complete: boolean;
  } | null {
    const session = this.sessions.get(uploadId);

    if (!session) {
      return null;
    }

    const complete = session.totalSize !== undefined &&
                     session.bytesReceived >= session.totalSize;

    return {
      bytesReceived: session.bytesReceived,
      complete
    };
  }

  /**
   * Get completed upload data
   */
  getCompletedUpload(uploadId: string): Buffer | null {
    const session = this.sessions.get(uploadId);

    if (!session) {
      return null;
    }

    const complete = session.totalSize !== undefined &&
                     session.bytesReceived >= session.totalSize;

    if (!complete) {
      return null;
    }

    // Combine all chunks
    return Buffer.concat(session.chunks);
  }

  /**
   * Cancel upload session
   */
  cancelUpload(uploadId: string): boolean {
    return this.sessions.delete(uploadId);
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(uploadId: string): {
    contentType?: string;
    metadata?: Record<string, string>;
    bucket: string;
    objectName: string;
  } | null {
    const session = this.sessions.get(uploadId);

    if (!session) {
      return null;
    }

    return {
      contentType: session.contentType,
      metadata: session.metadata,
      bucket: session.bucket,
      objectName: session.objectName
    };
  }

  /**
   * Generate upload URL
   */
  private generateUploadUrl(uploadId: string): string {
    // In production, this would be the full URL with domain
    return `/upload/storage/v1/b/resumable?upload_id=${uploadId}`;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();

    for (const [uploadId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(uploadId);
      }
    }
  }

  /**
   * Get active session count (for monitoring)
   */
  getActiveSessionCount(): number {
    this.cleanupExpiredSessions();
    return this.sessions.size;
  }
}
