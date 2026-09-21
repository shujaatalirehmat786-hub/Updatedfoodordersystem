"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  getUser,
  isAuthenticated,
  clearAuthSession,
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

function normalizeLoginErrorMessage(message: string): { message: string; reason?: "user_exists" } {
  const lower = message.toLowerCase()
  if (
    lower.includes("user already exists") ||
    lower.includes("already exists") ||
    lower.includes("already registered") ||
    lower.includes("account already exists")
  ) {
    return {
      message: "This user already exists. Please sign in as an existing user.",
      reason: "user_exists",
    }
  }

  return { message }
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
    const persistedUser = getUser()
    if (persistedUser) {
      setUserState(persistedUser)
    }

    if (isAuthenticated()) {
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

  const fetchProfile = async (): Promise<User | null> => {
    try {
      setIsLoading(true)
      const response = await api.profile.get()
      const userData = response.data || response
      setUser(userData)
      setUserState(userData)
      setError(null)
      return userData
    } catch (err) {
      const status = (err as any)?.status
      if (status === 401 || status === 403) {
        // A stored token the backend no longer accepts is an expected state
        // (the session expired), and it is already handled by signing out.
        // Log it as a warning so it does not surface as a console error.
        console.warn("[v0] Stored session is no longer valid, signing out")
        clearAuthSession()
        setUserState(null)
      } else {
        console.error("[v0] Error fetching profile:", err)
      }
      setError("Failed to fetch profile")
      return null
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
      return { success: true as const }
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      const normalized = normalizeLoginErrorMessage(err?.message || "Login failed")
      setError(normalized.message)
      return { success: false as const, reason: normalized.reason, message: normalized.message }
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
      const authResponse = response as any

      const token = authResponse?.token || authResponse?.data?.token || authResponse?.data?.accessToken || authResponse?.accessToken
      const responseData = authResponse?.data
      let userData =
        authResponse?.user ||
        responseData?.user ||
        responseData?.customer ||
        (responseData?._id && responseData?.phone ? responseData : undefined) ||
        (authResponse?._id && authResponse?.phone ? authResponse : undefined)

      if (!token) {
        throw new Error("No token received")
      }

      setAuthToken(token)
      if (userData) {
        setUser(userData)
        setUserState(userData)
      } else {
        userData = (await fetchProfile()) || getUser()
      }

      if (!userData) {
        throw new Error("Authentication succeeded, but the customer profile could not be loaded")
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
