"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Star } from "lucide-react"
import Link from "next/link"
import { ProductOrderDialog } from "@/components/product-order-dialog"

interface ProductCardProps {
  product: {
    _id: string
    name: string
    price: number
    description?: string
    image?: string
    department?: string
    kitchen?: string
  }
  onAddToCart: (product: any) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  // Generate a random rating for display (between 3.5 and 5.0)
  const rating = (Math.random() * 1.5 + 3.5).toFixed(2)
  
  return (
    <>
      <Card className="group overflow-hidden border-2 border-transparent transition-all hover:border-orange-500 hover:shadow-xl dark:hover:border-orange-400">
        <Link href={`/product/${product._id}`}>
          <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={product.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            {/* Rating Badge */}
            <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-900 shadow-md dark:bg-gray-900/90 dark:text-white">
              <Star className="mr-1 inline h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating}
            </div>
          </div>
        </Link>
        <CardContent className="p-5">
          <Link href={`/product/${product._id}`}>
            <h3 className="text-balance text-lg font-bold leading-tight text-gray-900 transition-colors hover:text-orange-600 dark:text-white dark:hover:text-orange-400">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
          )}
          {product.department && (
            <div className="mt-2">
              <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                {product.department}
              </span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${Number(product.price).toFixed(2)}
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0">
          <Button 
            onClick={(e) => {
              e.preventDefault()
              setDialogOpen(true)
            }}
            className="w-full bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Order
          </Button>
        </CardFooter>
      </Card>

      <ProductOrderDialog
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
