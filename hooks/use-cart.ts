"use client"

import { useState, useEffect } from "react"
import {
  getCart,
  addToCart as addToCartUtil,
  removeFromCart as removeFromCartUtil,
  updateCartItemQuantity as updateCartItemQuantityUtil,
  clearCart as clearCartUtil,
  type Cart,
  type CartItem,
} from "@/lib/cart"

export function useCart() {
  const [cart, setCart] = useState<Cart>(() => getCart())

  useEffect(() => {
    // Listen for cart updates across tabs
    const handleStorageChange = () => {
      setCart(getCart())
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("cart_updated", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("cart_updated", handleStorageChange)
    }
  }, [])

  const addToCart = (item: CartItem) => {
    const updatedCart = addToCartUtil(item)
    setCart(updatedCart)
    window.dispatchEvent(new Event("cart_updated"))
  }

  const removeFromCart = (index: number) => {
    const updatedCart = removeFromCartUtil(index)
    setCart(updatedCart)
    window.dispatchEvent(new Event("cart_updated"))
  }

  const updateQuantity = (index: number, quantity: number) => {
    const updatedCart = updateCartItemQuantityUtil(index, quantity)
    setCart(updatedCart)
    window.dispatchEvent(new Event("cart_updated"))
  }

  const clearCart = () => {
    clearCartUtil()
    setCart(getCart())
    window.dispatchEvent(new Event("cart_updated"))
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }
}
