"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, Clock } from "lucide-react"

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Get in touch with us for any questions or support
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
                <Phone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Phone</h3>
            <p className="text-gray-600 dark:text-gray-400">094 711 80 58</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Call us 24/7</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
                <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Email</h3>
            <p className="text-gray-600 dark:text-gray-400">info@foodorder.com</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">We'll respond quickly</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
                <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Address</h3>
            <p className="text-gray-600 dark:text-gray-400">Chicago, IL 60606</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">123, New Lenox</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Hours</h3>
            <p className="text-gray-600 dark:text-gray-400">24/7 Available</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Always open</p>
          </Card>
        </div>

        <Card className="mt-8 p-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Your message..."
              />
            </div>
            <Button className="w-full bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600">
              Send Message
            </Button>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

