"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageHero } from "@/components/page-hero"
import { useCart } from "@/hooks/use-cart"
import { useStore } from "@/hooks/use-store"
import { getCurrencySymbol, getProductImage } from "@/lib/media"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const { store } = useStore()
  const router = useRouter()
  const currency = getCurrencySymbol(store)

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="surface-paper">
          <div className="mx-auto max-w-[1560px] px-4 py-24 text-center sm:px-6 lg:px-10 lg:py-32">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-brand/40 text-brand">
              <ShoppingBag className="h-8 w-8" />
            </span>
            <h1 className="display-heading mt-8 text-[30px] text-ink sm:text-[42px] dark:text-foreground">
              Your cart is empty
            </h1>
            <p className="mt-4 text-[15px] text-ink-soft dark:text-foreground/70">
              Add a few dishes from the menu to get started.
            </p>
            <Link
              href="/categories"
              className="mt-9 inline-block rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
            >
              Browse the Menu
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const normalizeModifiers = (modifiers: unknown) => (Array.isArray(modifiers) ? modifiers : [])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <PageHero
          eyebrow="Your order"
          title="Shopping cart"
          description={`${cart.totalItems} ${cart.totalItems === 1 ? "item" : "items"} ready to check out.`}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Cart" },
          ]}
        />

        <section className="bg-background py-14 lg:py-20">
          <div className="mx-auto grid max-w-[1560px] gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-10">
            {/* Cart items */}
            <div className="space-y-5 lg:col-span-2">
              {cart.items.map((item, index) => (
                <article key={index} className="flex gap-5 border border-line/80 bg-card p-4 dark:border-border">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[4px] bg-cream">
                    <img
                      src={getProductImage({ _id: item.productId, name: item.name, image: item.image })}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-display text-[21px] font-semibold text-ink dark:text-foreground">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-[14px] text-muted-foreground">
                          {currency}
                          {Number(item.price).toFixed(2)} each
                        </p>

                        {normalizeModifiers(item.modifiers).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {normalizeModifiers(item.modifiers).map((modifier, idx) => (
                              <p key={idx} className="text-[14px] text-muted-foreground">
                                + {modifier.name} ({currency}
                                {Number(modifier.price).toFixed(2)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        aria-label={`Remove ${item.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40 dark:border-foreground/25 dark:text-foreground"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-semibold text-ink dark:text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-[20px] font-semibold text-ink dark:text-foreground">
                        {currency}
                        {Number(item.subTotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 border border-line/80 bg-card p-7 dark:border-border">
                <h2 className="font-display text-[26px] font-semibold text-ink dark:text-foreground">Order summary</h2>

                <div className="mt-6 space-y-3 border-b border-line pb-5 dark:border-border">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-ink dark:text-foreground">
                      {currency}
                      {Number(cart.subTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold text-ink dark:text-foreground">
                      {currency}
                      {Number(cart.totalTax).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-[22px] font-semibold text-ink dark:text-foreground">Total</span>
                  <span className="text-[26px] font-semibold text-brand">
                    {currency}
                    {Number(cart.finalTotal).toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="mt-7 w-full rounded-full bg-brand px-8 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/categories"
                  className="mt-3 block w-full rounded-full border border-ink/20 px-8 py-4 text-center text-[15px] text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
