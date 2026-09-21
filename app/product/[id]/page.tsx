"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Minus, Plus, ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { api, getProductPrice } from "@/lib/api"
import { getCurrencySymbol, getProductDepartmentName, getProductImage } from "@/lib/media"
import { useCart } from "@/hooks/use-cart"
import { useStore } from "@/hooks/use-store"
import { useToast } from "@/hooks/use-toast"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
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

  const calculateTotal = () => {
    const basePrice = getProductPrice(product) * quantity
    return basePrice
  }

  const handleAddToCart = () => {
    const TAX_RATE = 0.0832
    const total = calculateTotal()

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: getProductPrice(product),
      quantity,
      modifiers: [],
      image: product.image,
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
  const unitPrice = getProductPrice(product)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="surface-paper py-10 lg:py-16">
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-8 inline-flex items-center gap-2 text-[15px] text-ink-soft transition-colors hover:text-brand dark:text-foreground/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="grid gap-10 border border-line/80 bg-card p-4 lg:grid-cols-2 lg:gap-16 lg:p-8 dark:border-border">
            <div className="overflow-hidden rounded-[4px] bg-cream">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            </div>

            <div className="flex flex-col py-2">
              {departmentName && <span className="eyebrow">{departmentName}</span>}

              <h1 className="display-heading mt-5 text-[30px] text-ink sm:text-[42px] dark:text-foreground">
                {product.name}
              </h1>

              {product.description && (
                <p className="mt-5 text-[15px] leading-[1.75] text-ink-soft dark:text-foreground/70">
                  {product.description}
                </p>
              )}

              <p className="mt-7 text-[34px] font-semibold tracking-tight text-ink dark:text-foreground">
                {currency}
                {unitPrice.toFixed(2)}
              </p>

              <div className="mt-8 h-px w-full bg-line dark:bg-border" />

              <div className="mt-8 flex items-center gap-5">
                <span className="text-[15px] text-ink-soft dark:text-foreground/70">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40 dark:border-foreground/25 dark:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-[18px] font-semibold text-ink dark:text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[22px] font-semibold text-ink dark:text-foreground">Total</span>
                  <span className="text-[26px] font-semibold text-brand">
                    {currency}
                    {calculateTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="mt-6 w-full rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
