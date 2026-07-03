import { create } from 'zustand'

import { authApi } from '@/features/auth/api'
import type { AuthUser, LoginCredentials } from '@/features/auth/types'
import { AUTH_STORAGE_KEY } from '@/shared/lib/constants'

/**
 * Shape written to `localStorage` under `AUTH_STORAGE_KEY`.
 * Kept in sync with `src/shared/api/client.ts`, which reads the same key.
 */
interface PersistedAuthState {
  state: {
    token: string | null
    refreshToken: string | null
    user: AuthUser | null
  }
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  /** Update only the access token (called after a refresh). */
  setAccessToken: (token: string) => void
  logout: () => void
  hydrate: () => void
}

function persistAuth(token: string | null, refreshToken: string | null, user: AuthUser | null): void {
  if (token && user) {
    const payload: PersistedAuthState = { state: { token, refreshToken, user } }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  async login(credentials) {
    const response = await authApi.login(credentials)
    const token = response.access_token
    const refreshToken = response.refresh_token

    // Set token first so apiClient can make authenticated requests
    set({ token, refreshToken, isAuthenticated: true })

    // Fetch the real user profile
    try {
      const user = await authApi.me()
      persistAuth(token, refreshToken, user)
      set({ user })
    } catch {
      // If /me fails, use email as fallback
      const fallbackUser: AuthUser = {
        id: 0,
        names: credentials.username,
        surnames: '',
        email: credentials.username,
        phone: null,
        url: null,
        permissions: [],
        roles: [],
      }
      persistAuth(token, refreshToken, fallbackUser)
      set({ user: fallbackUser })
    }
  },

  setAccessToken(newToken: string) {
    const { refreshToken, user } = get()
    persistAuth(newToken, refreshToken, user)
    set({ token: newToken })
  },

  logout() {
    persistAuth(null, null, null)
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
  },

  hydrate() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as PersistedAuthState
      const { token, refreshToken, user } = parsed.state ?? {}
      if (token && user) {
        set({ token, refreshToken: refreshToken ?? null, user, isAuthenticated: true })
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  },
}))
