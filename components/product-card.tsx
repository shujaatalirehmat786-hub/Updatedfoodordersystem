"use client"

import { useState } from "react"
import Link from "next/link"
import { ProductOrderDialog } from "@/components/product-order-dialog"
import { getProductPrice } from "@/lib/api"
import { getProductImage } from "@/lib/media"

interface ProductCardProps {
  product: {
    _id: string
    name: string
    price: number
    description?: string
    image?: string
    department?: any
    kitchen?: string
  }
  onAddToCart: (product: any) => void
  /** "featured" shows the Order Now action, "compact" is the menu-grid card. */
  variant?: "featured" | "compact"
  /** Small label shown over the image (the design uses the category name). */
  tag?: string | null
  /** Currency symbol published by the store. */
  currency?: string
}

export function ProductCard({
  product,
  onAddToCart,
  variant = "featured",
  tag = null,
  currency = "$",
}: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const productPrice = getProductPrice(product)
  const productImage = getProductImage(product)

  return (
    <>
      <article className="group flex h-full flex-col rounded-[10px] border border-line/80 bg-card p-3 transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(17,17,17,0.10)] dark:border-border">
        <Link href={`/product/${product._id}`} className="relative block overflow-hidden rounded-[6px]">
          <div className="aspect-[330/304] w-full overflow-hidden bg-cream">
            <img
              src={productImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          {tag && (
            <span className="absolute left-2.5 top-2.5 rounded-[6px] bg-brand px-3 py-1.5 text-xs text-white">
              {tag}
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col px-1 pt-5">
          <Link href={`/product/${product._id}`}>
            <h3 className="font-display text-[22px] font-semibold leading-tight text-ink transition-colors group-hover:text-brand 2xl:text-[24px] dark:text-foreground">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="mt-2 line-clamp-2 text-[14px] leading-[1.55] text-muted-foreground lg:text-[15px]">{product.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pb-1 pt-5">
            <p className="text-[24px] font-semibold tracking-tight text-ink dark:text-foreground">
              {currency}
              {productPrice.toFixed(2)}
            </p>

            {variant === "featured" && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  setDialogOpen(true)
                }}
                className="rounded-full bg-brand px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-brand-dark lg:text-[15px] 2xl:text-[16px]"
              >
                Order Now
              </button>
            )}
          </div>
        </div>
      </article>

      <ProductOrderDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
