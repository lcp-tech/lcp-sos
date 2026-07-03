import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL } from '@/shared/lib/constants'
import { useAuthStore } from '@/shared/stores/auth-store'
import { authApi } from '@/features/auth/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// ---------- Request: inject Bearer token ----------
apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ---------- Response: 401 → try refresh → retry or logout ----------

/** Flag to prevent multiple simultaneous refresh attempts. */
let isRefreshing = false
/** Queue of requests waiting for the refresh to finish. */
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, newToken: string | null) {
  for (const { resolve, reject } of pendingQueue) {
    if (newToken) resolve(newToken)
    else reject(error)
  }
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Skip refresh for login/refresh endpoints or already-retried requests
    const url = originalRequest?.url ?? ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (error.response?.status !== 401 || isAuthRequest || originalRequest._retry) {
      // Non-401 error, or auth endpoint, or already retried → give up
      if (error.response?.status === 401 && !isAuthRequest) {
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      }
      return Promise.reject(error)
    }

    // 401 on a regular request → try refresh
    const { refreshToken } = useAuthStore.getState()

    if (!refreshToken) {
      // No refresh token → logout immediately
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
        originalRequest._retry = true
        return apiClient(originalRequest)
      })
    }

    // Start refresh
    isRefreshing = true
    originalRequest._retry = true

    try {
      const { access_token } = await authApi.refresh(refreshToken)

      // Update the store + localStorage with the new access token
      useAuthStore.getState().setAccessToken(access_token)

      // Retry the original request with the new token
      originalRequest.headers.set('Authorization', `Bearer ${access_token}`)

      // Process any queued requests
      processQueue(null, access_token)

      return apiClient(originalRequest)
    } catch (refreshError) {
      // Refresh failed → logout
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
