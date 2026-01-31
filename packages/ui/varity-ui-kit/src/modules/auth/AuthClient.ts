/**
 * Auth Client - Authentication operations
 *
 * Handles user authentication via API server (SIWE - Sign-In with Ethereum)
 */

import { HTTPClient } from '../../utils/http'

export interface LoginRequest {
  message: string
  signature: string
}

export interface LoginResponse {
  token: string
  address: string
  expiresIn: number
}

export interface UserProfile {
  address: string
  role: string
  createdAt: string
}

export class AuthClient {
  constructor(private http: HTTPClient) {}

  /**
   * Login with SIWE (Sign-In with Ethereum)
   */
  async login(message: string, signature: string): Promise<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', { message, signature })
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    return this.http.post<void>('/auth/logout')
  }

  /**
   * Get current user profile
   */
  async me(): Promise<UserProfile> {
    return this.http.get<UserProfile>('/auth/me')
  }

  /**
   * Refresh authentication token
   */
  async refresh(): Promise<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/refresh')
  }
}
