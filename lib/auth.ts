"use client"

const AUTH_TOKEN_KEY = "auth_token"
const AUTH_TOKEN_ISSUED_AT_KEY = "auth_token_issued_at"
const USER_KEY = "user_data"
const ACTIVE_STORE_SLUG_KEY = "active_store_slug"
const PROFILE_COMPLETED_PREFIX = "profile_completed"
const AUTH_SESSION_TTL_MS = 12 * 60 * 60 * 1000

export interface User {
  _id: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  country?: string
  storeId?: string
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_TOKEN_ISSUED_AT_KEY, Date.now().toString())
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      return null
    }

    const issuedAtRaw = localStorage.getItem(AUTH_TOKEN_ISSUED_AT_KEY)
    const issuedAt = issuedAtRaw ? Number(issuedAtRaw) : NaN
    if (!issuedAtRaw || Number.isNaN(issuedAt) || Date.now() - issuedAt > AUTH_SESSION_TTL_MS) {
      removeAuthToken()
      return null
    }

    return token
  }
  return null
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_TOKEN_ISSUED_AT_KEY)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event("auth_updated"))
  }
}

export function clearAuthSession(): void {
  removeAuthToken()
}

export function setUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem(USER_KEY)
    if (userData) {
      return JSON.parse(userData)
    }
  }
  return null
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

export function setActiveStoreSlug(slug: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVE_STORE_SLUG_KEY, slug)
    window.dispatchEvent(new Event("store_updated"))
  }
}

export function getActiveStoreSlug(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACTIVE_STORE_SLUG_KEY)
  }
  return null
}

function normalizePhone(phone?: string | null): string {
  return phone?.trim().replace(/\s+/g, "") || "unknown"
}

function getProfileCompletedKey(storeSlug?: string, phone?: string | null): string {
  return `${PROFILE_COMPLETED_PREFIX}_${storeSlug || "default"}_${normalizePhone(phone)}`
}

export function markProfileCompleted(storeSlug?: string, phone?: string | null): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(getProfileCompletedKey(storeSlug, phone), "true")
  }
}

export function hasCompletedProfile(storeSlug?: string, phone?: string | null): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(getProfileCompletedKey(storeSlug, phone)) === "true"
  }
  return false
}

export function isAuthSessionExpired(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) {
    return false
  }

  const issuedAtRaw = localStorage.getItem(AUTH_TOKEN_ISSUED_AT_KEY)
  const issuedAt = issuedAtRaw ? Number(issuedAtRaw) : NaN
  return !issuedAtRaw || Number.isNaN(issuedAt) || Date.now() - issuedAt > AUTH_SESSION_TTL_MS
}
