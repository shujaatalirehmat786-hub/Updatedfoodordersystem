"use client"

import { api } from "./api"

export interface Store {
  _id: string
  name: string
  subdomain: string
  address?: string
  phone?: string
  logo?: string
  description?: string
}

const ACTIVE_STORE_KEY = "active_store"
const ACTIVE_STORE_SLUG_KEY = "active_store_slug"

const MOCK_STORE: Store = {
  _id: "68c328b7a277614f117d8226",
  name: "Flavors Restaurant",
  subdomain: "flavors",
  address: "123 Main Street, City",
  phone: "+1234567890",
  description: "Delicious food delivered to your door",
}

function getHostnameSubdomain(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const hostname = window.location.hostname
  if (!hostname || hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return null
  }

  const parts = hostname.split(".").filter(Boolean)
  if (parts.length < 3) {
    return null
  }

  return parts[0] || null
}

export function setActiveStoreSlug(slug: string): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(ACTIVE_STORE_SLUG_KEY, slug)
  window.dispatchEvent(new Event("store_updated"))
}

export function getActiveStoreSlug(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem(ACTIVE_STORE_SLUG_KEY)
}

export function setActiveStore(store: Store): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(store))
  localStorage.setItem(ACTIVE_STORE_SLUG_KEY, store.subdomain)
  window.dispatchEvent(new Event("store_updated"))
}

export function getActiveStore(): Store | null {
  if (typeof window === "undefined") {
    return null
  }

  const storeData = localStorage.getItem(ACTIVE_STORE_KEY)
  if (!storeData) {
    return null
  }

  try {
    return JSON.parse(storeData) as Store
  } catch {
    return null
  }
}

export function clearActiveStore(): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(ACTIVE_STORE_KEY)
  localStorage.removeItem(ACTIVE_STORE_SLUG_KEY)
  window.dispatchEvent(new Event("store_updated"))
}

export function getStoreSlug(): string {
  if (typeof window === "undefined") {
    return "savera"
  }

  const hostnameSubdomain = getHostnameSubdomain()
  if (hostnameSubdomain) {
    return hostnameSubdomain
  }

  return getActiveStoreSlug() || "savera"
}

export async function getStoreFromSubdomain(): Promise<Store | null> {
  try {
    if (typeof window !== "undefined") {
      const subdomain = getStoreSlug()
      const cachedStore = getActiveStore()
      if (cachedStore && cachedStore.subdomain === subdomain) {
        return cachedStore
      }

      const response = await api.store.getBySubdomainOptional(subdomain)
      if (!response) {
        const cachedStore = getActiveStore()
        return cachedStore || MOCK_STORE
      }
      const storeData = response.data || response
      setActiveStore(storeData)
      return storeData
    }

    return MOCK_STORE
  } catch (error) {
    console.error("[v0] Error in getStoreFromSubdomain:", error)
    if (typeof window !== "undefined") {
      const cachedStore = getActiveStore()
      if (cachedStore) {
        return cachedStore
      }
    }

    return MOCK_STORE
  }
}
