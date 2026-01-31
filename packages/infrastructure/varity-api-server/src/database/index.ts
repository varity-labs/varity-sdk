/**
 * Database Module Index
 * Export Prisma client and database services
 */

export {
  prisma,
  getPrismaClient,
  disconnectPrisma,
  checkDatabaseHealth,
  executeTransaction,
  softDelete,
  restoreSoftDeleted,
  isNotDeleted,
  paginate,
  batchCreate,
  batchUpsert,
} from './prisma';

export * from './services';
