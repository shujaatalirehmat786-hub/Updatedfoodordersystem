"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { getActiveStoreSlug, markProfileCompleted } from "@/lib/auth"
import { CheckCircle2, Loader2, PenLine, Sparkles, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function ProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, updateProfile, isLoading, error, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [editorOpen, setEditorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: user.companyName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
      })
    }
  }, [user])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (searchParams.get("fromAuth") === "true") {
      setEditorOpen(true)
    }
  }, [searchParams])

  const fullName = useMemo(() => {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
    return name || user?.companyName || "Your profile"
  }, [user])

  const initials = useMemo(() => {
    const first = user?.firstName?.charAt(0) || user?.phone?.charAt(1) || "U"
    const last = user?.lastName?.charAt(0) || user?.phone?.charAt(2) || ""
    return `${first}${last}`.toUpperCase()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.phone) {
      toast({
        title: "Validation Error",
        description: "Phone number is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const success = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      })

      if (success) {
        markProfileCompleted(getActiveStoreSlug() || undefined)
        toast({
          title: "Profile updated successfully!",
          description: "Your information has been saved.",
        })

        if (searchParams.get("fromAuth") === "true") {
          setEditorOpen(false)
          router.push("/")
        } else {
          setEditorOpen(false)
        }
      }
    } catch (submitError: any) {
      toast({
        title: "Update failed",
        description: submitError.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  const storeSlug = getActiveStoreSlug() || "selected store"
  const profileComplete = !!(user.firstName && user.lastName && user.phone)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_28%)]" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-zinc-950/5 via-transparent to-transparent" />

        <section className="container relative px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-4xl space-y-8">
            <Card className="relative overflow-hidden border-white/10 bg-zinc-950 p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.18)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_32%)]" />
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col gap-7">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-18 w-18 min-h-18 min-w-18 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 text-xl font-semibold text-white shadow-[0_20px_50px_rgba(249,115,22,0.3)]">
                        {initials}
                      </div>
                      <div className="pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{fullName}</h1>
                          <Badge className="border-0 bg-white/10 text-white hover:bg-white/15">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Verified
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-white/65">{user.phone}</p>
                        <p className="mt-1 text-sm text-white/50">{user.email || "No email added yet"}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setEditorOpen(true)}
                      className="h-11 rounded-2xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-white/90"
                    >
                      <PenLine className="mr-2 h-4 w-4" />
                      Edit information
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/40">Store</p>
                      <p className="mt-2 text-base font-medium text-white">{storeSlug}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/40">Status</p>
                      <p className="mt-2 text-base font-medium text-white">Ready to order</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/40">Profile</p>
                      <p className="mt-2 text-base font-medium text-white">{profileComplete ? "Complete" : "Needs attention"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-white/10 bg-white shadow-[0_18px_70px_rgba(0,0,0,0.08)]">
              <div className="border-b border-zinc-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-950">Profile details</h2>
                    <p className="text-sm text-zinc-500">All of your information in one place</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-6">
                {[
                  { label: "First name", value: user.firstName || "Not set" },
                  { label: "Last name", value: user.lastName || "Not set" },
                  { label: "Company", value: user.companyName || "Not set" },
                  { label: "Phone", value: user.phone || "Not set" },
                  { label: "Email", value: user.email || "Not set" },
                  { label: "Address", value: user.address || "Not set" },
                  { label: "City", value: user.city || "Not set" },
                  { label: "State", value: user.state || "Not set" },
                  { label: "Country", value: user.country || "Not set" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{item.label}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 bg-gradient-to-r from-zinc-50 to-orange-50/70 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">Ready to edit your details?</p>
                    <p className="text-sm text-zinc-500">Open the secure form and update anything instantly.</p>
                  </div>
                  <Button
                    onClick={() => setEditorOpen(true)}
                    className="h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    Edit info
                  </Button>
                </div>
              </div>
            </Card>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </section>
      </main>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Update information</DialogTitle>
            <DialogDescription>
              Edit your personal details. These updates are scoped to the active store.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSaving || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSaving || isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="AOnePOS Software Solutions"
                value={formData.companyName}
                onChange={handleChange}
                disabled={isSaving || isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSaving || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isSaving || isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="ABC Street, Dallas"
                value={formData.address}
                onChange={handleChange}
                disabled={isSaving || isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Dallas"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isSaving || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="Texas"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isSaving || isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                type="text"
                placeholder="United States Of America"
                value={formData.country}
                onChange={handleChange}
                disabled={isSaving || isLoading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={isSaving || isLoading}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={isSaving || isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </main>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}
