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

  return JSON.parse(cartData)
}

export function saveCart(cart: Cart): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }
}

export function calculateCartTotals(items: CartItem[]): Cart {
  const subTotal = items.reduce((sum, item) => sum + Number(item.subTotal || 0), 0)
  const totalTax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0)
  const finalTotal = subTotal + totalTax
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  return {
    items,
    totalItems,
    subTotal,
    totalTax,
    finalTotal,
  }
}

export function addToCart(item: CartItem): Cart {
  const cart = getCart()

  // Check if item already exists (same product and modifiers)
  const existingItemIndex = cart.items.findIndex(
    (i) => i.productId === item.productId && JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers),
  )

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += item.quantity
    cart.items[existingItemIndex].subTotal += item.subTotal
    cart.items[existingItemIndex].tax += item.tax
  } else {
    cart.items.push(item)
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
