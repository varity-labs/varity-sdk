export enum MigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED'
}

export enum SourceType {
  AWS_S3 = 'aws-s3',
  GOOGLE_GCS = 'google-gcs'
}

export enum TargetType {
  VARITY_FILECOIN = 'varity-filecoin'
}

export interface MigrationConfig {
  bucket: string;
  prefix?: string;
  region?: string;
  project?: string;
  targetLayer: string;
  concurrency: number;
  dryRun: boolean;
  verify: boolean;
}

export interface MigrationJob {
  id: string;
  source: SourceType;
  target: TargetType;
  config: MigrationConfig;
  status: MigrationStatus;
  progress: MigrationProgress;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface MigrationProgress {
  totalObjects: number;
  totalBytes: number;
  processedObjects: number;
  processedBytes: number;
  failedObjects: number;
  startTime?: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number;
}

export interface ObjectMetadata {
  key: string;
  size: number;
  etag: string;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface MigrationResult {
  key: string;
  success: boolean;
  cid?: string;
  error?: string;
  sourceHash?: string;
  targetHash?: string;
}

export interface Checkpoint {
  jobId: string;
  objectKey: string;
  cid: string;
  timestamp: Date;
}

export interface CostEstimate {
  currentMonthly: number;
  varityMonthly: number;
  savings: number;
  savingsPercent: number;
  storageGB: number;
}

export interface S3Options {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

export interface GCSOptions {
  bucket: string;
  project?: string;
  keyFilename?: string;
}

export interface VarityOptions {
  apiEndpoint?: string;
  ipfsEndpoint?: string;
  targetLayer: string;
  encryptionEnabled?: boolean;
}
