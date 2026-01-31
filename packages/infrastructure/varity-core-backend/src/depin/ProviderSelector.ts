/**
 * Provider Selector - Akash Provider Bid Selection Logic
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Selects the best provider bid based on cost and reliability
 */

import logger from '../utils/logger';

export interface ProviderBid {
  provider: string;
  price: {
    denom: string;
    amount: string;
  };
  bidId: string;
  createdAt: number;
}

export interface ProviderAttributes {
  host?: string;
  tier?: string;
  organization?: string;
  region?: string;
  capabilities?: string[];
  audited?: boolean;
}

export interface ProviderInfo {
  address: string;
  hostUri: string;
  attributes: ProviderAttributes;
  reputation?: {
    uptime: number; // 0-100
    responseTime: number; // ms
    totalDeployments: number;
  };
}

export interface SelectionCriteria {
  maxPrice?: number; // Maximum price in uAKT
  preferAudited?: boolean; // Prefer audited providers
  requiredAttributes?: Partial<ProviderAttributes>;
  preferredRegions?: string[];
  minUptime?: number; // Minimum uptime percentage (0-100)
}

export interface SelectedProvider {
  bid: ProviderBid;
  provider: ProviderInfo;
  score: number;
}

export class ProviderSelector {
  /**
   * Select best provider from bids based on criteria
   */
  static selectBestProvider(
    bids: ProviderBid[],
    providers: Map<string, ProviderInfo>,
    criteria: SelectionCriteria = {}
  ): SelectedProvider | null {
    if (bids.length === 0) {
      logger.warn('No provider bids available');
      return null;
    }

    logger.info('Selecting best provider from bids...', {
      bidCount: bids.length,
      criteria,
    });

    // Filter bids based on criteria
    let eligibleBids = this.filterBids(bids, criteria);

    if (eligibleBids.length === 0) {
      logger.warn('No eligible bids after filtering, relaxing criteria...');
      // Fall back to all bids if filters are too strict
      eligibleBids = bids;
    }

    // Score and rank providers
    const scoredProviders = eligibleBids
      .map(bid => {
        const provider = providers.get(bid.provider);
        if (!provider) {
          logger.warn(`Provider info not found for ${bid.provider}`);
          return null;
        }

        const score = this.scoreProvider(bid, provider, criteria);
        return { bid, provider, score };
      })
      .filter((p): p is SelectedProvider => p !== null)
      .sort((a, b) => b.score - a.score);

    if (scoredProviders.length === 0) {
      logger.error('No valid providers found after scoring');
      return null;
    }

    const selected = scoredProviders[0];

    logger.info('Selected best provider', {
      provider: selected.provider.address,
      bidPrice: selected.bid.price.amount,
      score: selected.score,
      uptime: selected.provider.reputation?.uptime,
    });

    return selected;
  }

  /**
   * Filter bids based on criteria
   */
  private static filterBids(
    bids: ProviderBid[],
    criteria: SelectionCriteria
  ): ProviderBid[] {
    return bids.filter(bid => {
      // Filter by max price
      if (criteria.maxPrice) {
        const bidAmount = parseInt(bid.price.amount);
        if (bidAmount > criteria.maxPrice) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Score provider based on multiple factors
   */
  private static scoreProvider(
    bid: ProviderBid,
    provider: ProviderInfo,
    criteria: SelectionCriteria
  ): number {
    let score = 0;

    // Price score (lower is better) - 40% weight
    const priceScore = this.calculatePriceScore(bid, criteria);
    score += priceScore * 0.4;

    // Uptime score - 30% weight
    const uptimeScore = this.calculateUptimeScore(provider, criteria);
    score += uptimeScore * 0.3;

    // Audit score - 15% weight
    const auditScore = this.calculateAuditScore(provider, criteria);
    score += auditScore * 0.15;

    // Region score - 10% weight
    const regionScore = this.calculateRegionScore(provider, criteria);
    score += regionScore * 0.1;

    // Reputation score - 5% weight
    const reputationScore = this.calculateReputationScore(provider);
    score += reputationScore * 0.05;

    return score;
  }

  /**
   * Calculate price score (0-100, higher is better)
   */
  private static calculatePriceScore(
    bid: ProviderBid,
    criteria: SelectionCriteria
  ): number {
    const bidAmount = parseInt(bid.price.amount);

    // If no max price set, use a reasonable default
    const maxPrice = criteria.maxPrice || bidAmount * 2;

    // Score from 0-100 based on how far below max price
    if (bidAmount >= maxPrice) {
      return 0;
    }

    // Lower price = higher score
    const priceRatio = bidAmount / maxPrice;
    return (1 - priceRatio) * 100;
  }

  /**
   * Calculate uptime score (0-100)
   */
  private static calculateUptimeScore(
    provider: ProviderInfo,
    criteria: SelectionCriteria
  ): number {
    if (!provider.reputation?.uptime) {
      // Default to 50 if no reputation data
      return 50;
    }

    const uptime = provider.reputation.uptime;

    // Check minimum uptime requirement
    if (criteria.minUptime && uptime < criteria.minUptime) {
      return 0;
    }

    // Return uptime directly as it's already 0-100
    return uptime;
  }

  /**
   * Calculate audit score (0-100)
   */
  private static calculateAuditScore(
    provider: ProviderInfo,
    criteria: SelectionCriteria
  ): number {
    const isAudited = provider.attributes.audited || false;

    if (criteria.preferAudited) {
      return isAudited ? 100 : 30;
    }

    return isAudited ? 70 : 50;
  }

  /**
   * Calculate region score (0-100)
   */
  private static calculateRegionScore(
    provider: ProviderInfo,
    criteria: SelectionCriteria
  ): number {
    if (!criteria.preferredRegions || criteria.preferredRegions.length === 0) {
      return 50; // Neutral score if no region preference
    }

    const providerRegion = provider.attributes.region?.toLowerCase();
    if (!providerRegion) {
      return 30; // Lower score if region unknown
    }

    const isPreferred = criteria.preferredRegions.some(
      region => region.toLowerCase() === providerRegion
    );

    return isPreferred ? 100 : 20;
  }

  /**
   * Calculate reputation score (0-100)
   */
  private static calculateReputationScore(provider: ProviderInfo): number {
    if (!provider.reputation) {
      return 50;
    }

    const { totalDeployments, responseTime } = provider.reputation;

    // Score based on deployment history
    let score = 0;

    // More deployments = more reliable
    if (totalDeployments > 1000) {
      score += 50;
    } else if (totalDeployments > 100) {
      score += 40;
    } else if (totalDeployments > 10) {
      score += 30;
    } else {
      score += 20;
    }

    // Response time (lower is better)
    if (responseTime < 100) {
      score += 50;
    } else if (responseTime < 500) {
      score += 40;
    } else if (responseTime < 1000) {
      score += 30;
    } else {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Get lowest cost provider (simple selection)
   */
  static selectLowestCost(bids: ProviderBid[]): ProviderBid | null {
    if (bids.length === 0) {
      return null;
    }

    return bids.reduce((lowest, current) => {
      const lowestAmount = parseInt(lowest.price.amount);
      const currentAmount = parseInt(current.price.amount);
      return currentAmount < lowestAmount ? current : lowest;
    });
  }

  /**
   * Select providers with specific attributes
   */
  static filterByAttributes(
    bids: ProviderBid[],
    providers: Map<string, ProviderInfo>,
    requiredAttributes: Partial<ProviderAttributes>
  ): ProviderBid[] {
    return bids.filter(bid => {
      const provider = providers.get(bid.provider);
      if (!provider) {
        return false;
      }

      // Check each required attribute
      for (const [key, value] of Object.entries(requiredAttributes)) {
        const providerValue = provider.attributes[key as keyof ProviderAttributes];
        if (providerValue !== value) {
          return false;
        }
      }

      return true;
    });
  }
}

export default ProviderSelector;
