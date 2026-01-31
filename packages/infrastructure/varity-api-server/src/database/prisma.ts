/**
 * Prisma Database Client
 * Singleton pattern with connection pooling for production
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.config';

// Prisma Client Options
const prismaOptions: any = {
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
};

// Connection pool settings for production
const connectionPoolSettings = {
  // Maximum number of database connections in the pool
  connection_limit: process.env.DATABASE_CONNECTION_LIMIT
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10)
    : 10,

  // Connection timeout in seconds
  connect_timeout: 30,

  // Pool timeout in seconds
  pool_timeout: 30,
};

// Singleton instance
let prismaInstance: PrismaClient | null = null;

/**
 * Get Prisma Client instance
 * Implements singleton pattern to avoid multiple connections
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient(prismaOptions);

    // Middleware for logging query performance
    if (process.env.NODE_ENV === 'development') {
      prismaInstance.$use(async (params: any, next: any) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();

        logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
        return result;
      });
    }

    // Log successful connection
    logger.info('Prisma Client initialized successfully');
  }

  return prismaInstance;
}

/**
 * Disconnect Prisma Client
 * Call this during graceful shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info('Prisma Client disconnected');
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Execute database transaction
 * Wrapper for Prisma interactive transactions
 */
export async function executeTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getPrismaClient();
  return await prisma.$transaction(async (tx: any) => {
    return await fn(tx as PrismaClient);
  });
}

/**
 * Soft delete utility
 * Sets deletedAt timestamp instead of actually deleting
 */
export async function softDelete<T extends { deletedAt?: Date | null }>(
  model: any,
  where: any
): Promise<T> {
  return await model.update({
    where,
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * Restore soft-deleted record
 */
export async function restoreSoftDeleted<T extends { deletedAt?: Date | null }>(
  model: any,
  where: any
): Promise<T> {
  return await model.update({
    where,
    data: {
      deletedAt: null,
    },
  });
}

/**
 * Check if record is soft-deleted
 */
export function isNotDeleted(): { deletedAt: null } {
  return { deletedAt: null };
}

/**
 * Pagination utility
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: any,
  options: PaginationOptions,
  where: any = {},
  include: any = {}
): Promise<PaginationResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      skip,
      take: limit,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Batch operations utility
 * For efficient bulk operations
 */
export async function batchCreate<T>(
  model: any,
  data: any[],
  batchSize: number = 100
): Promise<number> {
  let count = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const result = await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
    count += result.count;
  }

  return count;
}

/**
 * Upsert multiple records
 * Create or update based on unique constraint
 */
export async function batchUpsert<T>(
  model: any,
  data: any[],
  uniqueField: string
): Promise<number> {
  let count = 0;

  for (const item of data) {
    await model.upsert({
      where: { [uniqueField]: item[uniqueField] },
      update: item,
      create: item,
    });
    count++;
  }

  return count;
}

// Export singleton instance
export const prisma = getPrismaClient();

// Default export
export default prisma;
