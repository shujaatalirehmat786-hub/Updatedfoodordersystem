"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ArrowRight, Loader2, LogOut, MapPin, Pencil, Plus } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useStore } from "@/hooks/use-store"
import { api } from "@/lib/api"
import { getActiveStoreSlug, markProfileCompleted } from "@/lib/auth"
import { getCurrencySymbol } from "@/lib/media"
import { useToast } from "@/hooks/use-toast"

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "my-details", label: "My Details" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
]

function ProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, updateProfile, logout, isLoading, error, isAuthenticated } = useAuth()
  const { store } = useStore()
  const { toast } = useToast()
  const [editorOpen, setEditorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("overview")
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

  // Recent orders come from the same endpoint the order history page uses.
  useEffect(() => {
    let cancelled = false
    const loadOrders = async () => {
      if (!isAuthenticated) return
      try {
        setOrdersLoading(true)
        const response = await api.order.getMyOrders(1, 50)
        const ordersData = response.data?.orders || response.orders || []
        if (!cancelled) setOrders(ordersData)
      } catch (loadError) {
        console.error("[v0] Error loading recent orders:", loadError)
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }
    void loadOrders()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

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
        markProfileCompleted(getActiveStoreSlug() || undefined, formData.phone)
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

  const goToSection = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="surface-paper">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const currency = getCurrencySymbol(store)
  const addressLine = [user.address, user.city, user.state, user.country].filter(Boolean).join(", ")
  const recentOrders = orders.slice(0, 3)
  const maskedEmail = user.email || null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="surface-paper py-10 lg:py-14">
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
          {/* Welcome banner */}
          <section id="overview" className="flex flex-col items-center gap-6 rounded-[16px] bg-card p-7 text-center shadow-[0_10px_30px_rgba(17,17,17,0.06)] sm:flex-row sm:text-left lg:p-10">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-cream-light font-display text-[36px] font-semibold text-brand">
              {initials}
            </span>
            <div>
              <span className="eyebrow">My account</span>
              <h1 className="mt-3 font-display text-[28px] font-semibold text-ink sm:text-[34px] dark:text-foreground">
                Welcome back, {user.firstName || fullName}
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Manage your account, orders and ordering preferences.
              </p>
            </div>
          </section>

          <div className="mt-8 grid gap-7 lg:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <aside className="h-fit overflow-hidden rounded-[16px] bg-card shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
              <p className="px-6 pb-4 pt-6 font-display text-[20px] font-semibold text-ink dark:text-foreground">
                Profile
              </p>
              <nav className="pb-2">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => goToSection(section.id)}
                    className={`block w-full px-6 py-3 text-left text-[15px] transition-colors ${
                      activeSection === section.id
                        ? "bg-brand text-white"
                        : "text-ink-soft hover:text-brand dark:text-foreground/75"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
              <div className="border-t border-line dark:border-border">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-6 py-4 text-left text-[15px] text-brand transition-colors hover:text-brand-dark"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </aside>

            <div className="space-y-7">
              {/* Personal details + address */}
              <div className="grid gap-7 md:grid-cols-2">
                <section id="my-details" className="rounded-[16px] bg-card p-7 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                  <span className="eyebrow">Personal details</span>
                  <h2 className="mt-3 font-display text-[22px] font-semibold text-ink dark:text-foreground">
                    {fullName}
                  </h2>
                  <div className="mt-4 space-y-1.5 text-[14px] text-muted-foreground">
                    {maskedEmail && <p>{maskedEmail}</p>}
                    {user.phone && <p>{user.phone}</p>}
                    {user.companyName && <p>{user.companyName}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 text-[15px] text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit details
                  </button>
                </section>

                <section id="addresses" className="rounded-[16px] bg-card p-7 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                  <span className="eyebrow">Default address</span>
                  <h2 className="mt-3 font-display text-[22px] font-semibold text-ink dark:text-foreground">
                    {addressLine ? "Your saved address" : "No address saved yet."}
                  </h2>
                  <p className="mt-4 text-[14px] leading-[1.6] text-muted-foreground">
                    {addressLine || "Save your delivery or pickup location for faster checkout."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 text-[15px] text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline"
                  >
                    {addressLine ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {addressLine ? "Edit address" : "Add address"}
                  </button>
                </section>
              </div>

              {/* Recent orders */}
              <section id="orders">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-[24px] font-semibold text-ink sm:text-[28px] dark:text-foreground">
                    Recent orders
                  </h2>
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 text-[15px] text-brand transition-colors hover:text-brand-dark"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center rounded-[16px] bg-card py-16 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                      <Loader2 className="h-6 w-6 animate-spin text-brand" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="rounded-[16px] bg-card p-10 text-center shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                      <p className="font-display text-[20px] font-semibold text-ink dark:text-foreground">
                        No orders yet
                      </p>
                      <p className="mt-2 text-[14px] text-muted-foreground">
                        Your completed orders will appear here.
                      </p>
                      <Link
                        href="/categories"
                        className="mt-6 inline-block rounded-full bg-brand px-8 py-3.5 text-[15px] text-white transition-colors hover:bg-brand-dark"
                      >
                        Browse the Menu
                      </Link>
                    </div>
                  ) : (
                    recentOrders.map((order) => {
                      const items = order.orderItems || []
                      const itemCount = items.reduce(
                        (sum: number, item: any) => sum + Number(item.quantity || 0),
                        0,
                      )
                      return (
                        <article
                          key={order._id}
                          className="rounded-[16px] bg-card p-6 shadow-[0_10px_30px_rgba(17,17,17,0.06)]"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground">
                                Order #{order.orderNumber || String(order._id).slice(-8).toUpperCase()}
                              </p>
                              <p className="mt-1 text-[13px] text-muted-foreground">
                                {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "Recent order"}
                              </p>
                              <div className="mt-3 space-y-0.5">
                                {items.slice(0, 3).map((item: any, index: number) => (
                                  <p
                                    key={index}
                                    className="font-display text-[18px] font-semibold text-ink dark:text-foreground"
                                  >
                                    {item.name || "Product"}
                                  </p>
                                ))}
                                {items.length > 3 && (
                                  <p className="text-[13px] text-muted-foreground">
                                    +{items.length - 3} more
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              {order.status && (
                                <span className="rounded-[6px] border border-emerald-500/40 px-3 py-1 text-[13px] capitalize text-emerald-600">
                                  {order.status}
                                </span>
                              )}
                              <div className="text-right">
                                <p className="text-[13px] text-muted-foreground">
                                  {itemCount} {itemCount === 1 ? "item" : "items"}
                                </p>
                                <p className="text-[20px] font-semibold text-ink dark:text-foreground">
                                  {currency}
                                  {Number(order.finalTotal || 0).toFixed(2)}
                                </p>
                              </div>
                              <Link
                                href="/orders"
                                className="rounded-full border border-brand px-5 py-2 text-[14px] text-brand transition-colors hover:bg-brand hover:text-white"
                              >
                                View order
                              </Link>
                            </div>
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              </section>

              {/* Quick settings */}
              <section>
                <h2 className="font-display text-[24px] font-semibold text-ink sm:text-[28px] dark:text-foreground">
                  Quick account settings
                </h2>
                <div className="mt-5 grid gap-6 md:grid-cols-3">
                  <div className="rounded-[16px] bg-card p-6 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                    <h3 className="font-display text-[19px] font-semibold text-ink dark:text-foreground">
                      Account details
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                      Update your name, email or phone number.
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditorOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 text-[15px] text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline"
                    >
                      Manage
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-[16px] bg-card p-6 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                    <h3 className="font-display text-[19px] font-semibold text-ink dark:text-foreground">
                      Delivery address
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                      Manage the address used for delivery and pickup.
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditorOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 text-[15px] text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline"
                    >
                      Manage
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-[16px] bg-card p-6 shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
                    <h3 className="font-display text-[19px] font-semibold text-ink dark:text-foreground">
                      Order history
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                      Review everything you have ordered from this store.
                    </p>
                    <Link
                      href="/orders"
                      className="mt-4 inline-flex items-center gap-2 text-[15px] text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline"
                    >
                      Manage
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Closing note */}
      <section className="bg-background py-12">
        <div className="mx-auto flex max-w-[1560px] flex-col items-center px-4 text-center sm:px-6 lg:px-10">
          <span className="eyebrow eyebrow-center">A note from the kitchen</span>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.7] text-ink-soft dark:text-foreground/70">
            Order availability, delivery time and pricing may vary based on demand and location.
          </p>
        </div>
      </section>

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

      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="surface-paper">
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}
