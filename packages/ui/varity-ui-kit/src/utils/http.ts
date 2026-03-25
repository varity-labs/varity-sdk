/**
 * HTTP Client for Varity UI Kit
 *
 * Lightweight HTTP client using axios for API communication.
 * No blockchain dependencies - pure HTTP/REST.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { JSONValue } from '@varity-labs/types'

export interface HTTPClientConfig {
  baseURL: string
  apiKey?: string
  timeout?: number
}

export interface HTTPResponse<T = unknown> {
  data: T
  status: number
  statusText: string
}

export class HTTPClient {
  private client: AxiosInstance
  private apiKey?: string

  constructor(config: HTTPClientConfig) {
    this.apiKey = config.apiKey

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add API key
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['x-api-key'] = this.apiKey
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error
          const message = error.response.data?.message || error.response.statusText
          throw new Error(`API Error (${error.response.status}): ${message}`)
        } else if (error.request) {
          // Request made but no response
          throw new Error('API Error: No response from server')
        } else {
          // Error in request setup
          throw new Error(`API Error: ${error.message}`)
        }
      }
    )
  }

  /**
   * Set or update API key
   */
  setAPIKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  /**
   * GET request
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  /**
   * POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  /**
   * PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config)
    return response.data
  }

  /**
   * Upload file using multipart/form-data
   */
  async uploadFile<T = unknown>(url: string, file: File | Blob, additionalData?: Record<string, string | number | boolean>): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      })
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }
}
