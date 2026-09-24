"use client"

import { api } from "./api"

export interface Store {
  _id: string
  name: string
  subdomain: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  logoUrl?: string
  headerImageUrl?: string
  description?: string
  currencySymbol?: string
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
    email?: string
    phone?: string
    address?: string
    aboutUs?: string
  }
}

const ACTIVE_STORE_KEY = "active_store"
const ACTIVE_STORE_SLUG_KEY = "active_store_slug"

const TEST_STORE_DOMAIN = "livedatanow.com"
const TEST_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "updatedfoodordersystem.vercel.app",
])

export const KNOWN_STORES: Record<string, Store> = {
  savera: {
    _id: "68c328b7a277614f117d8226",
    name: "Savera",
    subdomain: "savera",
  },
  jolibee: {
    _id: "68c328b7a277614f117d8227",
    name: "Jollibee",
    subdomain: "jolibee",
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
    address: storeData?.address || website?.address,
    phone: storeData?.phone || website?.phone,
    email: storeData?.email || website?.email,
    logo: storeData?.logo || storeData?.logoId?.fileUrl,
    logoUrl: storeData?.logoId?.fileUrl || storeData?.logo,
    headerImageUrl: storeData?.headerImageId?.fileUrl,
    description: storeData?.description || website?.aboutUs,
    currencySymbol: storeData?.currencySymbol || fallback?.currencySymbol,
    logoId: storeData?.logoId,
    headerImageId: storeData?.headerImageId,
    raw: storeData || fallback?.raw,
    orderWebsiteId: website?.subDomain || website?.name || website?.address || website?.phone || website?.email ? website : fallback?.orderWebsiteId,
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
  if (!hostname || TEST_HOSTNAMES.has(hostname)) {
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

/** Slugs the backend has confirmed it does not serve, for this page load. */
const slugsWithoutStore = new Set<string>()

/** Lookups still in flight, so the header, footer and page share one request. */
const storeLookups = new Map<string, Promise<Store | null>>()

async function lookupStoreBySlug(slug: string): Promise<Store | null> {
  if (slugsWithoutStore.has(slug)) {
    return null
  }

  const pending = storeLookups.get(slug)
  if (pending) {
    return pending
  }

  const lookup = (async () => {
    const response = await api.store.getBySubdomainOptional(slug)
    const storeData = response?.data || response
    if (!storeData) {
      return null
    }

    return normalizeStorePayload(storeData, getKnownStore(slug) || getActiveStore() || DEFAULT_STORE)
  })()

  storeLookups.set(slug, lookup)
  try {
    return await lookup
  } finally {
    storeLookups.delete(slug)
  }
}

/**
 * Resolve the store for the address the browser is on.
 *
 * The first label of the hostname is read as a store slug, so
 * savera.livedatanow.com serves Savera and real multi-store subdomains keep
 * working. Most deployments are not shaped that way though — order.example.com,
 * www.example.com, a project's own .vercel.app address — and the backend
 * answers 404 for those. Without a second attempt the app fell back to a bare
 * placeholder carrying nothing but an id and a name, so the live site lost its
 * address, phone, logo, description and social links while still looking
 * broadly right. Retry with the default slug in that case.
 */
export async function getStoreFromSubdomain(): Promise<Store | null> {
  if (typeof window === "undefined") {
    return DEFAULT_STORE
  }

  try {
    const subdomain = getStoreSlug()
    // Once this hostname is known not to name a store, the cached default is
    // the right answer for it — otherwise every caller on the page refetches,
    // because the cached subdomain can never match the hostname.
    const effectiveSlug = slugsWithoutStore.has(subdomain) ? DEFAULT_STORE.subdomain : subdomain
    const cachedStore = getActiveStore()
    if (cachedStore && cachedStore.subdomain === effectiveSlug) {
      return cachedStore
    }

    const hostnameStore = await lookupStoreBySlug(subdomain)
    if (hostnameStore) {
      setActiveStore(hostnameStore)
      return hostnameStore
    }

    const knownStore = getKnownStore(subdomain)
    if (knownStore) {
      setActiveStore(knownStore)
      return knownStore
    }

    if (subdomain !== DEFAULT_STORE.subdomain) {
      const defaultStore = await lookupStoreBySlug(DEFAULT_STORE.subdomain)
      if (defaultStore) {
        // The default slug answering proves the backend is reachable, so the
        // miss on this hostname was a real 404 and not a blip worth retrying.
        slugsWithoutStore.add(subdomain)
        setActiveStore(defaultStore)
        return defaultStore
      }
    }

    const fallbackStore = cachedStore || DEFAULT_STORE
    setActiveStore(fallbackStore)
    return fallbackStore
  } catch (error) {
    console.error("[v0] Error in getStoreFromSubdomain:", error)
    const cachedStore = getActiveStore()
    if (cachedStore) {
      return cachedStore
    }

    return DEFAULT_STORE
  }
}

function firstString(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim()
}

export function getStoreName(store?: Store | null): string | undefined {
  return firstString(store?.name, store?.orderWebsiteId?.name, store?.raw?.name, store?.raw?.orderWebsiteId?.name)
}

export function getStoreDescription(store?: Store | null): string | undefined {
  return firstString(
    store?.description,
    store?.orderWebsiteId?.aboutUs,
    store?.raw?.description,
    store?.raw?.aboutUs,
    store?.raw?.orderWebsiteId?.aboutUs,
  )
}

export function getStorePhone(store?: Store | null): string | undefined {
  return firstString(
    store?.phone,
    store?.orderWebsiteId?.phone,
    store?.raw?.phone,
    store?.raw?.contactPhone,
    store?.raw?.contactNo,
    store?.raw?.contactNumber,
    store?.raw?.phoneNumber,
  )
}

export function getStoreEmail(store?: Store | null): string | undefined {
  return firstString(store?.email, store?.orderWebsiteId?.email, store?.raw?.email, store?.raw?.contactEmail)
}

export function getStoreAddress(store?: Store | null): string | undefined {
  return firstString(
    store?.address,
    store?.orderWebsiteId?.address,
    store?.raw?.address,
    store?.raw?.companyAddress,
    store?.raw?.location,
    store?.raw?.contactAddress,
  )
}

export function getStoreBusinessHours(store?: Store | null): Array<{
  day: string
  isOpen: boolean
  startTime: string
  endTime: string
}> {
  return store?.orderWebsiteId?.businessHours || []
}

export function getStoreSocialLinks(store?: Store | null) {
  return {
    facebookUrl: firstString(store?.orderWebsiteId?.facebookUrl, store?.raw?.facebookUrl, store?.raw?.facebook) || null,
    instagramUrl: firstString(store?.orderWebsiteId?.instagramUrl, store?.raw?.instagramUrl, store?.raw?.instagram) || null,
    twitterUrl: firstString(store?.orderWebsiteId?.twitterUrl, store?.raw?.twitterUrl, store?.raw?.twitter) || null,
  }
}
