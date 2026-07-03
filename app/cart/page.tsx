"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCart } from "@/hooks/use-cart"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
            <h1 className="mt-6 text-3xl font-bold">Your cart is empty</h1>
            <p className="mt-2 text-muted-foreground">Add some delicious items to get started!</p>
            <Link href="/">
              <Button className="mt-6">Browse Products</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex gap-4">
                  {/* Item Image */}
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={item.image || `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">${Number(item.price).toFixed(2)} each</p>

                        {/* Modifiers */}
                        {item.modifiers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.modifiers.map((modifier, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                + {modifier.name} (${Number(modifier.price).toFixed(2)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className="text-lg font-bold">${Number(item.subTotal).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>

              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${Number(cart.subTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-semibold">${Number(cart.totalTax).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${Number(cart.finalTotal).toFixed(2)}</span>
              </div>

              <Button onClick={() => router.push("/checkout")} size="lg" className="mt-6 w-full">
                Proceed to Checkout
              </Button>

              <Link href="/">
                <Button variant="outline" size="lg" className="mt-3 w-full bg-transparent">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
