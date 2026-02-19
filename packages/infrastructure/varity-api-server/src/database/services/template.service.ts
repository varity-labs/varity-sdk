/**
 * Template Database Service
 * Handles all template-related database operations
 */

import { Template, Prisma } from '@prisma/client';
import { prisma, isNotDeleted, paginate, PaginationOptions, PaginationResult } from '../prisma';

export class TemplateDatabaseService {
  /**
   * Create new template
   */
  async create(data: Prisma.TemplateCreateInput): Promise<Template> {
    return await prisma.template.create({
      data,
    });
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<Template | null> {
    return await prisma.template.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * Find template by slug
   */
  async findBySlug(slug: string): Promise<Template | null> {
    return await prisma.template.findFirst({
      where: {
        slug,
        ...isNotDeleted(),
      },
    });
  }

  /**
   * List all active templates
   */
  async listActive(options: PaginationOptions = {}): Promise<PaginationResult<Template>> {
    return await paginate<Template>(
      prisma.template,
      options,
      {
        isActive: true,
        ...isNotDeleted(),
      }
    );
  }

  /**
   * List templates by industry
   */
  async listByIndustry(
    industry: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<Template>> {
    return await paginate<Template>(
      prisma.template,
      options,
      {
        industry,
        isActive: true,
        ...isNotDeleted(),
      }
    );
  }

  /**
   * List featured templates
   */
  async listFeatured(options: PaginationOptions = {}): Promise<PaginationResult<Template>> {
    return await paginate<Template>(
      prisma.template,
      options,
      {
        isFeatured: true,
        isActive: true,
        ...isNotDeleted(),
      }
    );
  }

  /**
   * Get template with full details
   */
  async getTemplateDetails(id: string) {
    return await prisma.template.findFirst({
      where: {
        id,
        ...isNotDeleted(),
      },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            dashboards: true,
            subscriptions: true,
            deployments: true,
          },
        },
      },
    });
  }

  /**
   * Update template
   */
  async update(id: string, data: Prisma.TemplateUpdateInput): Promise<Template> {
    return await prisma.template.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete template
   */
  async delete(id: string): Promise<Template> {
    return await prisma.template.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Search templates
   */
  async search(query: string, options: PaginationOptions = {}): Promise<PaginationResult<Template>> {
    return await paginate<Template>(
      prisma.template,
      options,
      {
        isActive: true,
        ...isNotDeleted(),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      }
    );
  }

  /**
   * Get template customization for user
   */
  async getCustomization(templateId: string, userId: string) {
    return await prisma.templateCustomization.findFirst({
      where: {
        templateId,
        userId,
      },
    });
  }

  /**
   * Create or update template customization
   */
  async upsertCustomization(data: {
    templateId: string;
    userId: string;
    branding?: any;
    features?: any;
    settings?: any;
  }) {
    // Find existing customization
    const existing = await prisma.templateCustomization.findFirst({
      where: {
        templateId: data.templateId,
        userId: data.userId,
      },
    });

    if (existing) {
      return await prisma.templateCustomization.update({
        where: { id: existing.id },
        data: {
          branding: data.branding,
          features: data.features,
          settings: data.settings,
        },
      });
    } else {
      return await prisma.templateCustomization.create({
        data,
      });
    }
  }

  /**
   * Clone template
   */
  async clone(templateId: string, userId: string, name?: string): Promise<Template> {
    const original = await this.findById(templateId);
    if (!original) {
      throw new Error('Template not found');
    }

    const clonedData: Prisma.TemplateCreateInput = {
      name: name || `${original.name} (Clone)`,
      slug: `${original.slug}-clone-${Date.now()}`,
      description: original.description,
      version: original.version,
      industry: original.industry,
      category: original.category,
      tags: original.tags,
      tier: original.tier,
      monthlyPrice: original.monthlyPrice,
      features: original.features as any,
      defaultConfig: original.defaultConfig as any,
      requirements: original.requirements as any,
      storageConfig: original.storageConfig as any,
      isPublic: false, // Clones are private by default
      creator: {
        connect: { id: userId },
      },
    };

    return await this.create(clonedData);
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(templateId: string) {
    const [deployments, subscriptions, dashboards] = await Promise.all([
      prisma.deployment.count({
        where: { templateId },
      }),
      prisma.subscription.count({
        where: {
          templateId,
          status: 'active',
        },
      }),
      prisma.dashboard.count({
        where: {
          templateId,
          ...isNotDeleted(),
        },
      }),
    ]);

    return {
      totalDeployments: deployments,
      activeSubscriptions: subscriptions,
      activeDashboards: dashboards,
    };
  }

  /**
   * List templates by creator
   */
  async listByCreator(
    creatorId: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<Template>> {
    return await paginate<Template>(
      prisma.template,
      options,
      {
        creatorId,
        ...isNotDeleted(),
      }
    );
  }
}

export const templateDatabaseService = new TemplateDatabaseService();
export default templateDatabaseService;
