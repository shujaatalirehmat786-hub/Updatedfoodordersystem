"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, FileText, Loader2, Minus, Plus, Share2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { api, getProductPrice } from "@/lib/api"
import {
  getCurrencySymbol,
  getProductDepartmentId,
  getProductDepartmentName,
  getProductImage,
} from "@/lib/media"
import { useCart } from "@/hooks/use-cart"
import { useStore } from "@/hooks/use-store"
import { useToast } from "@/hooks/use-toast"

type SelectionMap = Record<string, string[]>

function groupId(group: any, index: number): string {
  return String(group?._id || group?.id || index)
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<SelectionMap>({})
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { store } = useStore()
  const { toast } = useToast()

  useEffect(() => {
    loadProduct()
  }, [params.id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const response = await api.product.getById(params.id as string)
      const productData = response.data || response
      setProduct(productData)
      setQuantity(1)
      setSelections({})
    } catch (error) {
      console.error("[v0] Error loading product:", error)
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Related dishes come from the same department as the current product.
  useEffect(() => {
    let cancelled = false
    const loadRelated = async () => {
      if (!store?._id || !product?._id) return
      try {
        const response = await api.product.list({
          storeId: store._id,
          page: 1,
          limit: 100,
          department: getProductDepartmentId(product) || undefined,
          order: "desc",
        })
        const items = response.data?.products || response.products || []
        if (!cancelled) {
          setRelated(items.filter((item: any) => String(item._id) !== String(product._id)).slice(0, 8))
        }
      } catch (error) {
        console.error("[v0] Error loading related products:", error)
      }
    }
    void loadRelated()
    return () => {
      cancelled = true
    }
  }, [store?._id, product?._id])

  const modifierGroups: any[] = useMemo(
    () => (Array.isArray(product?.modifierGroups) ? product.modifierGroups : []),
    [product],
  )

  /** Flattened list of the modifiers the guest has picked, in cart shape. */
  const chosenModifiers = useMemo(() => {
    const chosen: Array<{ modifierId: string; name: string; price: number }> = []
    for (const [index, group] of modifierGroups.entries()) {
      const picked = selections[groupId(group, index)] || []
      for (const modifier of group?.modifiers || []) {
        if (picked.includes(String(modifier._id))) {
          chosen.push({
            modifierId: String(modifier._id),
            name: String(modifier.name || ""),
            price: Number(modifier.priceAdjustment || 0),
          })
        }
      }
    }
    return chosen
  }, [modifierGroups, selections])

  const basePrice = getProductPrice(product)
  const modifiersTotal = chosenModifiers.reduce((sum, modifier) => sum + modifier.price, 0)
  const unitPrice = basePrice + modifiersTotal
  const orderTotal = unitPrice * quantity

  const missingRequired = modifierGroups.filter((group, index) => {
    if (!group?.isRequired) return false
    return (selections[groupId(group, index)] || []).length === 0
  })

  const toggleModifier = (group: any, index: number, modifierId: string) => {
    const key = groupId(group, index)
    const maxSelectable = Number(group?.maxSelectable || 1)
    setSelections((current) => {
      const picked = current[key] || []
      if (picked.includes(modifierId)) {
        return { ...current, [key]: picked.filter((id) => id !== modifierId) }
      }
      if (maxSelectable <= 1) {
        return { ...current, [key]: [modifierId] }
      }
      if (picked.length >= maxSelectable) {
        return { ...current, [key]: [...picked.slice(1), modifierId] }
      }
      return { ...current, [key]: [...picked, modifierId] }
    })
  }

  const handleAddToCart = () => {
    if (missingRequired.length > 0) {
      toast({
        title: "Choose an option",
        description: `Please select ${missingRequired.map((group) => group.name).join(", ")}.`,
        variant: "destructive",
      })
      return
    }

    const TAX_RATE = 0.0832
    const total = orderTotal
    // Keep a real image URL on the cart line when one resolves; never a data
    // URI placeholder. `image` is not part of the order payload.
    const resolvedImage = getProductImage(product)
    const cartImage = resolvedImage.startsWith("data:") ? product.image : resolvedImage

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: unitPrice,
      quantity,
      modifiers: chosenModifiers,
      image: cartImage,
      subTotal: total,
      tax: total * TAX_RATE,
      discount: 0,
    }

    addToCart(cartItem)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
    router.push("/")
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: product?.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied", description: "Share this dish with anyone." })
    } catch {
      // The guest dismissed the share sheet — nothing to report.
    }
  }

  if (loading) {
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-[1560px] px-4 py-32 text-center sm:px-6 lg:px-10">
          <h1 className="display-heading text-[32px] text-ink dark:text-foreground">Dish not found</h1>
          <p className="mt-4 text-[15px] text-muted-foreground">This item is no longer on the menu.</p>
          <Link
            href="/categories"
            className="mt-8 inline-block rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
          >
            Back to the menu
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const currency = getCurrencySymbol(store)
  const departmentName = getProductDepartmentName(product)
  const productImage = getProductImage(product)
  const orders = Number(product.saleCount || 0)
  const departmentId = getProductDepartmentId(product)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ------------------------------------------------------ Product detail */}
        <section className="surface-paper py-10 lg:py-16">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-8 inline-flex items-center gap-2 text-[15px] text-ink-soft transition-colors hover:text-brand dark:text-foreground/70"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="overflow-hidden bg-cream">
                <img src={productImage} alt={product.name} className="aspect-square w-full object-cover" />
              </div>

              <div className="flex flex-col">
                {departmentName && <span className="eyebrow">{departmentName}</span>}

                <h1 className="display-heading mt-5 text-[32px] text-ink sm:text-[44px] lg:text-[52px] dark:text-foreground">
                  {product.name}
                </h1>

                <div className="mt-4 flex items-center gap-4">
                  {orders > 0 && (
                    <span className="text-[15px] text-ink-soft dark:text-foreground/70">
                      {orders.toLocaleString()} {orders === 1 ? "order" : "orders"} placed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share this dish"
                    className="text-ink-soft transition-colors hover:text-brand dark:text-foreground/70"
                  >
                    <Share2 className="h-[18px] w-[18px]" />
                  </button>
                </div>

                {product.description && (
                  <p className="mt-5 max-w-xl text-[15px] leading-[1.75] text-ink-soft dark:text-foreground/75">
                    {product.description}
                  </p>
                )}

                <p className="mt-7 text-[34px] font-semibold tracking-tight text-brand">
                  {currency}
                  {basePrice.toFixed(2)}
                </p>

                {/* Option groups published on the product */}
                {modifierGroups.map((group, index) => {
                  const key = groupId(group, index)
                  const picked = selections[key] || []
                  const maxSelectable = Number(group?.maxSelectable || 1)
                  return (
                    <div key={key} className="mt-8">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink dark:text-foreground">
                        {group.name}
                        {group.isRequired && <span className="ml-1 text-brand">*</span>}
                        {maxSelectable > 1 && (
                          <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
                            choose up to {maxSelectable}
                          </span>
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3">
                        {(group.modifiers || []).map((modifier: any) => {
                          const id = String(modifier._id)
                          const active = picked.includes(id)
                          const adjustment = Number(modifier.priceAdjustment || 0)
                          return (
                            <button
                              key={id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => toggleModifier(group, index, id)}
                              className={`rounded-full border px-6 py-3 text-[15px] transition-colors ${
                                active
                                  ? "border-brand bg-brand-soft text-brand"
                                  : "border-line text-ink hover:border-brand hover:text-brand dark:border-border dark:text-foreground"
                              }`}
                            >
                              {modifier.name}
                              {adjustment > 0 && (
                                <span className="ml-2 text-[13px]">
                                  +{currency}
                                  {adjustment.toFixed(2)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                <div className="mt-8">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink dark:text-foreground">
                    Quantity
                  </p>
                  <div className="mt-3 inline-flex items-center gap-5 rounded-full border border-line px-5 py-2.5 dark:border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="text-ink transition-colors hover:text-brand disabled:pointer-events-none disabled:opacity-40 dark:text-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[24px] text-center text-[17px] font-semibold text-ink dark:text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Increase quantity"
                      className="text-ink transition-colors hover:text-brand dark:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="mt-9 w-full max-w-md rounded-full bg-brand px-9 py-5 text-[17px] text-white transition-colors hover:bg-brand-dark"
                >
                  Add to Order — {currency}
                  {orderTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Description */}
        {product.description && (
          <section className="surface-paper pb-16 lg:pb-20">
            <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand" />
                <h2 className="font-sans text-[15px] font-semibold uppercase tracking-[0.08em] text-brand">
                  Description
                </h2>
              </div>
              <div className="mt-5 h-px w-full bg-line dark:bg-border" />
              <p className="mt-7 max-w-5xl text-[15px] leading-[1.9] text-ink-soft dark:text-foreground/75">
                {product.description}
              </p>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------ About this dish */}
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto grid max-w-[1560px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
            <img src={productImage} alt={product.name} className="aspect-[4/3] w-full object-cover" />

            <div>
              {departmentName && <span className="eyebrow">{departmentName}</span>}
              <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[38px] lg:text-[44px] dark:text-foreground">
                About this dish
              </h2>
              <p className="mt-6 max-w-xl text-[15px] leading-[1.8] text-ink-soft dark:text-foreground/70">
                {product.name} is prepared to order in our kitchen, using fresh ingredients and the spice blends this
                menu is built on.
              </p>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.8] text-ink-soft dark:text-foreground/70">
                Every plate is made when you order it, so it reaches you exactly the way it leaves the kitchen.
              </p>

              {departmentId && (
                <Link
                  href={`/categories?category=${departmentId}`}
                  className="mt-9 inline-flex items-center gap-3 rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
                >
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- You might also like */}
        {related.length > 0 && (
          <section className="surface-paper py-16 lg:py-20">
            <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
                <div>
                  <span className="eyebrow">More like this</span>
                  <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[40px] lg:text-[46px] dark:text-foreground">
                    You might also like
                  </h2>
                </div>
                <p className="text-[15px] leading-[1.7] text-ink-soft lg:pb-3 dark:text-foreground/70">
                  Discover more dishes selected based on your current choice.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {related.slice(0, 4).map((item) => (
                  <ProductCard
                    key={item._id}
                    product={item}
                    onAddToCart={() => {}}
                    variant="featured"
                    currency={currency}
                    tag={getProductDepartmentName(item)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------ CTA band */}
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden bg-ink">
              <img
                src="/savera/band-biryani.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/45" />

              <div className="relative flex flex-col items-center px-6 py-16 text-center sm:px-12 lg:py-24">
                <span className="eyebrow eyebrow-center eyebrow-light normal-case">Ready to order?</span>

                <h2 className="display-heading mt-5 max-w-5xl text-[28px] text-white sm:text-[40px] lg:text-[46px]">
                  Your favorite flavors are waiting.
                </h2>

                <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-white/85">
                  Choose your favorites, customize your order, and enjoy freshly prepared Indian food.
                </p>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/categories"
                    className="rounded-full bg-white px-9 py-4 text-[15px] text-ink transition-colors hover:bg-brand hover:text-white"
                  >
                    Start Your Order
                  </Link>
                  <Link
                    href="/"
                    className="rounded-full border border-white/60 px-9 py-4 text-[15px] text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
                  >
                    View Categories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
