"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  getUser,
  isAuthenticated,
  removeAuthToken,
  setActiveStoreSlug,
  setAuthToken,
  setUser,
  type User,
} from "@/lib/auth"
import { clearCart } from "@/lib/cart"
import { clearActiveStore, getHostnameStoreSlug, getStoreFromSubdomain, getStoreSlug } from "@/lib/store"

async function resolveStoreForApi(storeSlug?: string) {
  const hostnameSlug = getHostnameStoreSlug()
  const slug = hostnameSlug || storeSlug || getStoreSlug()
  const storeData = (await getStoreFromSubdomain()) || (await api.store.getBySubdomainOptional(slug))?.data
  return {
    slug,
    apiStore: storeData?.subdomain || slug,
  }
}

function normalizeOtpErrorMessage(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("whatsapp otp")) {
    return "Failed to send text message OTP"
  }
  if (lower.includes("whatsapp")) {
    return message.replace(/whatsapp/gi, "text message")
  }
  return message
}

export function useAuth() {
  // Read persisted authentication state after hydration to keep SSR output
  // identical to the first browser render.
  const [user, setUserState] = useState<User | null>(null)
  // Authentication is resolved from localStorage/profile after hydration.
  // Keep protected pages in a loading state until that check completes.
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated() && !user) {
      void fetchProfile()
    } else {
      setIsLoading(false)
    }

    const handleAuthUpdate = () => {
      setUserState(getUser())
    }

    window.addEventListener("storage", handleAuthUpdate)
    window.addEventListener("auth_updated", handleAuthUpdate)
    return () => {
      window.removeEventListener("storage", handleAuthUpdate)
      window.removeEventListener("auth_updated", handleAuthUpdate)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await api.profile.get()
      const userData = response.data || response
      setUser(userData)
      setUserState(userData)
      setError(null)
    } catch (err) {
      console.error("[v0] Error fetching profile:", err)
      setError("Failed to fetch profile")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (phone: string, storeOverride?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const { slug, apiStore } = await resolveStoreForApi(storeOverride)
      setActiveStoreSlug(slug)
      await api.auth.login(phone, apiStore)
      return true
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      setError(normalizeOtpErrorMessage(err?.message || "Login failed"))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (phone: string, otp: string, storeOverride?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const { slug, apiStore } = await resolveStoreForApi(storeOverride)
      setActiveStoreSlug(slug)
      const response = await api.auth.verifyOtp(phone, otp, apiStore)

      const token = response?.token || response?.data?.token || response?.data?.accessToken || response?.accessToken
      let userData = response?.user || response?.data?.user || response?.data

      if (!token) {
        throw new Error("No token received")
      }

      setAuthToken(token)
      if (userData) {
        setUser(userData)
        setUserState(userData)
      } else {
        await fetchProfile()
        userData = getUser()
      }

      window.dispatchEvent(new Event("auth_updated"))
      return { success: true, user: userData }
    } catch (err: any) {
      console.error("[v0] OTP verification error:", err)
      setError(normalizeOtpErrorMessage(err?.message || "OTP verification failed"))
      return { success: false, user: null }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    removeAuthToken()
    clearCart()
    clearActiveStore()
    setUserState(null)
    window.dispatchEvent(new Event("auth_updated"))
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.profile.update(data)
      const userData = response.data || response
      setUser(userData)
      setUserState(userData)
      window.dispatchEvent(new Event("auth_updated"))
      return true
    } catch (err: any) {
      console.error("[v0] Update profile error:", err)
      setError(err.message || "Failed to update profile")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    verifyOtp,
    logout,
    updateProfile,
  }
}
