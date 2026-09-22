"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCart } from "@/hooks/use-cart"
import { useStore } from "@/hooks/use-store"
import { getCurrencySymbol, getProductImage } from "@/lib/media"
import { getStoreAddress } from "@/lib/store"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const { store } = useStore()
  const router = useRouter()
  const currency = getCurrencySymbol(store)
  // Store addresses often already end in a period; avoid "75038..".
  const storeAddress = getStoreAddress(store)?.replace(/[.\s]+$/, "")
  const pickupAvailable = store?.orderWebsiteId?.isPickupAvailable

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
  const totalDiscount = cart.items.reduce((sum, item) => sum + Number(item.discount || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="surface-paper py-14 lg:py-20">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            {/* Masthead */}
            <div className="flex flex-col items-center text-center">
              <span className="eyebrow eyebrow-center">Your selection</span>
              <h1 className="display-heading mt-5 text-[32px] text-ink sm:text-[44px] lg:text-[52px] dark:text-foreground">
                Your cart
              </h1>
              <p className="mt-4 text-[15px] text-ink-soft dark:text-foreground/70">
                Review your items and continue securely to checkout.
              </p>
            </div>

            <div className="mt-12 h-px w-full bg-line dark:bg-border" />

            {/* Column headings */}
            <div className="grid gap-8 py-6 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-[24px] font-semibold text-ink sm:text-[28px] dark:text-foreground">
                  Your items
                </h2>
                <p className="text-[15px] text-muted-foreground">
                  {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"} in your cart
                </p>
              </div>
              <h2 className="hidden font-display text-[24px] font-semibold text-ink sm:text-[28px] lg:block dark:text-foreground">
                Order summary
              </h2>
            </div>

            <div className="h-px w-full bg-line dark:bg-border" />

            {/* Items + summary */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
              <div className="space-y-5">
                {cart.items.map((item, index) => {
                  const modifiers = normalizeModifiers(item.modifiers)
                  return (
                    <article
                      key={index}
                      className="flex flex-col gap-5 rounded-[16px] bg-card p-4 shadow-[0_10px_30px_rgba(17,17,17,0.06)] sm:flex-row"
                    >
                      <div className="h-[140px] w-full shrink-0 overflow-hidden rounded-[12px] bg-cream sm:h-[150px] sm:w-[150px]">
                        <img
                          src={getProductImage({ _id: item.productId, name: item.name, image: item.image })}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-display text-[21px] font-semibold text-ink sm:text-[23px] dark:text-foreground">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-[14px] text-muted-foreground">
                              {modifiers.length > 0
                                ? modifiers.map((modifier: any) => modifier.name).join(" · ")
                                : `${currency}${Number(item.price).toFixed(2)} each`}
                            </p>
                          </div>
                          <p className="shrink-0 text-[19px] font-semibold text-ink dark:text-foreground">
                            {currency}
                            {Number(item.subTotal).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                          <div className="inline-flex items-center gap-4 rounded-full bg-brand px-5 py-2.5 text-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[18px] text-center text-[16px] font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="transition-opacity hover:opacity-80"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <ShoppingBag className="h-4 w-4 opacity-80" aria-hidden />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(index)}
                            className="text-[15px] text-brand transition-colors hover:text-brand-dark"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Order summary */}
              <div>
                <h2 className="mb-5 font-display text-[24px] font-semibold text-ink lg:hidden dark:text-foreground">
                  Order summary
                </h2>

                <div className="sticky top-32 rounded-[16px] bg-card p-7 shadow-[0_10px_30px_rgba(17,17,17,0.06)] sm:p-9">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[15px] text-ink-soft dark:text-foreground/75">Subtotal</span>
                      <span className="text-[16px] font-semibold text-ink dark:text-foreground">
                        {currency}
                        {Number(cart.subTotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[15px] text-ink-soft dark:text-foreground/75">Tax</span>
                      <span className="text-[16px] font-semibold text-ink dark:text-foreground">
                        {currency}
                        {Number(cart.totalTax).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[15px] text-ink-soft dark:text-foreground/75">Delivery</span>
                      <span className="text-[15px] text-muted-foreground">Calculated at checkout</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[15px] text-ink-soft dark:text-foreground/75">Discount</span>
                      <span className="text-[15px] text-muted-foreground">
                        {totalDiscount > 0 ? `−${currency}${totalDiscount.toFixed(2)}` : "– – – –"}
                      </span>
                    </div>
                  </div>

                  <div className="my-7 h-px w-full bg-line dark:bg-border" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[16px] text-ink dark:text-foreground">Total</span>
                    <span className="text-[30px] font-semibold tracking-tight text-ink dark:text-foreground">
                      {currency}
                      {Number(cart.finalTotal).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">
                    Final price and applicable discounts will be calculated at checkout.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/checkout")}
                    className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-brand px-8 py-4 text-[16px] text-white transition-colors hover:bg-brand-dark"
                  >
                    Checkout
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="my-7 h-px w-full bg-line dark:bg-border" />

                  <h3 className="font-display text-[22px] font-semibold text-ink dark:text-foreground">Delivery</h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                    Choose delivery or pickup on the next step — the fee is applied at checkout.
                  </p>

                  {(pickupAvailable || storeAddress) && (
                    <>
                      <div className="my-7 h-px w-full bg-line dark:bg-border" />
                      <h3 className="font-display text-[22px] font-semibold text-ink dark:text-foreground">
                        Store pickup
                      </h3>
                      <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                        {pickupAvailable
                          ? `Pickup available${storeAddress ? ` at ${storeAddress}` : ""}.`
                          : "Pickup availability is confirmed at checkout."}
                      </p>
                      <Link
                        href="/contacts"
                        className="mt-4 inline-flex items-center gap-2 text-[15px] text-brand transition-colors hover:text-brand-dark"
                      >
                        Find a store
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}

                  <Link
                    href="/categories"
                    className="mt-7 block w-full rounded-full border border-ink/20 px-8 py-4 text-center text-[15px] text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Responsibility note */}
        <section className="bg-background py-12">
          <div className="mx-auto flex max-w-[1560px] flex-col items-center px-4 text-center sm:px-6 lg:px-10">
            <span className="eyebrow eyebrow-center">Shop responsibly</span>
            <p className="mt-4 max-w-3xl text-[15px] leading-[1.7] text-ink-soft dark:text-foreground/70">
              Please enjoy responsibly. Item availability, pricing and delivery options may vary by location.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
