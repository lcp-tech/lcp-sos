/** Credentials submitted on the login form. */
export interface LoginCredentials {
  username: string
  password: string
}

/** Authenticated user profile returned by the backend. */
export interface AuthUser {
  id: number
  email: string
  name: string
}

/**
 * Response body of `POST /auth/login`.
 * FastAPI's OAuth2PasswordRequestForm returns snake_case tokens.
 * Axios camelCase conversion is NOT applied because we send form-urlencoded.
 */
export interface LoginResponse {
  access_token: string
  refresh_token: string
}

/** Response body of `POST /auth/refresh`. Only returns a new access_token. */
export interface RefreshResponse {
  access_token: string
  token_type: string
}
