"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageHero } from "@/components/page-hero"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useStore } from "@/hooks/use-store"
import { api } from "@/lib/api"
import { getCurrencySymbol } from "@/lib/media"
import { Loader2, Package, ShoppingBag, Truck } from "lucide-react"
import { format } from "date-fns"

interface Order {
  _id: string
  orderNumber?: string
  type: "WEB_PICKUP" | "WEB_DELIVERY"
  status: string
  orderItems: Array<{
    productId: string
    name?: string
    quantity: number
    price: number
    subTotal: number
    modifiers?: Array<{ name: string; price: number }>
  }>
  subTotal: number
  totalTax: number
  finalTotal: number
  paymentMethod: string
  payment?: {
    paymentMethod?: string
  }
  createdAt: string
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { store } = useStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/")
    } else if (isAuthenticated) {
      loadOrders()
    }
  }, [isAuthenticated, authLoading])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await api.order.getMyOrders(1, 50)
      const ordersData = response.data?.orders || response.orders || []
      setOrders(ordersData)
    } catch (error) {
      console.error("[v0] Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("complete") || statusLower.includes("delivered")) return "default"
    if (statusLower.includes("pending") || statusLower.includes("preparing")) return "secondary"
    if (statusLower.includes("cancel")) return "destructive"
    return "outline"
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
        <Footer />
      </div>
    )
  }

  const currency = getCurrencySymbol(store)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <PageHero
          eyebrow="Your account"
          title="Order history"
          description={
            orders.length > 0
              ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} placed with this store.`
              : null
          }
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Orders" },
          ]}
        />

        <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        {orders.length === 0 ? (
          <div className="mx-auto max-w-2xl py-10 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-brand/40 text-brand">
              <Package className="h-8 w-8" />
            </span>
            <h2 className="display-heading mt-8 text-[28px] text-ink dark:text-foreground">No orders yet</h2>
            <p className="mt-4 text-[15px] lg:text-[17px] 2xl:text-[20px] text-muted-foreground">
              Your completed orders will appear here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="mt-8 rounded-full bg-brand px-9 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
            >
              Browse the Menu
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order._id} className="border border-line/80 bg-card p-6 dark:border-border">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Order Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-[22px] font-semibold text-ink dark:text-foreground">
                            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </h3>
                          {order.type === "WEB_DELIVERY" ? (
                            <Truck className="h-5 w-5 text-brand" />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-brand" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.createdAt
                            ? format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")
                            : "Recent order"}
                        </p>
                      </div>
                      {order.status && (
                        <Badge variant={getStatusColor(order.status) as any} className="capitalize">
                          {order.status}
                        </Badge>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {(order.orderItems || []).map((item, index) => (
                        <div key={index} className="flex items-start justify-between text-sm">
                          <div className="flex-1">
                            <p>
                              {item.quantity}x {item.name || "Product"}
                            </p>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-muted-foreground">{item.modifiers.map((m) => m.name).join(", ")}</p>
                            )}
                          </div>
                          <p className="font-medium">
                            {currency}
                            {Number(item.subTotal || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type: </span>
                        <span className="font-medium">{order.type === "WEB_DELIVERY" ? "Delivery" : "Pickup"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment: </span>
                        <span className="font-medium capitalize">
                          {order.paymentMethod || order.payment?.paymentMethod || "Cash"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="flex flex-col items-end gap-2 lg:min-w-[160px]">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="font-medium">
                        {currency}
                        {Number(order.subTotal || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tax</p>
                      <p className="font-medium">
                        {currency}
                        {Number(order.totalTax || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2 border-t border-border pt-2 text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-[22px] font-semibold text-brand">
                        {currency}
                        {Number(order.finalTotal || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
