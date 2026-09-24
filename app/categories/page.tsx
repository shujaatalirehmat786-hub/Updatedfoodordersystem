"use client"

import { useCallback, useState, useEffect, useMemo, useRef, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronDown, LayoutGrid, List, Loader2, SlidersHorizontal } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductOrderDialog } from "@/components/product-order-dialog"
import { api, getProductPrice } from "@/lib/api"
import { getStoreFromSubdomain, getStoreName } from "@/lib/store"
import {
  getCurrencySymbol,
  getDepartmentImage,
  getProductDepartmentId,
  getProductDepartmentName,
  getProductImage,
} from "@/lib/media"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

const PAGE_SIZE = 12

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
]

const PRICE_BANDS = [
  { value: "", label: "Any price", test: () => true },
  { value: "under-10", label: "Under 10", test: (p: number) => p < 10 },
  { value: "10-20", label: "10 – 20", test: (p: number) => p >= 10 && p < 20 },
  { value: "20-plus", label: "20 and above", test: (p: number) => p >= 20 },
]

/** Store names are often stored in all caps, which reads badly inside prose. */
function toProseName(name: string): string {
  if (!name || /[a-z]/.test(name)) return name
  return name.toLowerCase().replace(/(^|[\s.\-'])([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase())
}

/** getProductImage falls back to an inline monogram tile for photo-less records. */
function hasPhoto(product: any): boolean {
  return !getProductImage(product).startsWith("data:")
}

const SWEET_PATTERN = /sweet|dessert|cake|pastry|mousse|cookie|ice.?cream|kulfi|halwa|jamun/i
const BREAKFAST_PATTERN = /breakfast|dosa|idli|vada|tiffin|south/i

/** Menu-grid card: the design puts the category above the name, not on the image. */
function MenuCard({
  product,
  category,
  currency,
  layout,
}: {
  product: any
  category: string | null
  currency: string
  layout: "grid" | "list"
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const price = getProductPrice(product)

  if (layout === "list") {
    return (
      <>
        <article className="flex gap-5 border border-line/80 bg-card p-3 transition-shadow hover:shadow-[0_18px_40px_rgba(17,17,17,0.10)] dark:border-border">
          <Link href={`/product/${product._id}`} className="shrink-0">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="h-32 w-32 rounded-[4px] object-cover sm:h-36 sm:w-44"
            />
          </Link>
          <div className="flex flex-1 flex-col py-1">
            {category && <span className="text-[13px] text-brand">{category}</span>}
            <Link href={`/product/${product._id}`}>
              <h3 className="mt-1 font-display text-[21px] font-semibold text-ink dark:text-foreground">
                {product.name}
              </h3>
            </Link>
            {product.description && (
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-[1.55] text-muted-foreground">
                {product.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              <p className="text-[22px] font-semibold text-ink dark:text-foreground">
                {currency}
                {price.toFixed(2)}
              </p>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="rounded-full bg-brand px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-brand-dark"
              >
                Order Now
              </button>
            </div>
          </div>
        </article>
        <ProductOrderDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    )
  }

  return (
    <>
      <article className="group flex h-full flex-col border border-line/80 bg-card p-3 transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(17,17,17,0.10)] dark:border-border">
        <Link href={`/product/${product._id}`} className="block overflow-hidden rounded-[4px]">
          <div className="aspect-[330/304] w-full overflow-hidden bg-cream">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col px-1 pt-4">
          {category && <span className="text-[13px] text-brand">{category}</span>}

          <Link href={`/product/${product._id}`}>
            <h3 className="mt-1 font-display text-[21px] font-semibold leading-tight text-ink transition-colors group-hover:text-brand dark:text-foreground">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="mt-2 line-clamp-2 text-[14px] leading-[1.55] text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pb-1 pt-5">
            <p className="text-[22px] font-semibold text-ink dark:text-foreground">
              {currency}
              {price.toFixed(2)}
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded-full bg-brand px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-brand-dark"
            >
              Order Now
            </button>
          </div>
        </div>
      </article>

      <ProductOrderDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

/**
 * Horizontal card rail.
 *
 * The cards line up with the section's own left and right edges, exactly as in
 * the design, so the arrows have to live in the page gutter outside that box.
 * There is only room for them out there once the viewport is wide enough
 * (1600px container + 2x76px of clearance); below that they sit centred under
 * the rail, the same placement the design uses for the testimonial carousel.
 */
function Rail({
  children,
  className = "",
  controls = "side",
}: {
  children: React.ReactNode
  className?: string
  /** The design puts the product rails' arrows in the page gutter and the
      testimonial rail's arrows centred underneath it. */
  controls?: "side" | "below"
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const syncScrollState = useCallback(() => {
    const node = railRef.current
    if (!node) return
    const maxScroll = node.scrollWidth - node.clientWidth
    setCanScrollLeft(node.scrollLeft > 1)
    setCanScrollRight(maxScroll > 1 && node.scrollLeft < maxScroll - 1)
  }, [])

  useEffect(() => {
    syncScrollState()
    const node = railRef.current
    if (!node) return
    const observer = new ResizeObserver(syncScrollState)
    observer.observe(node)
    return () => observer.disconnect()
  }, [syncScrollState, children])

  const scrollBy = (direction: 1 | -1) => {
    const node = railRef.current
    if (!node) return
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: "smooth" })
  }

  const arrowBase =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-default disabled:opacity-50"
  const sideControls = controls === "side"
  const prevPlacement = sideControls
    ? "min-[1672px]:absolute min-[1672px]:-left-[76px] min-[1672px]:top-1/2 min-[1672px]:mt-0 min-[1672px]:-translate-y-1/2"
    : ""
  const nextPlacement = sideControls
    ? "min-[1672px]:absolute min-[1672px]:-right-[76px] min-[1672px]:top-1/2 min-[1672px]:mt-0 min-[1672px]:-translate-y-1/2"
    : ""

  return (
    <div className="relative">
      <div
        ref={railRef}
        onScroll={syncScrollState}
        className={`no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 2xl:gap-8 ${className}`}
      >
        {children}
      </div>

      <div className={`mt-8 flex items-center justify-center gap-4 ${sideControls ? "min-[1672px]:mt-0" : ""}`}>
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          aria-label="Previous"
          className={`${arrowBase} border border-brand text-brand hover:bg-brand hover:text-white disabled:hover:bg-transparent disabled:hover:text-brand ${prevPlacement}`}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          aria-label="Next"
          className={`${arrowBase} bg-brand text-white hover:bg-brand-dark disabled:hover:bg-brand ${nextPlacement}`}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function CategoriesPageContent() {
  const searchParams = useSearchParams()
  const [departments, setDepartments] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [priceBand, setPriceBand] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("recommended")
  const [layout, setLayout] = useState<"grid" | "list">("grid")
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
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

  // Any change to the filters restarts the visible window.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedCategory, priceBand, sortBy])

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

  // Filter products based on selected category. Products expose their
  // department as a string id, a nested object, or `departmentId`.
  const filteredProducts = useMemo(() => {
    const band = PRICE_BANDS.find((entry) => entry.value === priceBand) || PRICE_BANDS[0]

    const matched = allProducts.filter((product) => {
      if (selectedCategory) {
        const productDeptId = getProductDepartmentId(product)
        if (!productDeptId || String(productDeptId) !== String(selectedCategory)) return false
      }
      return band.test(getProductPrice(product))
    })

    const sorted = [...matched]
    if (sortBy === "price-asc") sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b))
    else if (sortBy === "price-desc") sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a))
    else if (sortBy === "name") sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    else if (sortBy === "popular") sorted.sort((a, b) => Number(b.saleCount || 0) - Number(a.saleCount || 0))
    return sorted
  }, [allProducts, selectedCategory, priceBand, sortBy])

  // These two showcases are photo-led in the design, so prefer products that
  // actually have an image before falling back to whatever the store has.
  const signatures = useMemo(
    () => [...allProducts].sort((a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a))).slice(0, 4),
    [allProducts],
  )

  // "Today's special" uses the store's own best sellers rather than fixed copy,
  // skipping anything already shown in the signature row above.
  const todaysSpecials = useMemo(() => {
    const shown = new Set(signatures.map((product) => String(product._id)))
    return [...allProducts]
      .filter((product) => !shown.has(String(product._id)))
      .sort(
        (a, b) =>
          Number(hasPhoto(b)) - Number(hasPhoto(a)) || Number(b.saleCount || 0) - Number(a.saleCount || 0),
      )
      .slice(0, 3)
  }, [allProducts, signatures])

  const sweetDepartments = useMemo(
    () => departments.filter((department) => SWEET_PATTERN.test(String(department.name || ""))),
    [departments],
  )

  const breakfastDepartment = useMemo(
    () => departments.find((department) => BREAKFAST_PATTERN.test(String(department.name || ""))) || departments[0] || null,
    [departments],
  )

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const storeName = getStoreName(store) || store?.subdomain || ""
  const displayStoreName = storeName.replace(/[.,\s]+$/, "")
  const proseStoreName = toProseName(displayStoreName)
  const currency = getCurrencySymbol(store)
  const activeDepartment = departments.find((department) => department._id === selectedCategory)
  const visibleProducts = filteredProducts.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ---------------------------------------------------------------- Hero */}
        <section className="surface-paper relative overflow-hidden">
          {/*
            Orange sweep drawn with clip-path rather than a stretched SVG, so
            the angle stays exact at any width. Band height and the left-edge
            stop are measured from the Figma render of this page.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[38.3%] bg-brand"
            style={{ clipPath: "polygon(0 100%, 0 79.23%, 100% 0, 100% 100%)" }}
          />

          <div className="relative mx-auto grid max-w-[1600px] items-center gap-10 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10 lg:px-10 lg:pb-40 lg:pt-20">
            <div className="max-w-3xl">
              <span className="eyebrow">Explore our menu</span>

              <h1 className="display-heading mt-6 text-ink dark:text-foreground">
                <span className="block text-[38px] sm:text-[54px] lg:text-[70px] 2xl:text-[78px]">A taste of India</span>
                <span className="mt-1 block text-[30px] sm:text-[42px] lg:text-[53px] 2xl:text-[58px]">Made fresh for you.</span>
              </h1>

              <p className="mt-7 max-w-xl text-[15px] lg:text-[19px] 2xl:text-[21px] leading-[1.75] text-ink-soft sm:text-base dark:text-foreground/75">
                Discover authentic Indian flavors, from South Indian breakfast favorites and crispy appetizers to
                aromatic biryanis, flavorful curries, freshly baked breads, and sweet treats.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[460px] lg:ml-auto lg:max-w-[520px]">
              <img
                src="/savera/menu-hero.webp"
                alt=""
                aria-hidden
                className="aspect-square w-full object-contain drop-shadow-[0_24px_50px_rgba(17,17,17,0.22)]"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- Toolbar */}
        <section className="bg-background py-8">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  className="inline-flex items-center gap-2.5 rounded-full bg-brand px-7 py-3 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
                >
                  Filter
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <span className="rounded-full border border-line px-6 py-3 text-[15px] lg:text-[17px] 2xl:text-[19px] text-ink-soft dark:border-border dark:text-foreground/75">
                  {filteredProducts.length} items total
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="menu-sort" className="text-[15px] lg:text-[17px] 2xl:text-[20px] text-ink-soft dark:text-foreground/75">
                  Sort by
                </label>
                <div className="relative">
                  <select
                    id="menu-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="appearance-none rounded-full border border-line bg-transparent py-3 pl-5 pr-11 text-[15px] lg:text-[17px] 2xl:text-[19px] text-ink outline-none focus:border-brand dark:border-border dark:text-foreground"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft dark:text-foreground/70" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLayout("grid")}
                    aria-label="Grid view"
                    aria-pressed={layout === "grid"}
                    className={`flex h-11 w-11 items-center justify-center rounded-[6px] transition-colors ${
                      layout === "grid"
                        ? "bg-brand text-white"
                        : "border border-line text-ink-soft hover:border-brand hover:text-brand dark:border-border dark:text-foreground/70"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout("list")}
                    aria-label="List view"
                    aria-pressed={layout === "list"}
                    className={`flex h-11 w-11 items-center justify-center rounded-[6px] transition-colors ${
                      layout === "list"
                        ? "bg-brand text-white"
                        : "border border-line text-ink-soft hover:border-brand hover:text-brand dark:border-border dark:text-foreground/70"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter chips — each one is backed by real product data */}
            {filtersOpen && (
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-full border border-line px-4 py-4 sm:px-6 dark:border-border">
                <div className="relative">
                  <select
                    aria-label="Filter by category"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className={`appearance-none rounded-full py-3 pl-6 pr-11 text-[15px] lg:text-[17px] 2xl:text-[19px] outline-none transition-colors ${
                      selectedCategory
                        ? "bg-brand text-white"
                        : "border border-line bg-transparent text-ink dark:border-border dark:text-foreground"
                    }`}
                  >
                    <option value="">All categories</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
                      selectedCategory ? "text-white" : "text-ink-soft dark:text-foreground/70"
                    }`}
                  />
                </div>

                <div className="relative">
                  <select
                    aria-label="Filter by price"
                    value={priceBand}
                    onChange={(event) => setPriceBand(event.target.value)}
                    className={`appearance-none rounded-full py-3 pl-6 pr-11 text-[15px] lg:text-[17px] 2xl:text-[19px] outline-none transition-colors ${
                      priceBand
                        ? "bg-brand text-white"
                        : "border border-line bg-transparent text-ink dark:border-border dark:text-foreground"
                    }`}
                  >
                    {PRICE_BANDS.map((band) => (
                      <option key={band.value || "any"} value={band.value}>
                        {band.value ? `${currency}${band.label}` : band.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
                      priceBand ? "text-white" : "text-ink-soft dark:text-foreground/70"
                    }`}
                  />
                </div>

                {(selectedCategory || priceBand || sortBy !== "recommended") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("")
                      setPriceBand("")
                      setSortBy("recommended")
                    }}
                    className="rounded-full px-5 py-3 text-[15px] lg:text-[17px] 2xl:text-[19px] text-ink-soft underline-offset-4 hover:text-brand hover:underline dark:text-foreground/70"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------- Signatures */}
        {signatures.length > 0 && (
          <section className="bg-background pb-16 lg:pb-24 2xl:pb-28">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col items-center text-center">
                <span className="eyebrow eyebrow-center">
                  {proseStoreName ? `${proseStoreName} signatures` : "Signatures"}
                </span>
                <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[40px] lg:text-[46px] 2xl:text-[50px] dark:text-foreground">
                  A few favorites to start with.
                </h2>
                <p className="mt-4 text-[15px] lg:text-[17px] 2xl:text-[20px] text-ink-soft dark:text-foreground/70">
                  The dishes our guests order most often.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {signatures.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    variant="featured"
                    currency={currency}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* -------------------------------------------------------- Complete menu */}
        <section id="products-section" className="surface-paper py-16 lg:py-28 2xl:py-32 2xl:py-28">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <span className="eyebrow eyebrow-center">Explore everything</span>
              <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[40px] lg:text-[46px] 2xl:text-[50px] dark:text-foreground">
                {activeDepartment ? activeDepartment.name : "Our complete menu."}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.7] text-ink-soft dark:text-foreground/70">
                {activeDepartment?.description ||
                  "From light bites to hearty meals and sweet endings, find something for every craving."}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            ) : visibleProducts.length > 0 ? (
              <>
                <div
                  className={
                    layout === "grid"
                      ? "mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "mt-12 flex flex-col gap-5"
                  }
                >
                  {visibleProducts.map((product) => (
                    <MenuCard
                      key={product._id}
                      product={product}
                      category={getProductDepartmentName(product, departments)}
                      currency={currency}
                      layout={layout}
                    />
                  ))}
                </div>

                {visibleCount < filteredProducts.length && (
                  <div className="mt-14 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="rounded-full bg-brand px-10 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
                    >
                      Load More Items
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-12 border border-line bg-card py-20 text-center dark:border-border">
                <p className="font-display text-[24px] font-semibold text-ink dark:text-foreground">
                  No dishes match these filters
                </p>
                <p className="mt-3 text-[15px] lg:text-[17px] 2xl:text-[20px] text-muted-foreground">Try a different category or price range.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("")
                    setPriceBand("")
                  }}
                  className="mt-7 rounded-full bg-brand px-8 py-3.5 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* --------------------------------------------------- Breakfast spotlight */}
        {breakfastDepartment && (
          <section className="bg-background py-16 lg:py-28 2xl:py-32">
            <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
              <img
                src="/savera/breakfast.jpg"
                alt=""
                aria-hidden
                className="aspect-[746/465] w-full object-cover"
              />

              <div>
                <span className="eyebrow">South Indian favorites</span>
                <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[38px] lg:text-[46px] 2xl:text-[50px] dark:text-foreground">
                  Start with something fresh.
                </h2>
                <p className="mt-6 max-w-xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.8] text-ink-soft dark:text-foreground/70">
                  {breakfastDepartment.description ||
                    `From crispy dosas and soft idlis to golden vadas and breakfast combinations, discover authentic South Indian favorites prepared fresh${proseStoreName ? ` at ${proseStoreName}` : ""}.`}
                </p>
                <p className="mt-4 max-w-xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.8] text-ink-soft dark:text-foreground/70">
                  Every plate is made to order, so it reaches you exactly the way it leaves the kitchen.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(breakfastDepartment._id)
                    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="mt-9 rounded-full bg-brand px-9 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
                >
                  Explore {breakfastDepartment.name}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------ Today's specials */}
        {todaysSpecials.length > 0 && (
          <section className="surface-paper py-16 lg:py-28 2xl:py-32">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col items-center text-center">
                <span className="eyebrow eyebrow-center">Today's special</span>
                <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[40px] lg:text-[46px] 2xl:text-[50px] dark:text-foreground">
                  Something special from our kitchen.
                </h2>
              </div>

              <div className="mt-14 grid gap-7 md:grid-cols-3">
                {todaysSpecials.map((product) => (
                  <Link
                    key={product._id}
                    href={`/product/${product._id}`}
                    className="group border border-line/80 bg-card p-3 dark:border-border"
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="aspect-[16/9] w-full object-cover"
                    />
                    <div className="px-2 pb-3 pt-6">
                      <h3 className="font-display text-[24px] font-semibold text-ink transition-colors group-hover:text-brand dark:text-foreground">
                        {product.name}
                      </h3>
                      <div className="mt-4 h-px w-full bg-line dark:bg-border" />
                      <p className="mt-4 line-clamp-2 text-[14px] leading-[1.7] text-muted-foreground">
                        {product.description || "A kitchen favorite, prepared fresh to order."}
                      </p>
                      <p className="mt-4 text-[18px] font-semibold text-ink dark:text-foreground">
                        {currency}
                        {getProductPrice(product).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("popular")
                    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="rounded-full bg-brand px-9 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:bg-brand-dark"
                >
                  Explore Today's Specials
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------ End on a sweet note */}
        {sweetDepartments.length > 0 && (
          <section className="bg-background py-16 lg:py-28 2xl:py-32">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col items-center text-center">
                <span className="eyebrow eyebrow-center">Save for something sweet</span>
                <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[40px] lg:text-[46px] 2xl:text-[50px] dark:text-foreground">
                  End on a sweet note.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.7] text-ink-soft dark:text-foreground/70">
                  Sweet creations made to make every moment special — deliciously crafted treats for the perfect ending.
                </p>
              </div>

              <div className="mt-14">
                <Rail>
                  {sweetDepartments.map((department) => {
                    const count = allProducts.filter(
                      (product) => String(getProductDepartmentId(product)) === String(department._id),
                    ).length
                    return (
                      <button
                        key={department._id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(department._id)
                          document
                            .getElementById("products-section")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }}
                        className="group w-[200px] shrink-0 snap-start text-center sm:w-[240px] 2xl:w-[278px]"
                      >
                        <div className="mx-auto aspect-square w-full overflow-hidden rounded-full">
                          <img
                            src={getDepartmentImage(department)}
                            alt={department.name}
                            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <h3 className="mt-5 line-clamp-2 flex min-h-[2.4em] items-center justify-center font-display text-[20px] font-semibold uppercase leading-[1.2] tracking-wide text-ink transition-colors group-hover:text-brand sm:text-[24px] dark:text-foreground">
                          {department.name}
                        </h3>
                        <p className="mt-1 text-[14px] text-muted-foreground">
                          {department.description || `${count} ${count === 1 ? "item" : "items"}`}
                        </p>
                      </button>
                    )
                  })}
                </Rail>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------ CTA band */}
        <section className="bg-background pb-16 lg:pb-28 2xl:pb-32">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden bg-ink">
              <img
                src="/savera/band-biryani.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/45" />

              <div className="relative flex flex-col items-center px-6 py-16 text-center sm:px-12 lg:py-28 2xl:py-32">
                <span className="eyebrow eyebrow-center eyebrow-light normal-case">Ready to order?</span>

                <h2 className="display-heading mt-5 max-w-5xl text-[28px] text-white sm:text-[40px] lg:text-[46px] 2xl:text-[50px]">
                  Your favorite flavors are waiting.
                </h2>

                <p className="mt-5 max-w-2xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.7] text-white/85">
                  Choose your favorites, customize your order, and enjoy freshly prepared Indian food
                  {proseStoreName ? ` from ${proseStoreName}` : ""}.
                </p>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="rounded-full bg-white px-9 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-ink transition-colors hover:bg-brand hover:text-white"
                  >
                    Start Your Order
                  </button>
                  <Link
                    href="/"
                    className="rounded-full border border-white/60 px-9 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
                  >
                    View Categories
                  </Link>
                </div>
              </div>
            </div>
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
