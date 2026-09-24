"use client"

import type React from "react"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PhoneCountryInput } from "@/components/phone-country-input"
import { useAuth } from "@/hooks/use-auth"
import { useStore } from "@/hooks/use-store"
import { markProfileCompleted } from "@/lib/auth"
import { DEFAULT_PHONE_COUNTRY, getCountryOption, type PhoneFieldState } from "@/lib/phone"
import { getStoreName } from "@/lib/store"
import type { ClipboardEvent, KeyboardEvent } from "react"

/** Store names are often stored in all caps, which reads badly inside prose. */
function toProseName(name: string): string {
  if (!name || /[a-z]/.test(name)) return name
  return name.toLowerCase().replace(/(^|[\s.\-'])([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase())
}

function createInitialPhoneField(): PhoneFieldState {
  return {
    country: getCountryOption(DEFAULT_PHONE_COUNTRY),
    rawValue: "",
    normalizedValue: "",
    isValid: false,
    isPossible: false,
    error: null,
  }
}

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, verifyOtp, isLoading, error, user, isAuthenticated } = useAuth()
  const { store, refreshStore } = useStore()

  const [mode, setMode] = useState<"new" | "existing">(
    searchParams?.get("mode") === "new" ? "new" : "existing",
  )
  const [phoneField, setPhoneField] = useState<PhoneFieldState>(createInitialPhoneField)
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"details" | "verify">("details")
  const [notice, setNotice] = useState<string | null>(null)
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const otpSubmitInFlightRef = useRef(false)

  const redirectTo = searchParams?.get("redirect") || "/"

  useEffect(() => {
    void refreshStore()
  }, [refreshStore])

  // Someone who is already signed in has no business on this page.
  useEffect(() => {
    if (sessionChecked) return
    setSessionChecked(true)
    if (isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router, sessionChecked])

  const storeName = useMemo(() => getStoreName(store) || "Savera", [store])
  const displayStoreName = toProseName(storeName.replace(/[.,\s]+$/, ""))
  const currentStoreSlug = useMemo(() => store?.subdomain || "savera", [store])

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
    if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
    if (event.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus()
    if (event.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    event.preventDefault()
    setOtp(pasted)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!phoneField.isValid || !phoneField.normalizedValue) {
      setPhoneValidationError(phoneField.error || "Please enter a valid international phone number.")
      return
    }

    try {
      const result = await login(phoneField.normalizedValue, currentStoreSlug)
      if (result.success) {
        setNotice(null)
        setStep("verify")
        return
      }

      if (result.reason === "user_exists" && mode === "new") {
        setNotice(result.message || "This account already exists. Please sign in instead.")
        setMode("existing")
        setStep("details")
      }
    } catch {
      return
    }
  }

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (otpSubmitInFlightRef.current || otp.length < 6) return

    otpSubmitInFlightRef.current = true
    try {
      const result = await verifyOtp(phoneField.normalizedValue, otp, currentStoreSlug)
      if (result?.success) {
        const currentUser = result.user || user
        const successRedirect = mode === "new" ? "/profile?fromAuth=true" : redirectTo

        if (mode === "existing") {
          markProfileCompleted(currentStoreSlug, currentUser?.phone || phoneField.normalizedValue)
        }

        setPhoneField(createInitialPhoneField())
        setOtp("")
        setStep("details")
        router.push(successRedirect)
      }
    } finally {
      otpSubmitInFlightRef.current = false
    }
  }

  const switchMode = (nextMode: "new" | "existing") => {
    setMode(nextMode)
    setStep("details")
    setOtp("")
    setNotice(null)
    setPhoneValidationError(null)
  }

  const heading =
    step === "verify"
      ? "Enter Your Code"
      : mode === "new"
        ? "Create Your Account"
        : "Sign In To Your Account"

  const subtitle =
    step === "verify"
      ? `We sent a 6-digit code to ${phoneField.normalizedValue}.`
      : mode === "new"
        ? "Save your favorites, track your orders and check out faster next time."
        : "Access your orders, saved favorites and personalized shopping experience."

  const eyebrow = step === "verify" ? "Verify your number" : mode === "new" ? "Join us" : "Welcome back"

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="surface-paper py-16 lg:py-28 2xl:py-32">
        <div className="mx-auto w-full max-w-[460px] px-4 sm:px-6">
          {/* Sign-in card */}
          <div className="rounded-[20px] bg-card p-8 shadow-[0_18px_50px_rgba(17,17,17,0.08)] sm:p-10">
            <div className="flex flex-col items-center text-center">
              <span className="eyebrow eyebrow-center whitespace-nowrap">{eyebrow}</span>
              <h1 className="mt-4 font-display text-[28px] font-semibold leading-tight text-ink sm:text-[32px] dark:text-foreground">
                {heading}
              </h1>
              <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">{subtitle}</p>
            </div>

            {notice && (
              <p className="mt-6 rounded-[12px] bg-brand-soft px-4 py-3 text-[14px] leading-[1.5] text-brand">
                {notice}
              </p>
            )}

            {step === "details" ? (
              <form onSubmit={handlePhoneSubmit} className="mt-8 space-y-5">
                <PhoneCountryInput
                  id="signin-phone"
                  label="Phone Number"
                  value={phoneField.rawValue}
                  countryCode={phoneField.country.code}
                  onChange={(next) => {
                    setPhoneField(next)
                    setPhoneValidationError(null)
                  }}
                  disabled={isLoading}
                  error={phoneValidationError || error}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-brand px-8 py-4 text-[16px] text-white transition-colors hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === "new" ? "Create Account" : "Sign In"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>

                <p className="text-center text-[13px] leading-[1.6] text-muted-foreground">
                  We'll text you a 6-digit code to confirm it's you.
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="mt-8 space-y-5">
                <div>
                  <span className="mb-3 block text-center text-[14px] font-medium text-ink dark:text-foreground">
                    Verification Code
                  </span>
                  <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        ref={(node) => {
                          otpRefs.current[index] = node
                        }}
                        value={otp[index] || ""}
                        onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        aria-label={`Digit ${index + 1}`}
                        className="h-[52px] w-[46px] rounded-[12px] bg-cream-light text-center text-[20px] font-semibold text-ink outline-none transition-colors focus:ring-2 focus:ring-brand/40 dark:bg-secondary dark:text-foreground"
                      />
                    ))}
                  </div>
                  {error && <p className="mt-3 text-center text-[13px] text-destructive">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-brand px-8 py-4 text-[16px] text-white transition-colors hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify &amp; Continue
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("details")
                    setOtp("")
                  }}
                  className="block w-full text-center text-[14px] text-brand transition-colors hover:text-brand-dark"
                >
                  Use a different number
                </button>
              </form>
            )}
          </div>

          {/* Mode switch */}
          {step === "details" && (
            <div className="mt-12">
              <div className="mx-auto h-px w-full max-w-[280px] bg-line dark:bg-border" />
              <div className="mt-8 text-center">
                <p className="font-display text-[20px] font-semibold text-ink dark:text-foreground">
                  {mode === "new" ? "Already have an account?" : `New to ${displayStoreName}?`}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.6] text-muted-foreground">
                  {mode === "new"
                    ? "Sign in to pick up right where you left off."
                    : "Create an account to save your favorites, track orders and order faster."}
                </p>
                <button
                  type="button"
                  onClick={() => switchMode(mode === "new" ? "existing" : "new")}
                  className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-brand px-8 py-3.5 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
                >
                  {mode === "new" ? "Sign In" : "Create An Account"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
