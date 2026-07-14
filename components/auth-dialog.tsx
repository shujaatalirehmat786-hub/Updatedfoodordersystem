"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { getActiveStoreSlug, hasCompletedProfile, markProfileCompleted, setActiveStoreSlug } from "@/lib/auth"
import { useStore } from "@/hooks/use-store"
import { ChevronRight, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ClipboardEvent, type KeyboardEvent } from "react"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [store, setStore] = useState(getActiveStoreSlug() || "")
  const [stores, setStores] = useState<Array<{ label: string; value: string; id?: string }>>([])
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"details" | "verify">("details")
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const { login, verifyOtp, isLoading, error, user } = useAuth()
  const { selectStore } = useStore()
  const fallbackStores = [
    { label: "Savera", value: "savera" },
    { label: "Jollibee", value: "jolibee" },
  ]

  useEffect(() => {
    if (open) {
      setStores(fallbackStores)
    }
  }, [open])

  useEffect(() => {
    if (!store) {
      const defaultStore = (stores[0] || fallbackStores[0])?.value || ""
      setStore(getActiveStoreSlug() || defaultStore)
    }
  }, [stores, store])

  const visibleStores = stores.length > 0 ? stores : fallbackStores

  const selectedStoreOption = useMemo(
    () => visibleStores.find((option) => option.value === store) || null,
    [store, visibleStores],
  )

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    setOtp((prev) => {
      const next = Array.from({ length: 6 }, (_, position) => prev[position] || "")
      next[index] = digit
      return next.join("").slice(0, 6)
    })

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) {
      return
    }
    event.preventDefault()
    setOtp(pasted)
    const nextIndex = Math.min(pasted.length, 5)
    otpRefs.current[nextIndex]?.focus()
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await selectStore(store)
      setActiveStoreSlug(store)

      const success = await login(phone, store)
      if (success) {
        setStep("verify")
      } else if (error?.toLowerCase().includes("failed to send sms")) {
        // Backend can still create the OTP session even if SMS delivery is unavailable in test mode.
        setStep("verify")
      }
    } catch {
      return
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await verifyOtp(phone, otp, store)
    if (result?.success) {
      onOpenChange(false)
      setPhone("")
      setOtp("")
      setStep("details")

      const currentUser = result.user || user
      const profileAlreadyCompleted = hasCompletedProfile(store)
      const profileLooksIncomplete = !currentUser?.firstName || !currentUser?.lastName

      if (profileLooksIncomplete && !profileAlreadyCompleted) {
        markProfileCompleted(store)
        router.push("/profile?fromAuth=true")
      }
    }
  }

  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPhone("")
      setOtp("")
      setStep("details")
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-lg"
      >
        <div className="relative mx-auto isolate overflow-hidden rounded-[1.75rem] border border-white/20 bg-white text-zinc-950 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_28%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="relative p-5 sm:p-6">
            <DialogHeader className="mb-5 text-left">
              <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                {step === "verify" ? "Verification" : "Store login"}
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
                {step === "verify" ? "Enter the code" : "Welcome back"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-zinc-500">
                {step === "verify"
                  ? `We sent a 6-digit code to ${phone}.`
                  : "Choose your store and phone number to continue."}
              </DialogDescription>
            </DialogHeader>

              {step === "details" ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="rounded-[1.5rem] border border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Step 1</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-950">Choose a store</p>
                      </div>
                    </div>

                    <Label htmlFor="store" className="text-sm font-medium text-zinc-700">
                      Store name
                    </Label>
                    <div className="mt-3">
                      <div className="relative">
                        <select
                          id="store"
                          value={store}
                          onChange={(e) => setStore(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-4 pr-12 text-base text-zinc-950 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-zinc-50"
                        >
                          {visibleStores.length > 0 ? (
                            visibleStores.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))
                          ) : (
                            <option value="">Select a store</option>
                          )}
                        </select>
                        <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-zinc-400" />
                      </div>
                      {selectedStoreOption ? (
                        <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                          <p className="text-sm font-medium text-orange-700">{selectedStoreOption.label}</p>
                          <p className="mt-1 text-xs text-orange-600/80">Selected store will be used for login and content.</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-zinc-500">Select your store name to continue.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Step 2</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-950">Enter your phone</p>
                      </div>
                      <div className="text-xs text-zinc-500">We will send a secure code</div>
                    </div>

                    <Label htmlFor="phone" className="text-sm font-medium text-zinc-700">
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+923001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-3 rounded-2xl border-zinc-200 bg-white px-4 py-6 shadow-sm"
                    />
                  </div>

                  {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-[0_18px_40px_rgba(9,9,11,0.22)] transition-transform duration-200 hover:-translate-y-0.5 hover:from-zinc-900 hover:to-zinc-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code
                      </>
                    ) : (
                      "Send verification code"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="rounded-[1.5rem] border border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-orange-50 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">Store</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">{selectedStoreOption?.label || store || "Selected store"}</p>
                        <p className="text-sm text-zinc-500">{phone}</p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm">
                        OTP sent
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                    <Label htmlFor="otp" className="text-sm font-medium text-zinc-700">
                      Verification code
                    </Label>
                    <p className="mt-1 text-xs text-zinc-500">Enter the 6-digit code sent to your phone. You can paste it directly.</p>
                    <div className="mt-4 grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            otpRefs.current[index] = el
                          }}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={otp[index] || ""}
                          onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                          disabled={isLoading}
                          className="h-12 rounded-2xl border-zinc-200 bg-zinc-50 text-center text-lg font-semibold shadow-sm transition-all duration-200 focus-visible:scale-[1.03] focus-visible:bg-white"
                        />
                      ))}
                    </div>
                  </div>

                  {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 text-white shadow-[0_18px_40px_rgba(249,115,22,0.24)] transition-transform duration-200 hover:-translate-y-0.5 hover:from-orange-400 hover:to-amber-300"
                    disabled={isLoading || otp.length < 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      "Verify and continue"
                    )}
                  </Button>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      className="font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                      onClick={() => {
                        setStep("details")
                        setOtp("")
                      }}
                      disabled={isLoading}
                    >
                      Change phone or store
                    </button>
                    <button
                      type="button"
                      className="font-medium text-orange-600 transition-colors hover:text-orange-700"
                      onClick={() => login(phone, store)}
                      disabled={isLoading}
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
