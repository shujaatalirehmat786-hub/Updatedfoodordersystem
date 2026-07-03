"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Utensils, Heart, Truck, Star } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            About Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Learn more about our food delivery service
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400">
              We are dedicated to bringing you the best food from your favorite restaurants, 
              delivered right to your door. Our mission is to make food ordering simple, fast, and enjoyable.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Why Choose Us</h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                <span>Wide selection of restaurants</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" />
                <span>Fast and reliable delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-500" />
                <span>100% customer satisfaction</span>
              </li>
              <li className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-500" />
                <span>Fresh and quality food</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

