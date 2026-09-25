"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useStore } from "@/hooks/use-store"
import { getStoreName } from "@/lib/store"

/**
 * Create Account.
 *
 * The registration endpoint does not exist yet, so nothing here talks to the
 * API: the form validates in the browser and then says plainly that the step
 * cannot be completed. It never reports a success it has not had. When the
 * endpoint lands, the only change needed is inside handleSubmit.
 */

type FieldName = "firstName" | "lastName" | "email" | "phone" | "password" | "confirmPassword"

const EMPTY_FORM: Record<FieldName, string> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
}

function Field({
  id,
  label,
  placeholder,
  type = "text",
  value,
  error,
  onChange,
  autoComplete,
}: {
  id: FieldName
  label: string
  placeholder: string
  type?: string
  value: string
  error?: string
  onChange: (value: string) => void
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[15px] font-normal leading-[1.2] text-ink 2xl:text-[18px] dark:text-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2.5 h-[52px] w-full rounded-full bg-cream px-6 text-[15px] text-ink outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40 2xl:mt-[12px] 2xl:h-[59px] 2xl:px-[25px] 2xl:text-[18px] dark:bg-secondary dark:text-foreground ${
          error ? "ring-2 ring-destructive/50" : ""
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default function SignUpPage() {
  const { store } = useStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<FieldName | "agreed", string>>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const storeName = useMemo(() => getStoreName(store) || "Savera", [store])

  const update = (field: FieldName) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setNotice(null)
  }

  const validate = () => {
    const next: Partial<Record<FieldName | "agreed", string>> = {}
    if (!form.firstName.trim()) next.firstName = "Please enter your first name."
    if (!form.lastName.trim()) next.lastName = "Please enter your last name."
    if (!form.email.trim()) next.email = "Please enter your email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Please enter a valid email address."
    if (!form.phone.trim()) next.phone = "Please enter your phone number."
    if (!form.password) next.password = "Please choose a password."
    else if (form.password.length < 8) next.password = "Use at least 8 characters."
    if (!form.confirmPassword) next.confirmPassword = "Please re-enter your password."
    else if (form.confirmPassword !== form.password) next.confirmPassword = "Both passwords must match."
    if (!agreed) next.agreed = "Please accept the Terms & Conditions to continue."
    return next
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setNotice(null)
      return
    }

    // No registration endpoint exists yet, so say so rather than pretending.
    setNotice(
      "Thanks — everything looks right. Account creation is not switched on yet, so this cannot be completed. You can still sign in with your phone number in the meantime.",
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="surface-paper pb-20 pt-6 lg:pb-28 2xl:pb-[120px] 2xl:pt-[22px]">
        {/* The design rules a line under the header on this page only. */}
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="h-px w-full bg-line dark:bg-border" />
        </div>

        <div className="mx-auto mt-12 w-full max-w-[694px] px-4 sm:px-6 2xl:mt-[149px] 2xl:px-0">
          <div className="rounded-[22px] bg-card px-6 py-10 shadow-[0_18px_50px_rgba(17,17,17,0.08)] sm:px-10 2xl:px-14 2xl:pb-[49px] 2xl:pt-[56px]">
            <div className="flex flex-col items-center text-center">
              <span className="eyebrow eyebrow-center whitespace-nowrap">Join {storeName}</span>
              <h1 className="mt-4 font-display text-[26px] font-semibold leading-tight text-ink sm:text-[32px] 2xl:mt-[11px] 2xl:text-[38px] dark:text-foreground">
                Create Your Account
              </h1>
              <p className="mx-auto mt-3 max-w-[610px] text-[14px] leading-[1.6] text-muted-foreground 2xl:-mx-[14px] 2xl:mt-[11px] 2xl:text-[17px]">
                Save your favorites, track orders and enjoy a faster checkout experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5 2xl:mt-[41px] 2xl:space-y-[19px]">
              <div className="grid gap-5 sm:grid-cols-2 2xl:gap-5">
                <Field
                  id="firstName"
                  label="First Name"
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  value={form.firstName}
                  error={errors.firstName}
                  onChange={update("firstName")}
                />
                <Field
                  id="lastName"
                  label="Last Name"
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                  value={form.lastName}
                  error={errors.lastName}
                  onChange={update("lastName")}
                />
              </div>

              <Field
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                autoComplete="email"
                value={form.email}
                error={errors.email}
                onChange={update("email")}
              />

              <Field
                id="phone"
                type="tel"
                label="Phone Number"
                placeholder="Enter your phone number"
                autoComplete="tel"
                value={form.phone}
                error={errors.phone}
                onChange={update("phone")}
              />

              <div className="grid gap-5 sm:grid-cols-2 2xl:gap-5">
                <Field
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  value={form.password}
                  error={errors.password}
                  onChange={update("password")}
                />
                <Field
                  id="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  error={errors.confirmPassword}
                  onChange={update("confirmPassword")}
                />
              </div>

              <div className="2xl:pt-[11px]">
                <label htmlFor="agree" className="flex items-start gap-3">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => {
                      setAgreed(event.target.checked)
                      setErrors((prev) => ({ ...prev, agreed: undefined }))
                      setNotice(null)
                    }}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-[4px] border border-[#c5c2ba] bg-cream accent-brand dark:border-border dark:bg-secondary"
                  />
                  <span className="text-[14px] leading-[1.5] text-ink 2xl:text-[16px] dark:text-foreground">
                    I agree to the{" "}
                    <Link href="/contacts" className="text-brand underline underline-offset-2 hover:text-brand-dark">
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/contacts" className="text-brand underline underline-offset-2 hover:text-brand-dark">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreed && <p className="mt-2 text-[13px] text-destructive">{errors.agreed}</p>}
              </div>

              {notice && (
                <p
                  role="status"
                  className="rounded-[12px] bg-brand-soft px-4 py-3 text-[14px] leading-[1.5] text-brand 2xl:text-[15px]"
                >
                  {notice}
                </p>
              )}

              <div className="2xl:pt-[11px]">
                <button
                  type="submit"
                  className="inline-flex h-[56px] w-full items-center justify-center gap-2.5 rounded-full bg-brand text-[15px] text-white transition-colors hover:bg-brand-dark 2xl:h-[65px] 2xl:text-[17px]"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="mt-14 2xl:mt-[63px]">
            <div className="mx-auto h-px w-full max-w-[424px] bg-line dark:bg-border" />
            <p className="mt-10 text-center text-[16px] text-ink 2xl:mt-[45px] 2xl:text-[20px] dark:text-foreground">
              Already have an account?
            </p>
            <div className="mt-8 flex justify-center 2xl:mt-[27px]">
              <Link
                href="/signin"
                className="inline-flex h-[54px] min-w-[190px] items-center justify-center gap-2.5 rounded-full bg-brand px-8 text-[15px] text-white transition-colors hover:bg-brand-dark 2xl:h-[63px] 2xl:min-w-[219px] 2xl:text-[16px]"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
