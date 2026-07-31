"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Minus, Plus, ArrowLeft } from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
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
    const basePrice = Number(product.price) * quantity
    return basePrice
  }

  const handleAddToCart = () => {
    const TAX_RATE = 0.0832
    const total = calculateTotal()

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 text-center">
          <p className="text-muted-foreground">Product not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image || `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-balance text-3xl font-bold text-foreground">{product.name}</h1>
              {product.description && <p className="mt-2 text-muted-foreground">{product.description}</p>}
              <p className="mt-4 text-3xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center space-x-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-primary">${calculateTotal().toFixed(2)}</span>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="w-full">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
