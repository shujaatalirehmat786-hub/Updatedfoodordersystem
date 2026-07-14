"use client"

import { api } from "./api"

export interface Store {
  _id: string
  name: string
  subdomain: string
  address?: string
  phone?: string
  logo?: string
  logoUrl?: string
  headerImageUrl?: string
  description?: string
  logoId?: {
    _id?: string
    fileName?: string
    fileUrl?: string
    fileType?: string
  }
  headerImageId?: {
    _id?: string
    fileName?: string
    fileUrl?: string
    fileType?: string
  }
  raw?: any
  orderWebsiteId?: {
    _id?: string
    isEnabled?: boolean
    name?: string
    subDomain?: string
    businessHours?: Array<{
      day: string
      isOpen: boolean
      startTime: string
      endTime: string
    }>
    isFreeParkingAvailable?: boolean
    isPickupAvailable?: boolean
    facebookUrl?: string
    instagramUrl?: string
    twitterUrl?: string
    aboutUs?: string
  }
}

const ACTIVE_STORE_KEY = "active_store"
const ACTIVE_STORE_SLUG_KEY = "active_store_slug"

const TEST_STORE_DOMAIN = "livedatanow.com"

export const KNOWN_STORES: Record<string, Store> = {
  savera: {
    _id: "68c328b7a277614f117d8226",
    name: "Savera",
    subdomain: "savera",
    address: "123 Main Street, City",
    phone: "+1234567890",
    description: "Delicious food delivered to your door",
  },
  jolibee: {
    _id: "68c328b7a277614f117d8227",
    name: "Jollibee",
    subdomain: "jolibee",
    address: "456 Market Street, City",
    phone: "+1234567891",
    description: "Fresh meals and quick service",
  },
}

const DEFAULT_STORE: Store = KNOWN_STORES.savera

function normalizeStorePayload(storeData: any, fallback?: Store | null): Store {
  const website = storeData?.orderWebsiteId || {}
  const subdomain = storeData?.subdomain || website?.subDomain || fallback?.subdomain || DEFAULT_STORE.subdomain

  return {
    _id: storeData?._id || website?._id || fallback?._id || DEFAULT_STORE._id,
    name: storeData?.name || website?.name || fallback?.name || DEFAULT_STORE.name,
    subdomain,
    address: storeData?.address || fallback?.address,
    phone: storeData?.phone || fallback?.phone,
    logo: storeData?.logo || storeData?.logoId?.fileUrl || fallback?.logo,
    logoUrl: storeData?.logoId?.fileUrl || storeData?.logo || fallback?.logoUrl || fallback?.logo,
    headerImageUrl: storeData?.headerImageId?.fileUrl || fallback?.headerImageUrl,
    description: storeData?.description || website?.aboutUs || fallback?.description,
    logoId: storeData?.logoId || fallback?.logoId,
    headerImageId: storeData?.headerImageId || fallback?.headerImageId,
    raw: storeData || fallback?.raw,
    orderWebsiteId: website?.subDomain || website?.name ? website : fallback?.orderWebsiteId,
  }
}

function getHostnameSubdomain(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const hostname = window.location.hostname
  if (!hostname || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return null
  }

  const parts = hostname.split(".").filter(Boolean)
  if (parts.length < 3) {
    return null
  }

  return parts[0] || null
}

export function getHostnameStoreSlug(): string | null {
  if (typeof window === "undefined") {
    return "savera"
  }

  const hostname = window.location.hostname
  if (!hostname || hostname === "localhost") {
    return "savera"
  }

  return getHostnameSubdomain()
}

export function getKnownStore(slug: string | null | undefined): Store | null {
  if (!slug) {
    return null
  }

  return KNOWN_STORES[slug.toLowerCase()] || null
}

export function getKnownStoreHostname(slug: string | null | undefined): string | null {
  const store = getKnownStore(slug)
  if (!store) {
    return null
  }

  return `${store.subdomain}.${TEST_STORE_DOMAIN}`
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

  const hostnameSubdomain = getHostnameStoreSlug()
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
      const storeData = response?.data || response
      if (storeData) {
        const normalizedStore = normalizeStorePayload(storeData, cachedStore)
        setActiveStore(normalizedStore)
        return normalizedStore
      }

      const knownStore = getKnownStore(subdomain)
      if (knownStore) {
        setActiveStore(knownStore)
        return knownStore
      }

      const fallbackStore = cachedStore || DEFAULT_STORE
      setActiveStore(fallbackStore)
      return fallbackStore
    }

    return DEFAULT_STORE
  } catch (error) {
    console.error("[v0] Error in getStoreFromSubdomain:", error)
    if (typeof window !== "undefined") {
      const cachedStore = getActiveStore()
      if (cachedStore) {
        return cachedStore
      }
    }

    return DEFAULT_STORE
  }
}
