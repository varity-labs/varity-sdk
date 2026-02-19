/**
 * User Database Service
 * Handles all user-related database operations
 */

import { User, Prisma } from '@prisma/client';
import { prisma, isNotDeleted, paginate, PaginationOptions, PaginationResult } from '../prisma';

export class UserDatabaseService {
  /**
   * Create new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data,
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Find user by wallet address
   */
  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        walletAddress: walletAddress.toLowerCase(),
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Find or create user by wallet address
   */
  async findOrCreate(walletAddress: string, chainId: number = 1): Promise<User> {
    const existing = await this.findByWalletAddress(walletAddress);
    if (existing) {
      return existing;
    }

    return await this.create({
      walletAddress: walletAddress.toLowerCase(),
      chainId,
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update user by wallet address
   */
  async updateByWalletAddress(
    walletAddress: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data,
    });
  }

  /**
   * Update user login timestamp
   */
  async updateLastLogin(walletAddress: string): Promise<User> {
    return await this.updateByWalletAddress(walletAddress, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Soft delete user
   */
  async delete(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * List users with pagination
   */
  async list(options: PaginationOptions): Promise<PaginationResult<User>> {
    return await paginate<User>(prisma.user, options, isNotDeleted());
  }

  /**
   * List active admins
   */
  async listAdmins(): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        isAdmin: true,
        isActive: true,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Check if user is admin
   */
  async isAdmin(walletAddress: string): Promise<boolean> {
    const user = await this.findByWalletAddress(walletAddress);
    return user?.isAdmin === true;
  }

  /**
   * Get user with relations
   */
  async getUserWithRelations(id: string) {
    return await prisma.user.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
      include: {
        dashboards: {
          where: isNotDeleted(),
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          where: {
            status: 'active',
            ...isNotDeleted(),
          },
        },
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [dashboardCount, fileCount, subscriptionCount] = await Promise.all([
      prisma.dashboard.count({
        where: {
          userId,
          ...isNotDeleted(),
        },
      }),
      prisma.file.count({
        where: {
          userId,
          ...isNotDeleted(),
        },
      }),
      prisma.subscription.count({
        where: {
          userId,
          status: 'active',
          ...isNotDeleted(),
        },
      }),
    ]);

    return {
      dashboards: dashboardCount,
      files: fileCount,
      activeSubscriptions: subscriptionCount,
    };
  }
}

export const userDatabaseService = new UserDatabaseService();
export default userDatabaseService;
