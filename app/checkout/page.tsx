"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { Loader2, Truck, ShoppingBag, Banknote } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthDialog } from "@/components/auth-dialog"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [orderType, setOrderType] = useState<"WEB_PICKUP" | "WEB_DELIVERY">("WEB_PICKUP")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const isPlacingOrderRef = useRef(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Cart state is restored from localStorage after hydration. Do not send
    // the user back to /cart while that initial restore is still in progress.
    if (mounted && cart.items.length === 0) {
      router.push("/cart")
    }
  }, [cart.items.length, mounted, router])

  const handlePlaceOrder = async () => {
    if (isPlacingOrderRef.current) {
      return
    }
    isPlacingOrderRef.current = true
    setIsPlacingOrder(true)

    const resetPlacingOrder = () => {
      isPlacingOrderRef.current = false
      setIsPlacingOrder(false)
    }

    if (!isAuthenticated) {
      setAuthDialogOpen(true)
      resetPlacingOrder()
      return
    }

    // Check if user has complete profile information
    let latestProfile = user
    try {
      const profileResponse = await api.profile.get()
      latestProfile = profileResponse?.data || profileResponse
    } catch (profileError) {
      console.error("[v0] Failed to refresh profile:", profileError)
    }

    if (!latestProfile?.phone) {
      toast({
        title: "Profile incomplete",
        description: "Please add your phone number before placing an order.",
        variant: "destructive",
      })
      router.push("/profile")
      resetPlacingOrder()
      return
    }

    try {
      await api.profile.update({
        firstName: latestProfile.firstName,
        lastName: latestProfile.lastName,
        companyName: latestProfile.companyName,
        email: latestProfile.email,
        phone: latestProfile.phone,
        address: latestProfile.address,
        city: latestProfile.city,
        state: latestProfile.state,
        country: latestProfile.country,
      })
      const refreshedProfileResponse = await api.profile.get()
      latestProfile = refreshedProfileResponse?.data || refreshedProfileResponse
    } catch (profileUpdateError) {
      console.error("[v0] Failed to update profile before order:", profileUpdateError)
      toast({
        title: "Profile update failed",
        description: "Please update your profile and try again.",
        variant: "destructive",
      })
      router.push("/profile")
      resetPlacingOrder()
      return
    }

    try {
      const orderItems = cart.items.map((item) => ({
        discount: item.discount,
        modifiers: (item.modifiers || []).map((mod) => ({
          id: mod.modifierId,
          qty: 1,
        })),
        price: item.price,
        productId: item.productId,
        quantity: item.quantity,
        subTotal: item.subTotal,
        tax: item.tax,
      }))

      const totalDiscount = cart.items.reduce((sum, item) => sum + Number(item.discount || 0), 0)

      const orderData = {
        orderItems,
        totalDiscount,
        totalTax: cart.totalTax,
        subTotal: cart.subTotal,
        finalTotal: cart.finalTotal,
        type: orderType,
      }

      // Place order first
      const orderResponse = await api.order.place(orderData)
      const orderId =
        orderResponse?.order?._id ||
        orderResponse?.data?.order?._id ||
        orderResponse?._id ||
        orderResponse?.data?._id ||
        orderResponse?.id ||
        orderResponse?.data?.id ||
        ""

      if (!orderId) {
        throw new Error("Order was created but the API did not return an order ID.")
      }

      try {
        await api.payment.makePayment({ orderId, paymentMethod: "cash" })
      } catch (paymentError: any) {
        console.error("[v0] Make payment failed:", paymentError)
        toast({
          title: "Payment service unavailable",
          description: "Order placed, but payment could not be recorded. Please contact support.",
          variant: "destructive",
        })
      }

      toast({
        title: "Order placed successfully!",
        description: "Your order has been confirmed. Check your order history for details.",
      })

      clearCart()
      router.push("/orders")
    } catch (error: any) {
      console.error("[v0] Error placing order:", error)
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      resetPlacingOrder()
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Type */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Type</h2>
              <RadioGroup value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                <div className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent">
                  <RadioGroupItem value="WEB_PICKUP" id="pickup" />
                  <Label htmlFor="pickup" className="flex flex-1 cursor-pointer items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Pickup</p>
                      <p className="text-sm text-muted-foreground">Pick up your order at the store</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent">
                  <RadioGroupItem value="WEB_DELIVERY" id="delivery" />
                  <Label htmlFor="delivery" className="flex flex-1 cursor-pointer items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Delivery</p>
                      <p className="text-sm text-muted-foreground">Get your order delivered to your door</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Payment Method</h2>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-4">
                <Banknote className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Cash on {orderType === "WEB_DELIVERY" ? "Delivery" : "Pickup"}</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                </div>
              </div>
            </Card>

            {/* Order Items Summary */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Items ({cart.totalItems})</h2>
              <div className="space-y-3">
                {cart.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.quantity}x {item.name}
                      </p>
                      {(item.modifiers || []).length > 0 && (
                        <p className="text-sm text-muted-foreground">{(item.modifiers || []).map((m) => m.name).join(", ")}</p>
                      )}
                    </div>
                    <p className="font-semibold">${item.subTotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>

              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${cart.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-semibold">${cart.totalTax.toFixed(2)}</span>
                </div>
                {orderType === "WEB_DELIVERY" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${cart.finalTotal.toFixed(2)}</span>
              </div>

              <Button onClick={handlePlaceOrder} size="lg" className="mt-6 w-full" disabled={isPlacingOrder}>
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="mt-3 w-full bg-transparent"
                onClick={() => router.push("/cart")}
              >
                Back to Cart
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  )
}
