/**
 * Dashboard Database Service
 * Handles all dashboard-related database operations
 */

import { Dashboard, Prisma, DashboardMetric, DashboardLog } from '@prisma/client';
import { prisma, isNotDeleted, paginate, PaginationOptions, PaginationResult } from '../prisma';

export class DashboardDatabaseService {
  /**
   * Create new dashboard
   */
  async create(data: Prisma.DashboardCreateInput): Promise<Dashboard> {
    return await prisma.dashboard.create({
      data,
    });
  }

  /**
   * Find dashboard by ID
   */
  async findById(id: string): Promise<Dashboard | null> {
    return await prisma.dashboard.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Find dashboard by customer ID (user wallet)
   */
  async findByUserId(userId: string): Promise<Dashboard | null> {
    return await prisma.dashboard.findFirst({
      where: {
        userId,
        status: 'active',
        ...isNotDeleted(),
      },
      include: {
        template: true,
        user: {
          select: {
            walletAddress: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  /**
   * List dashboards with pagination and filters
   */
  async list(filters: {
    status?: string;
    industry?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<Dashboard>> {
    const where: any = { ...isNotDeleted() };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.industry) {
      where.template = {
        industry: filters.industry,
      };
    }

    return await paginate<Dashboard>(
      prisma.dashboard,
      { page: filters.page, limit: filters.limit },
      where,
      {
        template: true,
        user: {
          select: {
            walletAddress: true,
            email: true,
            displayName: true,
          },
        },
      }
    );
  }

  /**
   * Get dashboard with full details
   */
  async getDashboardDetails(id: string) {
    return await prisma.dashboard.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
      include: {
        template: true,
        user: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
            displayName: true,
          },
        },
        metrics: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        logs: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            files: true,
            metrics: true,
            logs: true,
          },
        },
      },
    });
  }

  /**
   * Update dashboard configuration
   */
  async updateConfig(id: string, config: any): Promise<Dashboard> {
    return await prisma.dashboard.update({
      where: { id },
      data: { config },
    });
  }

  /**
   * Update dashboard status
   */
  async updateStatus(id: string, status: string): Promise<Dashboard> {
    return await prisma.dashboard.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Scale dashboard to different tier
   */
  async scale(id: string, tier: string): Promise<Dashboard> {
    return await prisma.dashboard.update({
      where: { id },
      data: { tier },
    });
  }

  /**
   * Soft delete dashboard (deactivate)
   */
  async deactivate(id: string): Promise<Dashboard> {
    return await prisma.dashboard.update({
      where: { id },
      data: {
        status: 'deactivated',
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Add dashboard metric
   */
  async addMetric(data: {
    dashboardId: string;
    metricType: string;
    value: number;
    unit: string;
    metadata?: any;
  }): Promise<DashboardMetric> {
    return await prisma.dashboardMetric.create({
      data,
    });
  }

  /**
   * Get dashboard metrics
   */
  async getMetrics(dashboardId: string, metricType?: string): Promise<DashboardMetric[]> {
    const where: any = { dashboardId };
    if (metricType) {
      where.metricType = metricType;
    }

    return await prisma.dashboardMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get metrics aggregated by time
   */
  async getMetricsAggregated(dashboardId: string, metricType: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await prisma.dashboardMetric.findMany({
      where: {
        dashboardId,
        metricType,
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add dashboard log
   */
  async addLog(data: {
    dashboardId: string;
    level: string;
    message: string;
    source?: string;
    metadata?: any;
    stackTrace?: string;
  }): Promise<DashboardLog> {
    return await prisma.dashboardLog.create({
      data,
    });
  }

  /**
   * Get dashboard logs with filters
   */
  async getLogs(filters: {
    dashboardId: string;
    level?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<DashboardLog[]> {
    const where: any = { dashboardId: filters.dashboardId };

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.dashboardLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  /**
   * Update storage usage
   */
  async updateStorageUsage(id: string, storageUsed: bigint): Promise<Dashboard> {
    return await prisma.dashboard.update({
      where: { id },
      data: { storageUsed },
    });
  }

  /**
   * Update compute usage
   */
  async updateComputeUsage(id: string, computeUsed: bigint): Promise<Dashboard> {
    return await prisma.dashboard.update({
      where: { id },
      data: { computeUsed },
    });
  }

  /**
   * Get dashboard resource usage
   */
  async getResourceUsage(id: string) {
    const dashboard = await this.findById(id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    return {
      storage: {
        used: dashboard.storageUsed,
        limit: dashboard.storageLimit,
        percentage: Number((dashboard.storageUsed * BigInt(100)) / dashboard.storageLimit),
      },
      compute: {
        used: dashboard.computeUsed,
        limit: dashboard.computeLimit,
        percentage: Number((dashboard.computeUsed * BigInt(100)) / dashboard.computeLimit),
      },
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(dashboardId: string) {
    const [metricCount, logCount, fileCount, lastLog] = await Promise.all([
      prisma.dashboardMetric.count({ where: { dashboardId } }),
      prisma.dashboardLog.count({ where: { dashboardId } }),
      prisma.file.count({
        where: {
          dashboardId,
          ...isNotDeleted(),
        },
      }),
      prisma.dashboardLog.findFirst({
        where: { dashboardId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalMetrics: metricCount,
      totalLogs: logCount,
      totalFiles: fileCount,
      lastActivity: lastLog?.createdAt,
    };
  }
}

export const dashboardDatabaseService = new DashboardDatabaseService();
export default dashboardDatabaseService;
