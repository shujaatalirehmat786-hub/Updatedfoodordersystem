"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Utensils, Heart, Truck, Star } from "lucide-react"
import { useStore } from "@/hooks/use-store"
import { getStoreDescription, getStoreName } from "@/lib/store"

export default function AboutPage() {
  const { store } = useStore()
  const storeName = getStoreName(store) || "Selected store"
  const aboutText = getStoreDescription(store)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            About {storeName}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {aboutText || "Store information has not been published yet."}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-400">
              {storeName} is dedicated to presenting the store-specific menu, contact, and ordering experience pulled from the backend.
              </p>
            </Card>

          <Card className="p-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Why Choose Us</h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                <span>Store-backed menu and branding</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" />
                <span>Delivery details scoped to the active store</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-500" />
                <span>Centralized logic for every store</span>
              </li>
              <li className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-500" />
                <span>Premium ordering experience</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
