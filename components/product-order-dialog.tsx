"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Minus, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

interface ProductOrderDialogProps {
  product: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductOrderDialog({ product, open, onOpenChange }: ProductOrderDialogProps) {
  const [fullProduct, setFullProduct] = useState<any>(product)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariation, setSelectedVariation] = useState<string>("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [unavailableAction, setUnavailableAction] = useState("remove")
  const [modifierGroups, setModifierGroups] = useState<any[]>([])
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    if (open && product) {
      // Reset state when dialog opens
      setQuantity(1)
      setSelectedVariation("")
      setSpecialInstructions("")
      setUnavailableAction("remove")
      setSelectedModifiers([])
      
      // Load full product details to get modifier groups
      loadProductDetails()
    }
  }, [open, product?._id])

  const loadProductDetails = async () => {
    if (!product?._id) return
    
    try {
      setLoading(true)
      const response = await api.product.getById(product._id)
      const productData = response.data || response
      setFullProduct(productData)
      
      // Load modifiers if product has modifier groups
      if (productData.modifierGroups?.length > 0) {
        await loadModifiers(productData.modifierGroups)
      } else {
        setModifierGroups([])
      }
    } catch (error) {
      console.error("Error loading product details:", error)
      // Fallback to original product data
      setFullProduct(product)
    } finally {
      setLoading(false)
    }
  }

  const loadModifiers = async (groupIds: string[]) => {
    try {
      setLoading(true)
      const modifierPromises = groupIds.map((groupId) => api.modifier.listByGroup(groupId, 1, 50))
      const responses = await Promise.all(modifierPromises)
      const modifierData = responses.map((res) => res.data || res)
      setModifierGroups(modifierData)
    } catch (error) {
      console.error("Error loading modifiers:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    let basePrice = Number(fullProduct?.price || product.price)
    
    // Add variation price if selected
    if (selectedVariation) {
      const variation = modifierGroups
        .flatMap((g) => g.modifiers || [])
        .find((m: any) => m._id === selectedVariation)
      if (variation && variation.price) {
        basePrice = Number(variation.price)
      }
    }
    
    // Add modifier prices
    const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + Number(mod.price || 0), 0)
    
    return (basePrice + modifierPrice) * quantity
  }

  const handleAddToCart = () => {
    const TAX_RATE = 0.0832
    const total = calculateTotal()
    
    let finalPrice = Number(fullProduct?.price || product.price)
    if (selectedVariation) {
      const variation = modifierGroups
        .flatMap((g) => g.modifiers || [])
        .find((m: any) => m._id === selectedVariation)
      if (variation && variation.price) {
        finalPrice = Number(variation.price)
      }
    }

    const cartItem = {
      productId: fullProduct?._id || product._id,
      name: fullProduct?.name || product.name,
      price: finalPrice,
      quantity,
      modifiers: [
        ...(selectedVariation ? [{ modifierId: selectedVariation, name: "Variation", price: finalPrice - Number(fullProduct?.price || product.price) }] : []),
        ...selectedModifiers.map((mod) => ({
          modifierId: mod._id,
          name: mod.name,
          price: mod.price,
        })),
      ],
      image: fullProduct?.image || product.image,
      subTotal: total,
      tax: total * TAX_RATE,
      discount: 0,
      specialInstructions,
      unavailableAction,
    }

    addToCart(cartItem)
    toast({
      title: "Added to cart",
      description: `${fullProduct?.name || product.name} has been added to your cart.`,
    })
    onOpenChange(false)
  }

  if (!product) return null

  const displayProduct = fullProduct || product
  const basePrice = Number(displayProduct.price)
  const discount = displayProduct.discount || 0
  const originalPrice = discount > 0 ? basePrice / (1 - discount / 100) : basePrice
  const dialogTitle = displayProduct?.name || product?.name || "Product details"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto p-0"
        showCloseButton={false}
      >
        {/* Product Image */}
        <div className="relative h-64 w-full overflow-hidden">
          <img
            src={displayProduct.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop&q=${encodeURIComponent(displayProduct.name)}`}
            alt={displayProduct.name}
            className="h-full w-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full bg-white/90 hover:bg-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle
              className={cn(
                "text-2xl font-bold text-gray-900 dark:text-white",
                loading && "sr-only",
              )}
            >
              {dialogTitle}
            </DialogTitle>
            {!loading && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    ${basePrice.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        ${originalPrice.toFixed(2)}
                      </span>
                      <span className="rounded-full bg-pink-100 px-2 py-1 text-xs font-semibold text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                        {discount}% off
                      </span>
                    </>
                  )}
                </div>
                {displayProduct.description && (
                  <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                    {displayProduct.description}
                  </DialogDescription>
                )}
              </>
            )}
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
            </div>
          ) : (
            <>

              {/* Variations/Modifiers */}
              {modifierGroups.length > 0 && (
                <div className="mt-6 space-y-4">
                  {modifierGroups.map((group) => {
                    const isRequired = group.required || group.selectType === "single"
                    const isVariation = group.name?.toLowerCase().includes("variation") || isRequired

                    return (
                      <div key={group._id} className="rounded-lg bg-pink-50 p-4 dark:bg-pink-950/20">
                        <div className="mb-3 flex items-center justify-between">
                          <Label className="text-base font-semibold text-gray-900 dark:text-white">
                            {group.name}
                          </Label>
                          <span className="rounded-full bg-pink-200 px-2 py-1 text-xs font-medium text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
                            {isRequired ? "Required" : "Optional"}
                          </span>
                        </div>
                        {group.modifiers && group.modifiers.length > 0 && (
                          <>
                            {isVariation ? (
                              // Radio buttons for variations (single select)
                              <RadioGroup
                                value={selectedVariation}
                                onValueChange={setSelectedVariation}
                                className="space-y-3"
                              >
                                {group.modifiers.map((modifier: any) => {
                                  const modPrice = Number(modifier.price || 0)
                                  const modTotal = basePrice + modPrice
                                  return (
                                    <div
                                      key={modifier._id}
                                      className="flex items-center justify-between rounded-lg border-2 border-transparent bg-white p-3 transition-colors hover:border-pink-300 dark:bg-gray-800"
                                    >
                                      <div className="flex items-center gap-3">
                                        <RadioGroupItem value={modifier._id} id={modifier._id} />
                                        <Label
                                          htmlFor={modifier._id}
                                          className="cursor-pointer font-medium text-gray-900 dark:text-white"
                                        >
                                          {modifier.name}
                                        </Label>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-pink-600 dark:text-pink-400">
                                          ${modTotal.toFixed(2)}
                                        </div>
                                        {modPrice > 0 && originalPrice > basePrice && (
                                          <div className="text-xs text-gray-400 line-through">
                                            ${(modTotal + modPrice).toFixed(2)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </RadioGroup>
                            ) : (
                              // Checkboxes for add-ons (multi select)
                              <div className="space-y-3">
                                {group.modifiers.map((modifier: any) => {
                                  const modPrice = Number(modifier.price || 0)
                                  const isSelected = selectedModifiers.some((m) => m._id === modifier._id)
                                  return (
                                    <div
                                      key={modifier._id}
                                      className="flex items-center justify-between rounded-lg border-2 border-transparent bg-white p-3 transition-colors hover:border-pink-300 dark:bg-gray-800"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          id={modifier._id}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedModifiers([...selectedModifiers, modifier])
                                            } else {
                                              setSelectedModifiers(selectedModifiers.filter((m) => m._id !== modifier._id))
                                            }
                                          }}
                                        />
                                        <Label
                                          htmlFor={modifier._id}
                                          className="cursor-pointer font-medium text-gray-900 dark:text-white"
                                        >
                                          {modifier.name}
                                        </Label>
                                      </div>
                                      {modPrice > 0 && (
                                        <div className="text-pink-600 dark:text-pink-400">
                                          +${modPrice.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

          {/* Special Instructions */}
          <div className="mt-6">
            <Label className="mb-2 block text-base font-semibold text-gray-900 dark:text-white">
              Special instructions
            </Label>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Special requests are subject to the restaurant's approval. Tell us here!
            </p>
            <Input
              placeholder="e.g. No mayo"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full"
            />
          </div>

          {/* If this item is not available */}
          <div className="mt-6">
            <Label className="mb-2 block text-base font-semibold text-gray-900 dark:text-white">
              If this item is not available
            </Label>
            <select
              value={unavailableAction}
              onChange={(e) => setUnavailableAction(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="remove">Remove it from my order</option>
              <option value="replace">Replace with similar item</option>
              <option value="cancel">Cancel my order</option>
            </select>
          </div>

              {/* Quantity and Add to Cart - Fixed at bottom */}
              <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 rounded-full"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 rounded-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
                Add to cart - ${calculateTotal().toFixed(2)}
              </Button>
            </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

