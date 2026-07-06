"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  clearActiveStore,
  getActiveStore,
  getActiveStoreSlug,
  getStoreFromSubdomain,
  getStoreSlug,
  setActiveStore,
  setActiveStoreSlug,
  type Store,
} from "@/lib/store"

export function useStore() {
  const [store, setStoreState] = useState<Store | null>(() => getActiveStore())
  const [storeSlug, setStoreSlugState] = useState<string | null>(() => getActiveStoreSlug())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const syncStore = () => {
      setStoreState(getActiveStore())
      setStoreSlugState(getActiveStoreSlug())
    }

    const currentSlug = getStoreSlug()
    if (!store || store?.subdomain !== currentSlug) {
      void refreshStore()
    }

    window.addEventListener("storage", syncStore)
    window.addEventListener("store_updated", syncStore)
    return () => {
      window.removeEventListener("storage", syncStore)
      window.removeEventListener("store_updated", syncStore)
    }
  }, [])

  const refreshStore = async () => {
    try {
      setIsLoading(true)
      const storeData = await getStoreFromSubdomain()
      setStoreState(storeData)
      setStoreSlugState(storeData?.subdomain || getActiveStoreSlug())
      setError(null)
      return storeData
    } catch (err: any) {
      setError(err?.message || "Failed to load store")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const selectStore = async (slug: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setActiveStoreSlug(slug)
      const response = await api.store.getBySubdomain(slug)
      const storeData = response.data || response
      setActiveStore(storeData)
      setStoreState(storeData)
      setStoreSlugState(storeData?.subdomain || slug)
      return storeData as Store
    } catch (err: any) {
      setError(err?.message || "Failed to select store")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetStore = () => {
    clearActiveStore()
    setStoreState(null)
    setStoreSlugState(null)
  }

  return {
    store,
    storeSlug,
    isLoading,
    error,
    selectStore,
    refreshStore,
    resetStore,
  }
}
