/**
 * OracleModule Tests
 */

import { OracleModule } from '../OracleModule'
import type { VaritySDK } from '../../../core/VaritySDK'

global.fetch = jest.fn()

describe('OracleModule', () => {
  let oracleModule: OracleModule
  const mockSDK = {
    getAPIEndpoint: () => 'https://api.varity.test',
    getAPIKey: () => 'test-api-key'
  } as VaritySDK

  beforeEach(() => {
    jest.clearAllMocks()
    oracleModule = new OracleModule(mockSDK)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getData', () => {
    it('should get oracle data successfully', async () => {
      const mockData = {
        value: 2000.50,
        timestamp: Date.now(),
        source: 'chainlink',
        confidence: 0.95
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await oracleModule.getData({
        source: 'chainlink',
        parameters: { asset: 'ETH/USD' }
      })

      expect(result.value).toBe(2000.50)
      expect(result.source).toBe('chainlink')
    })

    it('should throw error on failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      })

      await expect(oracleModule.getData({
        source: 'test',
        parameters: {}
      })).rejects.toThrow()
    })
  })

  describe('subscribe', () => {
    it('should subscribe to oracle updates', async () => {
      const mockData = {
        value: 2000,
        timestamp: Date.now(),
        source: 'chainlink'
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      const callback = jest.fn()
      const subscription = await oracleModule.subscribe(
        { source: 'chainlink', parameters: { asset: 'ETH' } },
        callback
      )

      expect(subscription).toHaveProperty('id')
      expect(subscription).toHaveProperty('unsubscribe')

      await subscription.unsubscribe()
    })
  })

  describe('getPrice', () => {
    it('should get asset price', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: 2000,
          timestamp: Date.now(),
          source: 'chainlink'
        })
      })

      const price = await oracleModule.getPrice('ETH')

      expect(price.asset).toBe('ETH')
      expect(price.price).toBe(2000)
      expect(price.currency).toBe('USD')
    })
  })

  describe('getPriceHistory', () => {
    it('should get price history', async () => {
      const mockHistory = {
        asset: 'ETH',
        prices: [
          { price: 1900, timestamp: Date.now() - 86400000 },
          { price: 2000, timestamp: Date.now() }
        ],
        range: {
          start: new Date(Date.now() - 86400000),
          end: new Date()
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      })

      const result = await oracleModule.getPriceHistory('ETH', {
        start: new Date(Date.now() - 86400000),
        end: new Date()
      })

      expect(result.prices).toHaveLength(2)
    })
  })

  describe('removeAllSubscriptions', () => {
    it('should remove all subscriptions', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await oracleModule.removeAllSubscriptions()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
