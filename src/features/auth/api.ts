import axios from 'axios'
import { API_BASE_URL } from '@/shared/lib/constants'
import type { LoginCredentials, LoginResponse, RefreshResponse } from '@/features/auth/types'

/**
 * Dedicated axios instance for auth requests.
 * Does NOT use the main apiClient to avoid circular interceptor issues
 * (the main client's 401 interceptor calls refresh, which would trigger itself).
 */
const authClient = axios.create({ baseURL: API_BASE_URL })

export const authApi = {
  /**
   * Login using OAuth2PasswordRequestForm (form-urlencoded).
   * The backend field is "username" but accepts an email address.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const { data } = await authClient.post<LoginResponse>(
      '/auth/login',
      formData,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return data
  },

  /**
   * Exchange a refresh_token for a new access_token.
   * The refresh_token itself is NOT rotated — it stays the same.
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { data } = await authClient.post<RefreshResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    )
    return data
  },
}
