"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { api } from "@/lib/api"
import { getStoreFromSubdomain } from "@/lib/store"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Utensils, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"

const ITEMS_PER_PAGE = 12

export default function CategoriesPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const router = useRouter()
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    loadStore()
  }, [])

  useEffect(() => {
    if (store) {
      loadDepartments()
      loadAllProducts()
    }
  }, [store])

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  const loadStore = async () => {
    const storeData = await getStoreFromSubdomain()
    setStore(storeData)
  }

  const loadDepartments = async () => {
    try {
      const response = await api.department.list({ storeId: store._id, page: 1, limit: 100 })
      setDepartments(response.data || [])
    } catch (error) {
      console.error("Error loading departments:", error)
    }
  }

  const loadAllProducts = async () => {
    try {
      setLoading(true)
      // Load all products (increase limit to get all products)
      const response = await api.product.list({
        storeId: store._id,
        page: 1,
        limit: 1000, // Load more products to handle pagination
        order: "desc",
      })
      const products = response.data?.products || response.products || []
      setAllProducts(products)
      // Debug: Log first product to see department structure
      if (products.length > 0) {
        console.log("Sample product department structure:", {
          department: products[0].department,
          departmentId: products[0].departmentId,
          fullProduct: products[0]
        })
      }
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (departmentId: string) => {
    setSelectedCategory(departmentId === selectedCategory ? "" : departmentId)
    setCurrentPage(1) // Reset to first page when category changes
    setCategoryMenuOpen(false) // Close the menu after selection
  }

  const handleAddToCart = (product: any) => {
    const TAX_RATE = 0.0832

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      modifiers: [],
      image: product.image,
      subTotal: Number(product.price),
      tax: Number(product.price) * TAX_RATE,
      discount: 0,
    }

    addToCart(cartItem)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Filter products based on selected category
  // Check multiple possible field names for department
  const filteredProducts = selectedCategory
    ? allProducts.filter((p) => {
        // Try different possible field names and formats
        // Product might have: p.department (string ID), p.department._id (object), or p.departmentId
        let productDeptId = null
        
        if (p.department) {
          if (typeof p.department === 'string') {
            productDeptId = p.department
          } else if (p.department._id) {
            productDeptId = p.department._id
          } else if (p.department.id) {
            productDeptId = p.department.id
          }
        } else if (p.departmentId) {
          productDeptId = p.departmentId
        }
        
        // Compare both as strings to handle type mismatches
        const match = productDeptId && String(productDeptId) === String(selectedCategory)
        
        // Debug logging for troubleshooting
        if (allProducts.indexOf(p) < 5 && selectedCategory) {
          console.log("Filtering product:", {
            productName: p.name,
            productDept: p.department,
            productDeptId: productDeptId,
            selectedCategory: selectedCategory,
            match: match
          })
        }
        
        return match
      })
    : allProducts // Show all products when "ALL" is selected

  // Get popular products (5-7 items) from all products
  const popularProducts = allProducts.slice(0, 7)

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Handle page navigation - scroll to products section instead of top
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to products section instead of top
    const productsSection = document.getElementById("products-section")
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section with Menu Text */}
        <section className="relative h-[350px] overflow-hidden sm:h-[400px]">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&h=1080&fit=crop)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-10 h-32 w-32 rounded-full border border-white/10 blur-2xl" />
            <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full border border-white/10 blur-2xl" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex h-full items-center justify-center">
            <div className="mx-auto max-w-4xl px-4 text-center">
              {/* Breadcrumb */}
              <div className="mb-6 flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-wider text-white/90">
                <Link 
                  href="/" 
                  className="transition-colors hover:text-orange-400"
                >
                  Home
                </Link>
                <span className="text-white/50">/</span>
                <span className="text-orange-400">Menu</span>
              </div>
              
              {/* Main Title */}
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-400 sm:w-20" />
                <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  Our Menu
                </h1>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-400 sm:w-20" />
              </div>
              
              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-base text-white/90 sm:text-lg md:text-xl">
                Discover our delicious selection of dishes crafted with passion and quality ingredients
              </p>
              
              {/* Decorative Icon */}
              <div className="mt-8 flex justify-center">
                <div className="rounded-full bg-orange-500/20 p-3 backdrop-blur-sm">
                  <Utensils className="h-6 w-6 text-orange-400 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Menu Section - Right after hero */}
        <section className="bg-white py-6 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {departments.length === 0 ? (
              <div className="py-12 text-center">
                <Utensils className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No categories found.</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                {/* Selected Category Display */}
                {selectedCategory && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                      {departments.find((d) => d._id === selectedCategory)?.name.toUpperCase() || "SELECTED"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory("")
                        setCurrentPage(1)
                      }}
                      className="h-8 w-8 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Hamburger Menu Button */}
                <Button
                  onClick={() => setCategoryMenuOpen(true)}
                  className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  <Menu className="mr-2 h-5 w-5" />
                  {selectedCategory ? "Change Category" : "Select Category"}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Category Selection Dialog */}
        <Dialog open={categoryMenuOpen} onOpenChange={setCategoryMenuOpen}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Select Category
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {/* All Button */}
                <Button
                  onClick={() => {
                    setSelectedCategory("")
                    setCurrentPage(1)
                    setCategoryMenuOpen(false)
                  }}
                  className={`w-full justify-start rounded-lg px-4 py-3 text-left text-sm font-semibold uppercase transition-all ${
                    selectedCategory === ""
                      ? "bg-orange-500 text-white shadow-lg hover:bg-orange-600 dark:bg-orange-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  ALL
                </Button>
                
                {/* Category Buttons - Loaded from backend */}
                {departments.map((dept) => (
                  <Button
                    key={dept._id}
                    onClick={() => handleCategoryClick(dept._id)}
                    className={`w-full justify-start rounded-lg px-4 py-3 text-left text-sm font-semibold uppercase transition-all ${
                      selectedCategory === dept._id
                        ? "bg-orange-500 text-white shadow-lg hover:bg-orange-600 dark:bg-orange-500"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {dept.name.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Products Section with Pagination */}
        <section id="products-section" className="bg-gray-50 py-12 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                {selectedCategory ? departments.find((d) => d._id === selectedCategory)?.name?.toUpperCase() || "PRODUCTS" : "ALL PRODUCTS"}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {selectedCategory ? "Category Products" : "Clients' Most Popular Choice"}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                {selectedCategory && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    (Filtered by: {departments.find((d) => d._id === selectedCategory)?.name || selectedCategory})
                  </span>
                )}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              onClick={() => handlePageChange(page)}
                              className={
                                currentPage === page
                                  ? "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500"
                                  : "border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400"
                              }
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-gray-500">...</span>
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Page Info */}
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
              </>
            ) : (
              <Card className="py-12 text-center">
                <Utensils className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No products found.</p>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}


