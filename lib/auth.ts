"use client"

const AUTH_TOKEN_KEY = "auth_token"
const USER_KEY = "user_data"
const ACTIVE_STORE_SLUG_KEY = "active_store_slug"
const PROFILE_COMPLETED_PREFIX = "profile_completed"

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
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }
  return null
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
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

function getProfileCompletedKey(storeSlug?: string): string {
  return `${PROFILE_COMPLETED_PREFIX}_${storeSlug || "default"}`
}

export function markProfileCompleted(storeSlug?: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(getProfileCompletedKey(storeSlug), "true")
  }
}

export function hasCompletedProfile(storeSlug?: string): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(getProfileCompletedKey(storeSlug)) === "true"
  }
  return false
}
