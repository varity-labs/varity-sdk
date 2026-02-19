/**
 * Session Database Service
 * Handles JWT session management in database
 */

import { Session, Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export class SessionDatabaseService {
  /**
   * Create new session
   */
  async create(data: {
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Session> {
    return await prisma.session.create({
      data,
    });
  }

  /**
   * Find session by access token
   */
  async findByAccessToken(accessToken: string): Promise<Session | null> {
    return await prisma.session.findFirst({
      where: {
        accessToken,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    return await prisma.session.findFirst({
      where: {
        refreshToken,
        isActive: true,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Invalidate session (logout)
   */
  async invalidate(accessToken: string): Promise<Session> {
    return await prisma.session.update({
      where: { accessToken },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  /**
   * Delete expired sessions (cleanup)
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<Session[]> {
    return await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update session refresh token
   */
  async updateRefreshToken(
    accessToken: string,
    newRefreshToken: string
  ): Promise<Session> {
    return await prisma.session.update({
      where: { accessToken },
      data: {
        refreshToken: newRefreshToken,
      },
    });
  }
}

export const sessionDatabaseService = new SessionDatabaseService();
export default sessionDatabaseService;
