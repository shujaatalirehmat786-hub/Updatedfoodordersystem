"use client"

import Link from "next/link"
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Utensils } from "lucide-react"
import { useStore } from "@/hooks/use-store"
import { getStoreAddress, getStoreDescription, getStoreEmail, getStoreName, getStorePhone, getStoreSocialLinks } from "@/lib/store"

export function Footer() {
  const { store } = useStore()
  const storeName = getStoreName(store) || "Selected store"
  const storeDescription = getStoreDescription(store)
  const storePhone = getStorePhone(store)
  const storeAddress = getStoreAddress(store)
  const storeEmail = getStoreEmail(store)
  const storeLogo = store?.logoUrl || store?.logo || store?.headerImageUrl || null
  const socialLinks = getStoreSocialLinks(store)

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                {storeLogo ? (
                  <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
                ) : (
                  <Utensils className="h-6 w-6 text-white" />
                )}
              </div>
              <span className="text-xl font-bold text-white">{storeName}</span>
            </div>
            {storeDescription && <p className="mb-4 text-sm text-gray-400">{storeDescription}</p>}
            <div className="flex space-x-4">
              {socialLinks.facebookUrl && (
                <a href={socialLinks.facebookUrl} className="text-gray-400 transition-colors hover:text-orange-500" target="_blank" rel="noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitterUrl && (
                <a href={socialLinks.twitterUrl} className="text-gray-400 transition-colors hover:text-orange-500" target="_blank" rel="noreferrer">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagramUrl && (
                <a href={socialLinks.instagramUrl} className="text-gray-400 transition-colors hover:text-orange-500" target="_blank" rel="noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-orange-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/categories" className="transition-colors hover:text-orange-500">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="transition-colors hover:text-orange-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="transition-colors hover:text-orange-500">
                  Contacts
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {storePhone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <span>{storePhone}</span>
                </li>
              )}
              {storeEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <span>{storeEmail}</span>
                </li>
              )}
              {storeAddress && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <span>{storeAddress}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Newsletter</h3>
            <p className="mb-4 text-sm text-gray-400">
              {storeDescription || "Stay in touch with the store for updates and offers."}
            </p>
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400">
                Newsletter signup can be wired to the store backend when that endpoint is available.
              </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
