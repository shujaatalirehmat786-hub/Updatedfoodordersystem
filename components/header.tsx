"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ShoppingCart,
  User,
  LogOut,
  History,
  Menu,
  X,
  MapPin,
  Phone,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useStore } from "@/hooks/use-store"
import { getStoreAddress, getStoreName, getStorePhone, getStoreSocialLinks } from "@/lib/store"
import { resolveMediaUrl } from "@/lib/media"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Our Menu" },
  { href: "/about", label: "Our Story" },
  { href: "/contacts", label: "Contacts" },
]

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { cart } = useCart()
  const { store } = useStore()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const userLabel = useMemo(() => {
    return user?.firstName || user?.companyName || user?.phone || "Guest"
  }, [user])

  // Store data is loaded from localStorage/API after hydration. Keep the
  // server and first client render identical so the header cannot mismatch.
  const storeLabel = mounted ? getStoreName(store) || store?.subdomain || "" : ""
  const storeLogo = mounted ? resolveMediaUrl(store?.logoUrl || store?.logo) : null
  const storeAddress = mounted ? getStoreAddress(store) : undefined
  const storePhone = mounted ? getStorePhone(store) : undefined
  const social = mounted ? getStoreSocialLinks(store) : { facebookUrl: null, instagramUrl: null, twitterUrl: null }

  const socialItems = [
    { href: social.facebookUrl, Icon: Facebook, label: "Facebook" },
    { href: social.twitterUrl, Icon: Twitter, label: "Twitter" },
    { href: social.instagramUrl, Icon: Instagram, label: "Instagram" },
  ].filter((item) => Boolean(item.href))

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Utility bar — contact details come from the store record */}
        <div className="bg-ink text-white">
          <div className="mx-auto flex min-h-[44px] max-w-[1560px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2">
              {socialItems.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href as string}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-brand hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] sm:text-sm">
              {storeAddress && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{storeAddress}</span>
                </span>
              )}
              {storePhone && (
                <a href={`tel:${storePhone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-brand">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{storePhone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main bar */}
        <div className="surface-paper">
          <div className="mx-auto flex min-h-[76px] max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              {storeLogo ? (
                <img src={storeLogo} alt={storeLabel || "Store logo"} className="h-12 w-auto max-w-[210px] object-contain sm:h-16" />
              ) : (
                <img src="/savera/brand-logo.png" alt={storeLabel || "Store logo"} className="h-12 w-auto object-contain sm:h-16 dark:hidden" />
              )}
              {!storeLogo && (
                <img src="/savera/logo-light.png" alt="" aria-hidden className="hidden h-12 w-auto object-contain sm:h-16 dark:block" />
              )}
            </Link>

            <nav className="hidden items-center gap-8 lg:flex xl:gap-12">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[15px] lg:text-[17px] 2xl:text-[19px] transition-colors hover:text-brand ${
                      active ? "text-brand" : "text-ink-soft dark:text-foreground/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="/cart"
                aria-label="View cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/30 dark:text-foreground"
              >
                <ShoppingCart className="h-[18px] w-[18px]" />
                {mounted && cart.totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {cart.totalItems}
                  </span>
                )}
              </Link>

              {mounted && isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Account menu"
                      className="flex h-10 items-center gap-2 rounded-full border border-ink/25 px-2 text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/30 dark:text-foreground"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                        {userLabel.charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden max-w-[110px] truncate pr-1 text-sm sm:block">{userLabel}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userLabel}</p>
                        {user?.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                        {storeLabel && <p className="text-xs leading-none text-brand">{storeLabel}</p>}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/orders" className="w-full">
                        <History className="mr-2 h-4 w-4" />
                        Order History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile" className="w-full">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/signin"
                  aria-label="Sign in"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/30 dark:text-foreground"
                >
                  <User className="h-[18px] w-[18px]" />
                </Link>
              )}

              <Button
                asChild
                className="hidden h-11 rounded-full bg-brand px-7 text-[15px] lg:text-[17px] 2xl:text-[19px] font-normal text-white shadow-none hover:bg-brand-dark sm:inline-flex"
              >
                <Link href="/categories">Order Now</Link>
              </Button>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/25 text-ink lg:hidden dark:border-foreground/30 dark:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-line/70 bg-cream-light lg:hidden dark:border-border dark:bg-card">
              <nav className="mx-auto flex max-w-[1560px] flex-col px-4 py-3 sm:px-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="border-b border-line/60 py-3 text-[15px] lg:text-[17px] 2xl:text-[19px] text-ink-soft last:border-0 hover:text-brand dark:border-border dark:text-foreground/80"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="mt-4 h-11 rounded-full bg-brand text-[15px] lg:text-[17px] 2xl:text-[19px] font-normal text-white hover:bg-brand-dark sm:hidden"
                >
                  <Link href="/categories" onClick={() => setMobileMenuOpen(false)}>
                    Order Now
                  </Link>
                </Button>
                {mounted && cart.totalItems > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Cart total: <span className="font-semibold text-ink dark:text-foreground">${Number(cart.finalTotal).toFixed(2)}</span>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

    </>
  )
}
