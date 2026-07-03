"use client"

import Link from "next/link"
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Utensils } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FoodOrder</span>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Order Food Delivery From Your Favorite Restaurants! We get what you love From Your Favorite Restaurants!
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 transition-colors hover:text-orange-500">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-orange-500">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 transition-colors hover:text-orange-500">
                <Instagram className="h-5 w-5" />
              </a>
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
                <Link href="/" className="transition-colors hover:text-orange-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Contacts
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <span>094 711 80 58</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <span>info@foodorder.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <span>Chicago, IL 60606<br />123, New Lenox</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Newsletter</h3>
            <p className="mb-4 text-sm text-gray-400">
              Want Coupons or Deep Thoughts About Food? Get Our Weekly Email:
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} FoodOrder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

