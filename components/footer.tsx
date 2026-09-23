"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Mail, MapPin, Phone, Facebook, Instagram, Twitter } from "lucide-react"
import { useStore } from "@/hooks/use-store"
import { api } from "@/lib/api"
import {
  getStoreAddress,
  getStoreDescription,
  getStoreEmail,
  getStoreName,
  getStorePhone,
  getStoreSocialLinks,
} from "@/lib/store"
import { resolveMediaUrl } from "@/lib/media"

export function Footer() {
  const { store } = useStore()
  const [departments, setDepartments] = useState<any[]>([])

  const storeName = getStoreName(store) || store?.subdomain || ""
  const storeDescription = getStoreDescription(store)
  const storeAddress = getStoreAddress(store)
  const storeEmail = getStoreEmail(store)
  const storePhone = getStorePhone(store)
  const storeLogo = resolveMediaUrl(store?.logoUrl || store?.logo)
  const social = getStoreSocialLinks(store)

  // Footer menu column mirrors the live department list for the active store.
  useEffect(() => {
    let cancelled = false
    if (!store?._id) {
      setDepartments([])
      return
    }

    const loadDepartments = async () => {
      try {
        const response = await api.department.list({ storeId: store._id, page: 1, limit: 50 })
        if (!cancelled) {
          setDepartments(response.data || [])
        }
      } catch (error) {
        console.error("Error loading footer departments:", error)
      }
    }

    void loadDepartments()
    return () => {
      cancelled = true
    }
  }, [store?._id])

  const socialItems = [
    { href: social.instagramUrl, Icon: Instagram, label: "Instagram" },
    { href: social.facebookUrl, Icon: Facebook, label: "Facebook" },
    { href: social.twitterUrl, Icon: Twitter, label: "Twitter" },
  ].filter((item) => Boolean(item.href))

  const contactItems = [
    storeAddress ? { Icon: MapPin, value: storeAddress, href: null } : null,
    storePhone ? { Icon: Phone, value: storePhone, href: `tel:${storePhone.replace(/\s+/g, "")}` } : null,
    storeEmail ? { Icon: Mail, value: storeEmail, href: `mailto:${storeEmail}` } : null,
  ].filter(Boolean) as Array<{ Icon: typeof MapPin; value: string; href: string | null }>

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1560px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
        {/* Closing call to action */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
          <h2 className="font-display text-[34px] font-medium leading-[1.15] sm:text-[44px] lg:text-[56px]">
            Bring the Taste of Authentic Indian Cooking Home
          </h2>
          <div className="space-y-7">
            {storeDescription && (
              <p className="max-w-xl text-[15px] lg:text-[17px] 2xl:text-[19px] leading-[1.75] text-white/75">{storeDescription}</p>
            )}
            <Link
              href="/categories"
              className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-[15px] lg:text-[17px] 2xl:text-[19px] text-ink transition-colors hover:bg-brand hover:text-white"
            >
              Order Now
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="my-14 h-px w-full bg-white/20" />

        {/* Link columns */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-block">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName || "Store logo"} className="h-20 w-auto max-w-[260px] object-contain" />
              ) : (
                <img src="/savera/logo-light.png" alt={storeName || "Store logo"} className="h-20 w-auto object-contain" />
              )}
            </Link>
            {storeDescription && (
              <p className="mt-6 max-w-sm text-[15px] lg:text-[17px] 2xl:text-[19px] leading-[1.7] text-white/75">{storeDescription}</p>
            )}

            {socialItems.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-2xl font-medium">Social Links</h3>
                <div className="mt-4 flex items-center gap-3">
                  {socialItems.map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href as string}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-white hover:bg-white hover:text-brand"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:border-l lg:border-dotted lg:border-white/30 lg:pl-10">
            <h3 className="font-display text-2xl font-medium">Quick Links:</h3>
            <ul className="mt-5 space-y-3 text-[15px] lg:text-[17px] 2xl:text-[19px] text-white/80">
              <li>
                <Link href="/" className="transition-colors hover:text-brand">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/categories" className="transition-colors hover:text-brand">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-brand">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="transition-colors hover:text-brand">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:border-l lg:border-dotted lg:border-white/30 lg:pl-10">
            <h3 className="font-display text-2xl font-medium">Our Menu</h3>
            {departments.length > 0 ? (
              <ul className="mt-5 space-y-3 text-[15px] lg:text-[17px] 2xl:text-[19px] text-white/80">
                {departments.slice(0, 8).map((department) => (
                  <li key={department._id}>
                    <Link
                      href={`/categories?category=${department._id}`}
                      className="transition-colors hover:text-brand"
                    >
                      {department.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-[15px] lg:text-[17px] 2xl:text-[19px] text-white/50">Menu categories load from the store.</p>
            )}
          </div>

          <div className="lg:border-l lg:border-dotted lg:border-white/30 lg:pl-10">
            <h3 className="font-display text-2xl font-medium">Contact</h3>
            {contactItems.length > 0 ? (
              <ul className="mt-5 space-y-5">
                {contactItems.map(({ Icon, value, href }) => (
                  <li key={value} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40">
                      <Icon className="h-[17px] w-[17px]" />
                    </span>
                    {href ? (
                      <a href={href} className="text-[15px] lg:text-[17px] 2xl:text-[19px] leading-[1.6] text-white/80 transition-colors hover:text-brand">
                        {value}
                      </a>
                    ) : (
                      <span className="text-[15px] lg:text-[17px] 2xl:text-[19px] leading-[1.6] text-white/80">{value}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-[15px] lg:text-[17px] 2xl:text-[19px] text-white/50">Contact details load from the store.</p>
            )}
          </div>
        </div>

        <div className="mt-14 h-px w-full bg-white/20" />

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-white/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {storeName || "This store"}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/contacts" className="transition-colors hover:text-brand">
              Privacy Policy
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/contacts" className="transition-colors hover:text-brand">
              Terms &amp; conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
