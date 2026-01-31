/**
 * Oracle Client - Oracle data feeds
 *
 * Handles oracle queries via API server (MPC oracle backend)
 */

import { HTTPClient } from '../../utils/http'
import { JSONValue, JSONObject } from '@varity-labs/types'

export interface OracleQueryOptions {
  dataType: 'price' | 'weather' | 'custom'
  params: JSONObject
}

export interface OracleResponse {
  value: JSONValue
  timestamp: number
  source: string
  confidence: number
}

export interface PriceData {
  asset: string
  price: number
  currency: string
  timestamp: number
  sources: string[]
}

export class OracleClient {
  constructor(private http: HTTPClient) {}

  /**
   * Query oracle for data
   */
  async query(options: OracleQueryOptions): Promise<OracleResponse> {
    return this.http.post<OracleResponse>('/oracle/query', options)
  }

  /**
   * Get price data
   */
  async getPrice(asset: string, currency: string = 'USD'): Promise<PriceData> {
    return this.http.get<PriceData>('/oracle/price', {
      params: { asset, currency }
    })
  }

  /**
   * Get historical price data
   */
  async getPriceHistory(
    asset: string,
    options: {
      startDate: string
      endDate: string
      interval?: 'hour' | 'day' | 'week'
    }
  ): Promise<Array<{ timestamp: string; price: number }>> {
    return this.http.get<Array<{ timestamp: string; price: number }>>('/oracle/price-history', {
      params: { asset, ...options }
    })
  }
}
