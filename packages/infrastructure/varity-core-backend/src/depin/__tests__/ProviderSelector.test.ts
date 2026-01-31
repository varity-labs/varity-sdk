/**
 * Provider Selector Tests
 */

import ProviderSelector, {
  ProviderBid,
  ProviderInfo,
  SelectionCriteria,
} from '../ProviderSelector';

describe('ProviderSelector', () => {
  const mockBids: ProviderBid[] = [
    {
      provider: 'akash1provider1',
      price: { denom: 'uakt', amount: '100' },
      bidId: 'akash1provider1/100/1/1',
      createdAt: Date.now(),
    },
    {
      provider: 'akash1provider2',
      price: { denom: 'uakt', amount: '150' },
      bidId: 'akash1provider2/100/1/1',
      createdAt: Date.now(),
    },
    {
      provider: 'akash1provider3',
      price: { denom: 'uakt', amount: '200' },
      bidId: 'akash1provider3/100/1/1',
      createdAt: Date.now(),
    },
  ];

  const mockProviders = new Map<string, ProviderInfo>([
    [
      'akash1provider1',
      {
        address: 'akash1provider1',
        hostUri: 'https://provider1.akash.network',
        attributes: {
          host: 'akash',
          region: 'us-west',
          tier: 'community',
          audited: true,
        },
        reputation: {
          uptime: 99,
          responseTime: 100,
          totalDeployments: 1000,
        },
      },
    ],
    [
      'akash1provider2',
      {
        address: 'akash1provider2',
        hostUri: 'https://provider2.akash.network',
        attributes: {
          host: 'akash',
          region: 'us-east',
          tier: 'community',
          audited: false,
        },
        reputation: {
          uptime: 95,
          responseTime: 200,
          totalDeployments: 500,
        },
      },
    ],
    [
      'akash1provider3',
      {
        address: 'akash1provider3',
        hostUri: 'https://provider3.akash.network',
        attributes: {
          host: 'akash',
          region: 'eu-west',
          tier: 'verified',
          audited: true,
        },
        reputation: {
          uptime: 98,
          responseTime: 150,
          totalDeployments: 800,
        },
      },
    ],
  ]);

  describe('selectBestProvider', () => {
    it('should select provider based on multiple criteria', () => {
      const criteria: SelectionCriteria = {
        preferAudited: true,
        minUptime: 95,
        preferredRegions: ['us-west', 'us-east'],
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        criteria
      );

      expect(selected).not.toBeNull();
      expect(selected!.provider.address).toBe('akash1provider1');
      expect(selected!.score).toBeGreaterThan(0);
    });

    it('should prefer audited providers when specified', () => {
      const criteria: SelectionCriteria = {
        preferAudited: true,
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        criteria
      );

      expect(selected).not.toBeNull();
      const isAudited = selected!.provider.attributes.audited;
      expect(isAudited).toBe(true);
    });

    it('should filter by max price', () => {
      const criteria: SelectionCriteria = {
        maxPrice: 120,
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        criteria
      );

      expect(selected).not.toBeNull();
      const bidAmount = parseInt(selected!.bid.price.amount);
      expect(bidAmount).toBeLessThanOrEqual(120);
    });

    it('should prefer providers in preferred regions', () => {
      const criteria: SelectionCriteria = {
        preferredRegions: ['us-west'],
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        criteria
      );

      expect(selected).not.toBeNull();
      expect(selected!.provider.attributes.region).toBe('us-west');
    });

    it('should filter by minimum uptime', () => {
      const criteria: SelectionCriteria = {
        minUptime: 98,
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        criteria
      );

      expect(selected).not.toBeNull();
      expect(selected!.provider.reputation!.uptime).toBeGreaterThanOrEqual(98);
    });

    it('should return null if no bids available', () => {
      const selected = ProviderSelector.selectBestProvider(
        [],
        mockProviders,
        {}
      );

      expect(selected).toBeNull();
    });

    it('should relax criteria if no eligible bids', () => {
      const strictCriteria: SelectionCriteria = {
        maxPrice: 50, // Too low
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        strictCriteria
      );

      // Should still select a provider by relaxing criteria
      expect(selected).not.toBeNull();
    });
  });

  describe('selectLowestCost', () => {
    it('should select bid with lowest price', () => {
      const lowest = ProviderSelector.selectLowestCost(mockBids);

      expect(lowest).not.toBeNull();
      expect(lowest!.provider).toBe('akash1provider1');
      expect(lowest!.price.amount).toBe('100');
    });

    it('should return null for empty bids', () => {
      const lowest = ProviderSelector.selectLowestCost([]);

      expect(lowest).toBeNull();
    });
  });

  describe('filterByAttributes', () => {
    it('should filter providers by required attributes', () => {
      const filtered = ProviderSelector.filterByAttributes(
        mockBids,
        mockProviders,
        {
          region: 'us-west',
        }
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].provider).toBe('akash1provider1');
    });

    it('should filter by multiple attributes', () => {
      const filtered = ProviderSelector.filterByAttributes(
        mockBids,
        mockProviders,
        {
          region: 'us-west',
          audited: true,
        }
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].provider).toBe('akash1provider1');
    });

    it('should return empty array if no matches', () => {
      const filtered = ProviderSelector.filterByAttributes(
        mockBids,
        mockProviders,
        {
          region: 'asia-east', // No providers in this region
        }
      );

      expect(filtered.length).toBe(0);
    });

    it('should filter out bids with missing provider info', () => {
      const bidsWithUnknown = [
        ...mockBids,
        {
          provider: 'unknown-provider',
          price: { denom: 'uakt', amount: '50' },
          bidId: 'unknown-provider/100/1/1',
          createdAt: Date.now(),
        },
      ];

      const filtered = ProviderSelector.filterByAttributes(
        bidsWithUnknown,
        mockProviders,
        {
          region: 'us-west',
        }
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].provider).not.toBe('unknown-provider');
    });
  });

  describe('scoring', () => {
    it('should score lower price higher', () => {
      const selected1 = ProviderSelector.selectBestProvider(
        [mockBids[0]],
        mockProviders,
        {}
      );
      const selected2 = ProviderSelector.selectBestProvider(
        [mockBids[2]],
        mockProviders,
        {}
      );

      expect(selected1!.score).toBeGreaterThan(selected2!.score);
    });

    it('should score higher uptime higher', () => {
      const criteria: SelectionCriteria = {
        preferAudited: false, // Neutralize audit preference
      };

      const selected = ProviderSelector.selectBestProvider(
        mockBids,
        mockProviders,
        criteria
      );

      // Provider1 has highest uptime (99%)
      expect(selected!.provider.address).toBe('akash1provider1');
    });
  });
});
