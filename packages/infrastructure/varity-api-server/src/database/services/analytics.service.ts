/**
 * Analytics Database Service
 * Handles analytics events and business metrics
 */

import {
  AnalyticsEvent,
  RevenueRecord,
  CustomerMetric,
  TransactionRecord,
  Prisma,
} from '@prisma/client';
import { prisma, paginate, PaginationOptions, PaginationResult } from '../prisma';

export class AnalyticsDatabaseService {
  /**
   * Track analytics event
   */
  async trackEvent(data: {
    eventType: string;
    eventName: string;
    userId?: string;
    sessionId?: string;
    properties?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
    path?: string;
  }): Promise<AnalyticsEvent> {
    return await prisma.analyticsEvent.create({
      data,
    });
  }

  /**
   * Get events with filters
   */
  async getEvents(filters: {
    userId?: string;
    eventType?: string;
    eventName?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<AnalyticsEvent>> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.eventName) where.eventName = filters.eventName;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await paginate<AnalyticsEvent>(
      prisma.analyticsEvent,
      { page: filters.page, limit: filters.limit },
      where
    );
  }

  /**
   * Get event counts grouped by type
   */
  async getEventCounts(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where,
      _count: {
        id: true,
      },
    });
  }

  /**
   * Record revenue
   */
  async recordRevenue(data: {
    amount: number;
    currency?: string;
    status: string;
    source?: string;
    userId?: string;
    metadata?: any;
  }): Promise<RevenueRecord> {
    return await prisma.revenueRecord.create({
      data,
    });
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const records = await prisma.revenueRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const total = await prisma.revenueRecord.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return {
      total: total._sum.amount || 0,
      records,
      count: records.length,
    };
  }

  /**
   * Record customer metric
   */
  async recordCustomerMetric(data: {
    metricType: string;
    value: number;
    period: string;
    periodStart: Date;
    periodEnd: Date;
    metadata?: any;
  }): Promise<CustomerMetric> {
    return await prisma.customerMetric.create({
      data,
    });
  }

  /**
   * Get customer metrics
   */
  async getCustomerMetrics(filters: {
    metricType?: string;
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters.metricType) where.metricType = filters.metricType;
    if (filters.period) where.period = filters.period;

    if (filters.startDate || filters.endDate) {
      where.periodStart = {};
      if (filters.startDate) where.periodStart.gte = filters.startDate;
      if (filters.endDate) where.periodStart.lte = filters.endDate;
    }

    return await prisma.customerMetric.findMany({
      where,
      orderBy: { periodStart: 'asc' },
    });
  }

  /**
   * Record transaction
   */
  async recordTransaction(data: {
    transactionId: string;
    amount: number;
    currency?: string;
    status: string;
    userId?: string;
    metadata?: any;
  }): Promise<TransactionRecord> {
    return await prisma.transactionRecord.create({
      data,
    });
  }

  /**
   * Get transaction analytics
   */
  async getTransactionAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    userId?: string;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [transactions, total, statusCounts] = await Promise.all([
      prisma.transactionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.transactionRecord.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transactionRecord.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      transactions,
      totalAmount: total._sum.amount || 0,
      totalCount: total._count.id,
      byStatus: statusCounts.reduce((acc: any, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
    };
  }

  /**
   * Get KPIs (Key Performance Indicators)
   */
  async getKPIs() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalRevenue, activeUsers, totalDashboards, recentTransactions] = await Promise.all([
      prisma.revenueRecord.aggregate({
        _sum: { amount: true },
        where: {
          status: 'success',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.dashboard.count({
        where: {
          status: 'active',
        },
      }),
      prisma.transactionRecord.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      revenue: {
        total: totalRevenue._sum.amount || 0,
        period: '30d',
      },
      users: {
        active: activeUsers,
        period: '30d',
      },
      dashboards: {
        total: totalDashboards,
      },
      transactions: {
        total: recentTransactions,
        period: '30d',
      },
    };
  }

  /**
   * Get trends for a specific metric
   */
  async getTrends(metric: string, timeframe: string = '30d') {
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : timeframe === '1y' ? 365 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // This would need to be customized based on the specific metric
    return {
      metric,
      timeframe,
      data: [],
    };
  }
}

export const analyticsDatabaseService = new AnalyticsDatabaseService();
export default analyticsDatabaseService;
