/**
 * Storage (File) Database Service
 * Handles 3-layer encrypted storage file tracking
 */

import { File, Prisma } from '@prisma/client';
import { prisma, isNotDeleted, paginate, PaginationOptions, PaginationResult } from '../prisma';

export class StorageDatabaseService {
  /**
   * Create new file record
   */
  async create(data: Prisma.FileCreateInput): Promise<File> {
    return await prisma.file.create({
      data,
    });
  }

  /**
   * Find file by ID
   */
  async findById(id: string): Promise<File | null> {
    return await prisma.file.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Find file by CID
   */
  async findByCid(ipfsCid: string): Promise<File | null> {
    return await prisma.file.findFirst({
      where: {
        ipfsCid,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * List files with filters
   */
  async list(filters: {
    userId?: string;
    dashboardId?: string;
    storageLayer?: string;
    namespace?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<File>> {
    const where: any = { ...isNotDeleted() };

    if (filters.userId) where.userId = filters.userId;
    if (filters.dashboardId) where.dashboardId = filters.dashboardId;
    if (filters.storageLayer) where.storageLayer = filters.storageLayer;
    if (filters.namespace) where.namespace = filters.namespace;

    return await paginate<File>(
      prisma.file,
      { page: filters.page, limit: filters.limit },
      where
    );
  }

  /**
   * Get storage statistics
   */
  async getStats(userId?: string) {
    const where: any = { ...isNotDeleted() };
    if (userId) where.userId = userId;

    const [total, byLayer] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.groupBy({
        by: ['storageLayer'],
        where,
        _sum: {
          fileSize: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const totalSize = await prisma.file.aggregate({
      where,
      _sum: {
        fileSize: true,
      },
    });

    return {
      totalFiles: total,
      totalSize: totalSize._sum.fileSize || BigInt(0),
      byLayer: byLayer.reduce((acc: any, layer: any) => {
        acc[layer.storageLayer] = {
          files: layer._count.id,
          size: layer._sum.fileSize || BigInt(0),
        };
        return acc;
      }, {}),
    };
  }

  /**
   * Soft delete file
   */
  async delete(id: string): Promise<File> {
    return await prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Delete file by CID
   */
  async deleteByCid(ipfsCid: string): Promise<File> {
    return await prisma.file.update({
      where: { ipfsCid },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Update file pinning status
   */
  async updatePinStatus(id: string, isPinned: boolean): Promise<File> {
    return await prisma.file.update({
      where: { id },
      data: { isPinned },
    });
  }

  /**
   * Get files by storage layer
   */
  async getByLayer(
    storageLayer: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<File>> {
    return await paginate<File>(
      prisma.file,
      options,
      {
        storageLayer,
        ...isNotDeleted(),
      }
    );
  }

  /**
   * Get files by namespace
   */
  async getByNamespace(
    namespace: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<File>> {
    return await paginate<File>(
      prisma.file,
      options,
      {
        namespace,
        ...isNotDeleted(),
      }
    );
  }

  /**
   * Update Celestia blob info
   */
  async updateCelestiaInfo(
    id: string,
    celestiaBlobId: string,
    celestiaHeight: bigint
  ): Promise<File> {
    return await prisma.file.update({
      where: { id },
      data: {
        celestiaBlobId,
        celestiaHeight,
      },
    });
  }

  /**
   * Update ZK proof
   */
  async updateZkProof(id: string, zkProof: string, zkProofVerified: boolean = false): Promise<File> {
    return await prisma.file.update({
      where: { id },
      data: {
        zkProof,
        zkProofVerified,
      },
    });
  }

  /**
   * Search files
   */
  async search(
    query: string,
    userId?: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<File>> {
    const where: any = {
      ...isNotDeleted(),
      fileName: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (userId) {
      where.userId = userId;
    }

    return await paginate<File>(prisma.file, options, where);
  }
}

export const storageDatabaseService = new StorageDatabaseService();
export default storageDatabaseService;
