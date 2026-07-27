"use client"

export interface CartModifier {
  modifierId: string
  name: string
  price: number
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  modifiers: CartModifier[]
  image?: string
  subTotal: number
  tax: number
  discount: number
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  subTotal: number
  totalTax: number
  finalTotal: number
}

const CART_KEY = "food_order_cart"

function normalizeCartItem(item: any): CartItem {
  return {
    productId: String(item?.productId || ""),
    name: String(item?.name || ""),
    price: Number(item?.price || 0),
    quantity: Number(item?.quantity || 1),
    modifiers: Array.isArray(item?.modifiers) ? item.modifiers : [],
    image: item?.image,
    subTotal: Number(item?.subTotal || 0),
    tax: Number(item?.tax || 0),
    discount: Number(item?.discount || 0),
  }
}

export function getCart(): Cart {
  if (typeof window === "undefined") {
    return {
      items: [],
      totalItems: 0,
      subTotal: 0,
      totalTax: 0,
      finalTotal: 0,
    }
  }

  const cartData = localStorage.getItem(CART_KEY)
  if (!cartData) {
    return {
      items: [],
      totalItems: 0,
      subTotal: 0,
      totalTax: 0,
      finalTotal: 0,
    }
  }

  try {
    const parsed = JSON.parse(cartData)
    const items = Array.isArray(parsed?.items) ? parsed.items.map(normalizeCartItem) : []
    return calculateCartTotals(items)
  } catch {
    return {
      items: [],
      totalItems: 0,
      subTotal: 0,
      totalTax: 0,
      finalTotal: 0,
    }
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }
}

export function calculateCartTotals(items: CartItem[]): Cart {
  const normalizedItems = items.map(normalizeCartItem)
  const subTotal = normalizedItems.reduce((sum, item) => sum + Number(item.subTotal || 0), 0)
  const totalTax = normalizedItems.reduce((sum, item) => sum + Number(item.tax || 0), 0)
  const finalTotal = subTotal + totalTax
  const totalItems = normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  return {
    items: normalizedItems,
    totalItems,
    subTotal,
    totalTax,
    finalTotal,
  }
}

export function addToCart(item: CartItem): Cart {
  const cart = getCart()
  const normalizedItem = normalizeCartItem(item)

  // Check if item already exists (same product and modifiers)
  const existingItemIndex = cart.items.findIndex(
    (i) => i.productId === normalizedItem.productId && JSON.stringify(i.modifiers || []) === JSON.stringify(normalizedItem.modifiers || []),
  )

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += normalizedItem.quantity
    cart.items[existingItemIndex].subTotal += normalizedItem.subTotal
    cart.items[existingItemIndex].tax += normalizedItem.tax
  } else {
    cart.items.push(normalizedItem)
  }

  const updatedCart = calculateCartTotals(cart.items)
  saveCart(updatedCart)
  return updatedCart
}

export function removeFromCart(index: number): Cart {
  const cart = getCart()
  cart.items.splice(index, 1)
  const updatedCart = calculateCartTotals(cart.items)
  saveCart(updatedCart)
  return updatedCart
}

export function updateCartItemQuantity(index: number, quantity: number): Cart {
  const cart = getCart()
  if (quantity <= 0) {
    return removeFromCart(index)
  }

  const item = cart.items[index]
  const pricePerUnit = item.subTotal / item.quantity
  const taxPerUnit = item.tax / item.quantity

  item.quantity = quantity
  item.subTotal = pricePerUnit * quantity
  item.tax = taxPerUnit * quantity

  const updatedCart = calculateCartTotals(cart.items)
  saveCart(updatedCart)
  return updatedCart
}

export function clearCart(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CART_KEY)
  }
}
