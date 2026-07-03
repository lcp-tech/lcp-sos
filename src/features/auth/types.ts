/** Credentials submitted on the login form. */
export interface LoginCredentials {
  username: string
  password: string
}

/** Role group from the backend. */
export interface RoleGroup {
  id: number
  title: string
  description: string
}

/** Role assigned to a user. */
export interface UserRole {
  id: number
  title: string
  description: string
  group: RoleGroup
}

/** Authenticated user profile from `GET /bo/users/me`. */
export interface AuthUser {
  id: number
  names: string
  surnames: string
  email: string
  phone: string | null
  url: string | null
  permissions: string[]
  roles: UserRole[]
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
