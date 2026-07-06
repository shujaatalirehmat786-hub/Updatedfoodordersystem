"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShoppingCart, User, LogOut, History, Phone, Menu, Home, Utensils, X, Store } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useStore } from "@/hooks/use-store"
import { AuthDialog } from "./auth-dialog"

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { cart } = useCart()
  const { store } = useStore()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const userLabel = useMemo(() => {
    return user?.firstName || user?.companyName || user?.phone || "Guest"
  }, [user])

  const storeLabel = store?.name || store?.subdomain || "Selected store"
  const storeLogo = store?.logoUrl || store?.logo || store?.headerImageUrl || null

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/75">
        <div className="container mx-auto flex min-h-[72px] items-center justify-between gap-3 px-3 sm:px-4 sm:gap-4">
          <Link href="/" className="group flex shrink-0 items-center space-x-2 sm:space-x-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 shadow-lg shadow-orange-500/30 transition-transform duration-200 group-hover:-translate-y-0.5">
              {storeLogo ? (
                <img src={storeLogo} alt={storeLabel} className="h-full w-full object-cover" />
              ) : (
                <Utensils className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-white sm:text-xl">{store?.name || "FoodOrder"}</span>
              <span className="hidden text-xs text-white/55 sm:block">Multi-store ordering, one premium flow</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/categories" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Menu
            </Link>
            <Link href="/about" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              About Us
            </Link>
            <Link href="/contacts" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Contacts
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {mounted && store && (
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 md:flex">
                <Store className="h-3.5 w-3.5 text-orange-300" />
                <span>{storeLabel}</span>
              </div>
            )}

            <a href="tel:0947118058" className="hidden items-center gap-2 text-sm text-white/70 transition-colors hover:text-white md:flex">
              <Phone className="h-4 w-4 text-orange-300" />
              <span className="font-medium">{store?.phone || "094 711 80 58"}</span>
            </a>

            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                aria-label="View cart"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {mounted && cart.totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white shadow-md shadow-orange-500/30 sm:h-5 sm:w-5 sm:text-xs">
                    {cart.totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {mounted && cart.totalItems > 0 && (
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white md:block">
                ${Number(cart.finalTotal).toFixed(2)}
              </div>
            )}

            {mounted && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-white hover:bg-white/10"
                    aria-label="User menu"
                  >
                    <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-semibold text-white">
                      {userLabel.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">{userLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 border-white/10 bg-zinc-950 text-white shadow-2xl shadow-black/40">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userLabel}</p>
                      {user?.email && <p className="text-xs leading-none text-white/50">{user.email}</p>}
                      {store && <p className="text-xs leading-none text-orange-300">{storeLabel}</p>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
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
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-300 focus:text-red-200">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setAuthDialogOpen(true)}
                className="h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-transform duration-200 hover:-translate-y-0.5 hover:from-orange-400 hover:to-amber-300"
              >
                Login
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-zinc-950/98 md:hidden">
            <nav className="container mx-auto flex flex-col gap-1 px-3 py-4 sm:px-4">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                href="/categories"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Menu
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/contacts"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacts
              </Link>
              {store && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                  <Store className="h-4 w-4 text-orange-300" />
                  <span>{storeLabel}</span>
                </div>
              )}
              <a href="tel:0947118058" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70">
                <Phone className="h-4 w-4 text-orange-300" />
                <span className="font-medium">{store?.phone || "094 711 80 58"}</span>
              </a>
              {cart.totalItems > 0 && (
                <div className="mt-2 rounded-xl px-3 py-2 text-sm font-semibold text-white">
                  Cart Total: ${Number(cart.finalTotal).toFixed(2)}
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  )
}
