"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
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
  createdAt: string
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Order History</h1>

        {orders.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center">
            <Package className="mx-auto h-24 w-24 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-muted-foreground">Start ordering delicious food to see your history here.</p>
            <Button onClick={() => router.push("/")} className="mt-6">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Order Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </h3>
                          {order.type === "WEB_DELIVERY" ? (
                            <Truck className="h-5 w-5 text-primary" />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-primary" />
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
                          <p className="font-medium">${Number(item.subTotal || 0).toFixed(2)}</p>
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
                        <span className="font-medium capitalize">{order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="flex flex-col items-end gap-2 lg:min-w-[160px]">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="font-medium">${Number(order.subTotal || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tax</p>
                      <p className="font-medium">${Number(order.totalTax || 0).toFixed(2)}</p>
                    </div>
                    <div className="mt-2 border-t border-border pt-2 text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">${Number(order.finalTotal || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
