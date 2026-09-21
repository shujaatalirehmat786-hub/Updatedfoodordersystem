"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageHero } from "@/components/page-hero"
import { ProductCard } from "@/components/product-card"
import { api, getProductPrice } from "@/lib/api"
import { getStoreFromSubdomain, getStoreName } from "@/lib/store"
import { getCurrencySymbol, getProductDepartmentId, getProductDepartmentName } from "@/lib/media"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

const ITEMS_PER_PAGE = 12

function CategoriesPageContent() {
  const searchParams = useSearchParams()
  const [departments, setDepartments] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
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

  // Deep links from the home page and footer arrive as ?category=<id>
  useEffect(() => {
    try {
      const categoryParam = searchParams?.get("category")
      if (categoryParam) {
        setSelectedCategory(categoryParam)
      }
    } catch (error) {
      console.log("Search params not available")
    }
  }, [searchParams])

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

  const handleAddToCart = (product: any) => {
    const TAX_RATE = 0.0832
    const productPrice = getProductPrice(product)

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: productPrice,
      quantity: 1,
      modifiers: [],
      image: product.image,
      subTotal: productPrice,
      tax: productPrice * TAX_RATE,
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
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  // Filter products based on selected category. Products expose their
  // department as a string id, a nested object, or `departmentId`.
  const filteredProducts = selectedCategory
    ? allProducts.filter((product) => {
        const productDeptId = getProductDepartmentId(product)
        return Boolean(productDeptId) && String(productDeptId) === String(selectedCategory)
      })
    : allProducts

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Handle page navigation - scroll to products section instead of top
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const productsSection = document.getElementById("products-section")
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const storeName = getStoreName(store) || store?.subdomain || ""
  const currency = getCurrencySymbol(store)
  const activeDepartment = departments.find((department) => department._id === selectedCategory)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <PageHero
          eyebrow="Explore our menu"
          title={activeDepartment ? activeDepartment.name : "From breakfast to dinner, there's something for everyone."}
          description={
            activeDepartment?.description ||
            `Every dish, price and category on this page is published live by ${storeName || "this kitchen"}.`
          }
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Our Menu" },
          ]}
        />

        {/* Category filters */}
        {departments.length > 0 && (
          <section className="border-b border-line/70 bg-background py-6 dark:border-border">
            <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className={`shrink-0 rounded-full border px-6 py-3 text-[15px] transition-colors ${
                    selectedCategory === ""
                      ? "border-brand bg-brand text-white"
                      : "border-ink/20 text-ink hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                  }`}
                >
                  All
                </button>
                {departments.map((department) => (
                  <button
                    key={department._id}
                    type="button"
                    onClick={() => setSelectedCategory(department._id === selectedCategory ? "" : department._id)}
                    className={`shrink-0 rounded-full border px-6 py-3 text-[15px] transition-colors ${
                      selectedCategory === department._id
                        ? "border-brand bg-brand text-white"
                        : "border-ink/20 text-ink hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                    }`}
                  >
                    {department.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Products */}
        <section id="products-section" className="surface-paper py-16 lg:py-20">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="display-heading text-[26px] text-ink sm:text-[34px] dark:text-foreground">
                {activeDepartment ? activeDepartment.name : "All dishes"}
              </h2>
              <p className="text-[15px] text-ink-soft dark:text-foreground/70">
                {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                {totalPages > 1 ? ` · page ${currentPage} of ${totalPages}` : ""}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      variant="featured"
                      currency={currency}
                      tag={selectedCategory ? null : getProductDepartmentName(product, departments)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-14 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => handlePageChange(page)}
                              className={`h-11 min-w-[44px] rounded-full px-3 text-[15px] transition-colors ${
                                currentPage === page
                                  ? "bg-brand text-white"
                                  : "border border-ink/20 text-ink hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        }
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
                              …
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-line bg-card py-20 text-center dark:border-border">
                <p className="font-display text-[24px] font-semibold text-ink dark:text-foreground">No dishes here yet</p>
                <p className="mt-3 text-[15px] text-muted-foreground">
                  Nothing is published in this category right now.
                </p>
                <Link
                  href="/categories"
                  onClick={() => setSelectedCategory("")}
                  className="mt-7 inline-block rounded-full bg-brand px-8 py-3.5 text-[15px] text-white transition-colors hover:bg-brand-dark"
                >
                  View all dishes
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  )
}
