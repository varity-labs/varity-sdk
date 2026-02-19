/**
 * Oracle Client - External Data Feeds Integration
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Integrates with Chainlink, Pyth, and custom oracles
 */

import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import { OracleFeed, StorageError } from '../types';
import logger from '../utils/logger';

export interface PriceFeedData {
  feedId: string;
  price: string;
  decimals: number;
  timestamp: number;
  roundId?: string;
}

export interface OracleConfig {
  provider: ethers.Provider;
  chainlinkFeeds?: Record<string, string>; // symbol => address
  pythEndpoint?: string;
  customFeeds?: Record<string, string>;
}

export class OracleClient {
  private provider: ethers.Provider;
  private chainlinkFeeds: Record<string, string>;
  private pythClient?: AxiosInstance;
  private customFeeds: Record<string, string>;

  constructor(config: OracleConfig) {
    this.provider = config.provider;
    this.chainlinkFeeds = config.chainlinkFeeds || {};
    this.customFeeds = config.customFeeds || {};

    if (config.pythEndpoint) {
      this.pythClient = axios.create({
        baseURL: config.pythEndpoint,
        timeout: 5000,
      });
    }

    logger.info('OracleClient initialized', {
      chainlinkFeedsCount: Object.keys(this.chainlinkFeeds).length,
      pythEnabled: !!this.pythClient,
      customFeedsCount: Object.keys(this.customFeeds).length,
    });
  }

  /**
   * Get price from Chainlink oracle
   */
  async getChainlinkPrice(symbol: string): Promise<PriceFeedData> {
    try {
      const feedAddress = this.chainlinkFeeds[symbol];
      if (!feedAddress) {
        throw new StorageError(`Chainlink feed not configured for ${symbol}`);
      }

      logger.info('Fetching Chainlink price...', { symbol, feedAddress });

      // Chainlink Aggregator ABI (minimal)
      const abi = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
        'function decimals() external view returns (uint8)',
      ];

      const priceFeed = new ethers.Contract(feedAddress, abi, this.provider);

      const [roundData, decimals] = await Promise.all([
        priceFeed.latestRoundData(),
        priceFeed.decimals(),
      ]);

      const price = ethers.formatUnits(roundData.answer, decimals);

      const result: PriceFeedData = {
        feedId: `chainlink-${symbol}`,
        price,
        decimals: Number(decimals),
        timestamp: Number(roundData.updatedAt) * 1000,
        roundId: roundData.roundId.toString(),
      };

      logger.info('Chainlink price fetched', {
        symbol,
        price,
        timestamp: new Date(result.timestamp).toISOString(),
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to fetch Chainlink price', {
        error: error.message,
        symbol,
      });
      throw new StorageError('Failed to fetch Chainlink price', error);
    }
  }

  /**
   * Get price from Pyth oracle
   */
  async getPythPrice(symbol: string): Promise<PriceFeedData> {
    try {
      if (!this.pythClient) {
        throw new StorageError('Pyth client not configured');
      }

      logger.info('Fetching Pyth price...', { symbol });

      // Pyth uses price feed IDs (hex strings)
      const pythFeedIds: Record<string, string> = {
        'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
        'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
        // Add more feed IDs as needed
      };

      const feedId = pythFeedIds[symbol];
      if (!feedId) {
        throw new StorageError(`Pyth feed not configured for ${symbol}`);
      }

      const response = await this.pythClient.get(`/api/latest_price_feeds`, {
        params: {
          ids: [feedId],
        },
      });

      const priceData = response.data[0];

      const result: PriceFeedData = {
        feedId: `pyth-${symbol}`,
        price: priceData.price.price,
        decimals: Math.abs(priceData.price.expo),
        timestamp: priceData.price.publish_time * 1000,
      };

      logger.info('Pyth price fetched', {
        symbol,
        price: result.price,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to fetch Pyth price', {
        error: error.message,
        symbol,
      });
      throw new StorageError('Failed to fetch Pyth price', error);
    }
  }

  /**
   * Get price from custom oracle
   */
  async getCustomPrice(feedId: string): Promise<PriceFeedData> {
    try {
      const feedAddress = this.customFeeds[feedId];
      if (!feedAddress) {
        throw new StorageError(`Custom feed not configured: ${feedId}`);
      }

      logger.info('Fetching custom oracle price...', { feedId });

      // Custom oracle implementation (example)
      // In real implementation, query custom oracle contract or API

      const result: PriceFeedData = {
        feedId: `custom-${feedId}`,
        price: '0',
        decimals: 18,
        timestamp: Date.now(),
      };

      logger.info('Custom price fetched', { feedId });

      return result;
    } catch (error: any) {
      logger.error('Failed to fetch custom price', {
        error: error.message,
        feedId,
      });
      throw new StorageError('Failed to fetch custom price', error);
    }
  }

  /**
   * Get aggregated price from multiple oracles
   */
  async getAggregatedPrice(
    symbol: string,
    providers: ('chainlink' | 'pyth' | 'custom')[]
  ): Promise<PriceFeedData> {
    try {
      logger.info('Fetching aggregated price...', {
        symbol,
        providers,
      });

      const pricePromises = providers.map((provider) => {
        switch (provider) {
          case 'chainlink':
            return this.getChainlinkPrice(symbol);
          case 'pyth':
            return this.getPythPrice(symbol);
          case 'custom':
            return this.getCustomPrice(symbol);
        }
      });

      const prices = await Promise.allSettled(pricePromises);

      const validPrices = prices
        .filter((p) => p.status === 'fulfilled')
        .map((p: any) => p.value);

      if (validPrices.length === 0) {
        throw new StorageError('No valid prices from any oracle');
      }

      // Calculate median price
      const priceValues = validPrices.map((p) => parseFloat(p.price));
      priceValues.sort((a, b) => a - b);

      const medianPrice =
        priceValues.length % 2 === 0
          ? (priceValues[priceValues.length / 2 - 1] +
              priceValues[priceValues.length / 2]) /
            2
          : priceValues[Math.floor(priceValues.length / 2)];

      const result: PriceFeedData = {
        feedId: `aggregated-${symbol}`,
        price: medianPrice.toString(),
        decimals: validPrices[0].decimals,
        timestamp: Date.now(),
      };

      logger.info('Aggregated price calculated', {
        symbol,
        price: medianPrice,
        sourcesUsed: validPrices.length,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to fetch aggregated price', {
        error: error.message,
        symbol,
      });
      throw new StorageError('Failed to fetch aggregated price', error);
    }
  }

  /**
   * Subscribe to price updates (polling)
   */
  subscribeToPriceUpdates(
    symbol: string,
    provider: 'chainlink' | 'pyth' | 'custom',
    intervalMs: number,
    callback: (price: PriceFeedData) => void
  ): NodeJS.Timeout {
    logger.info('Subscribing to price updates...', {
      symbol,
      provider,
      intervalMs,
    });

    const fetchPrice = async () => {
      try {
        let price: PriceFeedData;

        switch (provider) {
          case 'chainlink':
            price = await this.getChainlinkPrice(symbol);
            break;
          case 'pyth':
            price = await this.getPythPrice(symbol);
            break;
          case 'custom':
            price = await this.getCustomPrice(symbol);
            break;
        }

        callback(price);
      } catch (error: any) {
        logger.error('Price update failed', {
          error: error.message,
          symbol,
          provider,
        });
      }
    };

    const interval = setInterval(fetchPrice, intervalMs);

    // Fetch immediately
    fetchPrice();

    return interval;
  }

  /**
   * Get multiple prices in batch
   */
  async getBatchPrices(
    requests: Array<{
      symbol: string;
      provider: 'chainlink' | 'pyth' | 'custom';
    }>
  ): Promise<PriceFeedData[]> {
    logger.info('Fetching batch prices...', {
      count: requests.length,
    });

    const prices = await Promise.all(
      requests.map(async ({ symbol, provider }) => {
        try {
          switch (provider) {
            case 'chainlink':
              return await this.getChainlinkPrice(symbol);
            case 'pyth':
              return await this.getPythPrice(symbol);
            case 'custom':
              return await this.getCustomPrice(symbol);
          }
        } catch (error) {
          logger.error('Batch price fetch failed', { symbol, provider });
          return null;
        }
      })
    );

    return prices.filter((p) => p !== null) as PriceFeedData[];
  }

  /**
   * Get historical price data
   */
  async getHistoricalPrices(
    symbol: string,
    fromTimestamp: number,
    toTimestamp: number,
    provider: 'chainlink' | 'pyth' = 'chainlink'
  ): Promise<PriceFeedData[]> {
    logger.info('Fetching historical prices...', {
      symbol,
      from: new Date(fromTimestamp).toISOString(),
      to: new Date(toTimestamp).toISOString(),
      provider,
    });

    // In real implementation, query historical data from oracle
    // Chainlink has getRoundData(roundId) for historical queries
    // Pyth has historical API endpoints

    return [];
  }

  /**
   * Add Chainlink price feed
   */
  addChainlinkFeed(symbol: string, feedAddress: string): void {
    this.chainlinkFeeds[symbol] = feedAddress;
    logger.info('Chainlink feed added', { symbol, feedAddress });
  }

  /**
   * Add custom oracle feed
   */
  addCustomFeed(feedId: string, feedAddress: string): void {
    this.customFeeds[feedId] = feedAddress;
    logger.info('Custom feed added', { feedId, feedAddress });
  }

  /**
   * Get standard Chainlink feeds for Arbitrum
   */
  static getArbitrumChainlinkFeeds(): Record<string, string> {
    return {
      'ETH/USD': '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
      'BTC/USD': '0x6ce185860a4963106506C203335A2910413708e9',
      'USDC/USD': '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3',
      'USDT/USD': '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7',
      'LINK/USD': '0x86E53CF1B870786351Da77A57575e79CB55812CB',
    };
  }

  /**
   * Validate price data freshness
   */
  static isPriceFresh(
    priceData: PriceFeedData,
    maxAgeMs: number = 60000
  ): boolean {
    const age = Date.now() - priceData.timestamp;
    return age <= maxAgeMs;
  }
}

export default OracleClient;
