/**
 * Mock HTTP Client for testing
 */

import { HTTPClient, HTTPResponse } from '../../utils/http'

export class MockHTTPClient extends HTTPClient {
  private mockResponses: Map<string, any> = new Map()
  private callHistory: Array<{ method: string; path: string; data?: any }> = []

  constructor() {
    super({
      baseURL: 'http://localhost:3009/api/v1',
      apiKey: 'test-api-key'
    })
  }

  /**
   * Mock a GET response
   */
  mockGet(path: string, response: any): void {
    this.mockResponses.set(`GET:${path}`, response)
  }

  /**
   * Mock a POST response
   */
  mockPost(path: string, response: any): void {
    this.mockResponses.set(`POST:${path}`, response)
  }

  /**
   * Mock a PUT response
   */
  mockPut(path: string, response: any): void {
    this.mockResponses.set(`PUT:${path}`, response)
  }

  /**
   * Mock a DELETE response
   */
  mockDelete(path: string, response: any): void {
    this.mockResponses.set(`DELETE:${path}`, response)
  }

  /**
   * Get call history
   */
  getCallHistory(): Array<{ method: string; path: string; data?: any }> {
    return this.callHistory
  }

  /**
   * Clear call history
   */
  clearHistory(): void {
    this.callHistory = []
  }

  /**
   * Clear all mocks
   */
  clearMocks(): void {
    this.mockResponses.clear()
    this.callHistory = []
  }

  /**
   * Override GET method
   */
  async get<T = any>(path: string): Promise<T> {
    this.callHistory.push({ method: 'GET', path })
    const mockData = this.mockResponses.get(`GET:${path}`)

    if (mockData !== undefined) {
      return mockData
    }

    throw new Error(`No mock response for GET ${path}`)
  }

  /**
   * Override POST method
   */
  async post<T = any>(path: string, data?: any): Promise<T> {
    this.callHistory.push({ method: 'POST', path, data })
    const mockData = this.mockResponses.get(`POST:${path}`)

    if (mockData !== undefined) {
      return mockData
    }

    throw new Error(`No mock response for POST ${path}`)
  }

  /**
   * Override PUT method
   */
  async put<T = any>(path: string, data?: any): Promise<T> {
    this.callHistory.push({ method: 'PUT', path, data })
    const mockData = this.mockResponses.get(`PUT:${path}`)

    if (mockData !== undefined) {
      return mockData
    }

    throw new Error(`No mock response for PUT ${path}`)
  }

  /**
   * Override DELETE method
   */
  async delete<T = any>(path: string): Promise<T> {
    this.callHistory.push({ method: 'DELETE', path })
    const mockData = this.mockResponses.get(`DELETE:${path}`)

    if (mockData !== undefined) {
      return mockData
    }

    throw new Error(`No mock response for DELETE ${path}`)
  }
}

/**
 * Create a mock HTTP client
 */
export function createMockHTTPClient(): MockHTTPClient {
  return new MockHTTPClient()
}
