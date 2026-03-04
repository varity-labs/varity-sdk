/**
 * Unit tests for OracleClient
 */

import {
  OracleClient,
  OracleQueryOptions,
  OracleResponse,
  PriceData
} from './OracleClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('OracleClient', () => {
  let mockHttp: MockHTTPClient
  let oracleClient: OracleClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    oracleClient = new OracleClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('query', () => {
    it('should query oracle for data', async () => {
      const mockResponse: OracleResponse = {
        value: 42.5,
        timestamp: Date.now(),
        source: 'chainlink',
        confidence: 0.98
      }

      mockHttp.mockPost('/oracle/query', mockResponse)

      const options: OracleQueryOptions = {
        dataType: 'price',
        params: { asset: 'ETH', currency: 'USD' }
      }

      const result = await oracleClient.query(options)

      expect(result).toEqual(mockResponse)
      expect(result.value).toBe(42.5)
      expect(result.confidence).toBe(0.98)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/oracle/query',
        data: options
      })
    })
  })

  describe('getPrice', () => {
    it('should get price data', async () => {
      const mockPrice: PriceData = {
        asset: 'BTC',
        price: 50000,
        currency: 'USD',
        timestamp: Date.now(),
        sources: ['binance', 'coinbase', 'kraken']
      }

      mockHttp.mockGet('/oracle/price', mockPrice)

      const result = await oracleClient.getPrice('BTC', 'USD')

      expect(result).toEqual(mockPrice)
      expect(result.price).toBe(50000)
      expect(result.sources).toHaveLength(3)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0].method).toBe('GET')
      expect(history[0].path).toBe('/oracle/price')
    })

    it('should get price with default USD currency', async () => {
      const mockPrice: PriceData = {
        asset: 'ETH',
        price: 3000,
        currency: 'USD',
        timestamp: Date.now(),
        sources: ['binance']
      }

      mockHttp.mockGet('/oracle/price', mockPrice)

      const result = await oracleClient.getPrice('ETH')

      expect(result.currency).toBe('USD')
    })
  })

  describe('getPriceHistory', () => {
    it('should get historical price data', async () => {
      const mockHistory = [
        { timestamp: '2025-01-01T00:00:00Z', price: 48000 },
        { timestamp: '2025-01-02T00:00:00Z', price: 49000 },
        { timestamp: '2025-01-03T00:00:00Z', price: 50000 }
      ]

      mockHttp.mockGet('/oracle/price-history', mockHistory)

      const result = await oracleClient.getPriceHistory('BTC', {
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        interval: 'day'
      })

      expect(result).toEqual(mockHistory)
      expect(result).toHaveLength(3)
      expect(result[2].price).toBe(50000)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0].method).toBe('GET')
      expect(history[0].path).toBe('/oracle/price-history')
    })
  })
})
