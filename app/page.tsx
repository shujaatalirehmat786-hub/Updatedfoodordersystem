"use client"

import { useEffect, useMemo, useRef, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, ArrowUpRight, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { api, getProductPrice } from "@/lib/api"
import { getStoreDescription, getStoreFromSubdomain, getStoreName } from "@/lib/store"
import {
  getCurrencySymbol,
  getDepartmentImage,
  getProductDepartmentId,
  getProductDepartmentName,
  getProductImage,
  resolveMediaUrl,
} from "@/lib/media"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

const KITCHEN_CARDS = [
  {
    image: "/savera/kitchen-1.jpg",
    title: "Fresh Ingredients",
    description: "Premium basmati rice, fresh vegetables, herbs, quality meats and carefully selected ingredients.",
  },
  {
    image: "/savera/kitchen-2.jpg",
    title: "Authentic Spices",
    description: "Traditional Indian spices bring depth, aroma and character to every dish.",
  },
  {
    image: "/savera/kitchen-3.jpg",
    title: "Made With Care",
    description: "Every meal is prepared with attention to freshness, flavor and consistency.",
  },
]

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    rating: 4,
    quote:
      "Everything was fresh, flavorful, and beautifully prepared. The biryani had incredible depth of flavor, and the portions were generous. Definitely one of our favorite Indian restaurants!",
  },
  {
    name: "Michael R.",
    rating: 4,
    quote:
      "The dosa was perfectly crispy, the curries were rich and flavorful, and the service was wonderful. You can really taste the care that goes into the food. We'll definitely be coming back.",
  },
  {
    name: "Priya K.",
    rating: 4,
    quote:
      "Our go-to whenever we're craving authentic Indian food. From the biryani to the appetizers, everything was delicious and full of flavor. Great food, generous portions, and a welcoming atmosphere.",
  },
]

/**
 * Some stores publish an "about" string that is just the store name again.
 * Treat that as empty so the hero does not repeat itself three times.
 */
function getAboutText(description?: string, storeName?: string): string | undefined {
  if (!description) return undefined
  const trimmed = description.trim()
  if (!trimmed) return undefined
  if (storeName && trimmed.toLowerCase() === storeName.trim().toLowerCase()) return undefined
  return trimmed
}

/** Splits the store's about text into a display headline and a supporting paragraph. */
function splitStoryText(description?: string): { headline: string | null; body: string | null } {
  if (!description) return { headline: null, body: null }
  const trimmed = description.trim()
  const match = trimmed.match(/^([\s\S]{20,120}?[.!?])\s+([\s\S]*)$/)
  if (match) {
    return { headline: match[1], body: match[2] }
  }
  return { headline: trimmed.length <= 120 ? trimmed : null, body: null }
}

function Eyebrow({
  children,
  centered = false,
  tone = "brand",
}: {
  children: React.ReactNode
  centered?: boolean
  tone?: "brand" | "light"
}) {
  return (
    <span
      className={`eyebrow ${centered ? "eyebrow-center" : ""} ${tone === "light" ? "eyebrow-light" : ""}`}
    >
      {children}
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${index < rating ? "fill-[#f5a623]" : "fill-black/15"}`}
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.65l5.9-.85L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

/** Horizontal rail with the design's circular prev/next controls. */
function Rail({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const railRef = useRef<HTMLDivElement>(null)

  const scrollBy = (direction: 1 | -1) => {
    const node = railRef.current
    if (!node) return
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={railRef}
        className={`no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 ${className}`}
      >
        {children}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 xl:mt-0">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Previous"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white xl:absolute xl:-left-16 xl:top-1/2 xl:mt-0 xl:-translate-y-1/2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Next"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark xl:absolute xl:-right-16 xl:top-1/2 xl:mt-0 xl:-translate-y-1/2"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const [store, setStore] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    loadStore()
  }, [])

  // Check for category in URL params
  useEffect(() => {
    try {
      const categoryParam = searchParams?.get("category")
      if (categoryParam) {
        setSelectedDepartment(categoryParam)
      }
    } catch (error) {
      console.log("Search params not available")
    }
  }, [searchParams])

  useEffect(() => {
    if (store) {
      loadDepartments()
      loadAllProducts()
    }
  }, [store])

  useEffect(() => {
    if (store) {
      loadProducts()
    }
  }, [store, selectedDepartment])

  const loadStore = async () => {
    const storeData = await getStoreFromSubdomain()
    setStore(storeData)
  }

  const loadDepartments = async () => {
    try {
      const response = await api.department.list({ storeId: store._id, page: 1, limit: 50 })
      setDepartments(response.data || [])
    } catch (error) {
      console.error("Error loading departments:", error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await api.product.list({
        storeId: store._id,
        page: 1,
        limit: 100,
        department: selectedDepartment || undefined,
        order: "desc",
      })

      setProducts(response.data?.products || response.products || [])
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

  const loadAllProducts = async () => {
    try {
      const response = await api.product.list({
        storeId: store._id,
        page: 1,
        limit: 1000,
        order: "desc",
      })
      setAllProducts(response.data?.products || response.products || [])
    } catch (error) {
      console.error("Error loading all products:", error)
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

  const storeName = getStoreName(store) || store?.subdomain || ""
  const aboutText = useMemo(() => getAboutText(getStoreDescription(store), storeName), [store, storeName])
  const { headline: storyHeadline, body: storyBody } = useMemo(() => splitStoryText(aboutText), [aboutText])

  const currency = getCurrencySymbol(store)
  /** Store names sometimes carry trailing punctuation that reads badly mid-sentence. */
  const displayStoreName = storeName.replace(/[.,\s]+$/, "")
  const heroImage = resolveMediaUrl(store?.headerImageUrl) || "/savera/hero-bowl.webp"

  const productsByDepartment = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const product of allProducts) {
      const id = getProductDepartmentId(product)
      if (!id) continue
      const key = String(id)
      map.set(key, [...(map.get(key) || []), product])
    }
    return map
  }, [allProducts])

  const favourites = allProducts.slice(0, 8)
  const menuProducts = products.slice(0, 8)

  // The two editorial feature blocks each spotlight a real department.
  const featureDepartments = useMemo(
    () => departments.filter((department) => (productsByDepartment.get(String(department._id))?.length || 0) > 0),
    [departments, productsByDepartment],
  )
  const spotlight = featureDepartments[0] || null
  const spotlightProducts = spotlight ? (productsByDepartment.get(String(spotlight._id)) || []).slice(0, 5) : []
  const secondary = featureDepartments[1] || featureDepartments[0] || null
  const secondaryProducts = secondary ? (productsByDepartment.get(String(secondary._id)) || []).slice(0, 4) : []
  // Departments carry no artwork of their own, so borrow the first product photo.
  const spotlightImage =
    resolveMediaUrl(spotlight?.image || spotlight?.imageUrl || spotlight?.imageId?.fileUrl) ||
    (spotlightProducts.length > 0 ? getProductImage(spotlightProducts[0]) : null) ||
    "/savera/breakfast.jpg"

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ---------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden bg-cream-light dark:bg-card">
          {/*
            The design layers a paper texture at 40% over a solid #f8f4f0.
            That composite is baked into one image, so the hero paints a single
            backdrop instead of stacking a tiled texture over a fill.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[url('/savera/hero-bg.jpg')] bg-cover bg-center dark:hidden"
          />
          {/*
            The orange sweep is a four-point shape (Figma "Vector 1":
            M0 477 V407.5 L1923 0 V477 Z). Drawing it with clip-path keeps the
            angle exact at any width, where a stretched SVG skewed with it.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-brand"
            style={{ clipPath: "polygon(0 100%, 0 85.43%, 100% 0, 100% 100%)" }}
          />

          <div className="relative mx-auto grid max-w-[1560px] items-center gap-10 px-4 pb-32 pt-14 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:gap-8 lg:px-10 lg:pb-44 lg:pt-20">
            <div className="max-w-2xl">
              {storeName && <Eyebrow>{storeName}</Eyebrow>}

              <h1 className="display-heading mt-6 text-[40px] text-ink sm:text-[56px] lg:text-[72px] dark:text-foreground">
                {storyHeadline || "Bold flavors. Freshly made."}
              </h1>

              <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-ink-soft sm:text-base dark:text-foreground/75">
                {storyBody ||
                  (storyHeadline ? null : aboutText) ||
                  `Browse the full menu${storeName ? ` from ${storeName}` : ""} and order online — every dish, price and category comes straight from the kitchen.`}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/categories"
                  className="rounded-full bg-brand px-10 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark sm:text-base"
                >
                  Order Now
                </Link>
                <Link
                  href="/categories"
                  className="rounded-full border border-brand bg-white px-10 py-4 text-[15px] text-ink transition-colors hover:bg-brand hover:text-white sm:text-base"
                >
                  Explore Menu
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
              <img
                src={heroImage}
                alt={storeName || "Featured dish"}
                className="aspect-square w-full rounded-full object-cover drop-shadow-[0_24px_50px_rgba(17,17,17,0.22)]"
              />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- Category carousel */}
        {departments.length > 0 && (
          <section className="bg-background py-16 lg:py-24">
            <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
              <div className="flex flex-col items-center text-center">
                <Eyebrow centered>What are you craving?</Eyebrow>
                <h2 className="display-heading mt-5 text-[30px] text-ink sm:text-[42px] lg:text-[52px] dark:text-foreground">
                  Something delicious is waiting.
                </h2>
                <p className="mt-4 text-[15px] text-ink-soft dark:text-foreground/70">
                  Browse {departments.length} {departments.length === 1 ? "category" : "categories"} of freshly
                  prepared dishes{storeName ? ` from ${storeName}` : ""}
                </p>
              </div>

              <div className="mt-14 xl:px-20">
                <Rail>
                  {departments.map((department) => {
                    const count = productsByDepartment.get(String(department._id))?.length || 0
                    const image = getDepartmentImage(department)
                    return (
                      <Link
                        key={department._id}
                        href={`/categories?category=${department._id}`}
                        className="group w-[200px] shrink-0 snap-start text-center sm:w-[240px]"
                      >
                        <div className="mx-auto aspect-square w-full overflow-hidden rounded-full">
                          <img
                            src={image}
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
                      </Link>
                    )
                  })}
                </Rail>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------- Favourites */}
        {favourites.length > 0 && (
          <section className="surface-paper py-16 lg:py-24">
            <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
                <div>
                  <Eyebrow>{storeName ? `${storeName} favorites` : "Favorites"}</Eyebrow>
                  <h2 className="display-heading mt-5 text-[30px] text-ink sm:text-[42px] lg:text-[52px] dark:text-foreground">
                    The dishes everyone comes back for.
                  </h2>
                </div>
                <p className="text-[15px] leading-[1.7] text-ink-soft lg:pb-3 dark:text-foreground/70">
                  A selection of flavorful favorites made for sharing, enjoying, and coming back for.
                </p>
              </div>

              <div className="mt-14 xl:px-20">
                <Rail>
                  {favourites.map((product) => (
                    <div key={product._id} className="w-[290px] shrink-0 snap-start sm:w-[320px]">
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        variant="featured"
                        tag={getProductDepartmentName(product, departments)}
                        currency={currency}
                      />
                    </div>
                  ))}
                </Rail>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------ Feature band 1 */}
        <section className="bg-background py-14 lg:py-20">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-[4px] bg-ink">
              <img
                src="/savera/band-family.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="relative max-w-2xl px-6 py-16 sm:px-12 lg:px-16 lg:py-24">
                <Eyebrow tone="light">Made for sharing</Eyebrow>
                <h2 className="mt-5 font-display text-[30px] font-medium leading-tight text-white sm:text-[40px] lg:text-[48px]">
                  Bring everyone to the table.
                </h2>
                <p className="mt-5 max-w-lg text-[15px] leading-[1.7] text-white/85">
                  From family favorites to generous biryani and pulav portions, make your next meal something everyone
                  can enjoy.
                </p>
                <Link
                  href="/categories"
                  className="mt-9 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[15px] text-ink transition-colors hover:bg-brand hover:text-white"
                >
                  Explore Family Favorites
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ Menu */}
        <section className="surface-paper py-16 lg:py-24">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <Eyebrow centered>Explore our menu</Eyebrow>
              <h2 className="display-heading mt-5 max-w-4xl text-[30px] text-ink sm:text-[42px] lg:text-[52px] dark:text-foreground">
                From breakfast to dinner, there's something for everyone.
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-ink-soft dark:text-foreground/70">
                A selection of flavorful favorites made for sharing, enjoying, and coming back for.
              </p>
            </div>

            {departments.length > 0 && (
              <div className="no-scrollbar mt-12 flex gap-3 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedDepartment("")}
                  className={`shrink-0 rounded-full border px-6 py-3 text-[15px] transition-colors ${
                    selectedDepartment === ""
                      ? "border-brand bg-brand text-white"
                      : "border-ink/20 bg-transparent text-ink hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                  }`}
                >
                  All
                </button>
                {departments.map((department) => (
                  <button
                    key={department._id}
                    type="button"
                    onClick={() => setSelectedDepartment(department._id)}
                    className={`shrink-0 rounded-full border px-6 py-3 text-[15px] transition-colors ${
                      selectedDepartment === department._id
                        ? "border-brand bg-brand text-white"
                        : "border-ink/20 bg-transparent text-ink hover:border-brand hover:text-brand dark:border-foreground/25 dark:text-foreground"
                    }`}
                  >
                    {department.name}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            ) : menuProducts.length > 0 ? (
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {menuProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    variant="compact"
                    currency={currency}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-12 text-center text-muted-foreground">No products found in this category.</p>
            )}

            <div className="mt-14 flex justify-center">
              <Link
                href="/categories"
                className="rounded-full bg-brand px-10 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
              >
                View Full Menu
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- Department spotlight */}
        {spotlight && spotlightProducts.length > 0 && (
          <section className="bg-background py-16 lg:py-24">
            <div className="mx-auto grid max-w-[1560px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
              <img
                src={spotlightImage}
                alt={spotlight.name}
                className="aspect-[4/3] w-full rounded-[4px] object-cover"
              />

              <div>
                <Eyebrow>Straight from the kitchen</Eyebrow>
                <h2 className="display-heading mt-5 text-[30px] text-ink sm:text-[40px] lg:text-[50px] dark:text-foreground">
                  {spotlight.name}
                </h2>
                <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-ink-soft dark:text-foreground/70">
                  {spotlight.description ||
                    `Freshly prepared ${spotlight.name.toLowerCase()} from our kitchen, made to order every day.`}
                </p>

                <ul className="mt-9">
                  {spotlightProducts.map((product) => (
                    <li key={product._id} className="border-b border-line/80 dark:border-border">
                      <Link
                        href={`/product/${product._id}`}
                        className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-brand"
                      >
                        <span className="font-display text-[20px] font-semibold uppercase tracking-wide text-ink sm:text-[23px] dark:text-foreground">
                          {product.name}
                        </span>
                        <span className="shrink-0 text-[14px] text-brand">
                          {currency}
                          {getProductPrice(product).toFixed(2)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/categories?category=${spotlight._id}`}
                  className="mt-10 inline-block rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
                >
                  Explore {spotlight.name}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------ Feature band 2 */}
        {secondary && secondaryProducts.length > 0 && (
          <section className="bg-background pb-16 lg:pb-24">
            <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
              <div className="relative overflow-hidden rounded-[4px] bg-ink">
                <img
                  src="/savera/band-biryani.jpg"
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative flex flex-col items-center px-6 py-16 text-center sm:px-12 lg:py-24">
                  <Eyebrow centered tone="light">
                    Signature {secondary.name}
                  </Eyebrow>
                  <h2 className="mt-5 max-w-3xl font-display text-[30px] font-medium leading-tight text-white sm:text-[40px] lg:text-[48px]">
                    Layered with flavor. Finished with tradition.
                  </h2>
                  <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-white/85">
                    {secondary.description ||
                      "Carefully selected ingredients and traditional spices come together in every dish we prepare."}
                  </p>

                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    {secondaryProducts.map((product) => (
                      <Link
                        key={product._id}
                        href={`/product/${product._id}`}
                        className="rounded-full border border-white/60 px-7 py-3.5 text-[15px] text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- Story */}
        <section className="bg-background pb-16 lg:pb-24">
          <div className="mx-auto grid max-w-[1560px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
            <div>
              <Eyebrow>Our story</Eyebrow>
              <h2 className="display-heading mt-5 text-[30px] text-ink sm:text-[40px] lg:text-[48px] dark:text-foreground">
                {displayStoreName ? `A taste of ${displayStoreName}, made to feel like home.` : "Made to feel like home."}
              </h2>
              <p className="mt-6 max-w-xl text-[15px] leading-[1.8] text-ink-soft dark:text-foreground/70">
                {aboutText ||
                  `Every dish on this menu is prepared to order${storeName ? ` at ${storeName}` : ""}, with the full selection, pricing and categories published straight from the kitchen.`}
              </p>
              <Link
                href="/about"
                className="mt-9 inline-block rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
              >
                Read Our Story
              </Link>
            </div>

            <img
              src="/savera/story.jpg"
              alt=""
              aria-hidden
              className="aspect-[4/3] w-full rounded-[4px] object-cover"
            />
          </div>
        </section>

        {/* ------------------------------------------------------ From our kitchen */}
        <section className="surface-paper py-16 lg:py-24">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <Eyebrow centered>From our kitchen</Eyebrow>
              <h2 className="display-heading mt-5 text-[30px] text-ink sm:text-[42px] lg:text-[50px] dark:text-foreground">
                Fresh ingredients. Traditional recipes.
              </h2>
            </div>

            <div className="mt-14 grid gap-7 md:grid-cols-3">
              {KITCHEN_CARDS.map((card) => (
                <article key={card.title} className="rounded-[4px] border border-line/80 bg-card p-3 dark:border-border">
                  <img src={card.image} alt={card.title} className="aspect-[16/9] w-full rounded-[3px] object-cover" />
                  <div className="px-2 pb-3 pt-6">
                    <h3 className="font-display text-[24px] font-semibold text-ink dark:text-foreground">{card.title}</h3>
                    <div className="mt-4 h-px w-full bg-line dark:bg-border" />
                    <p className="mt-4 text-[14px] leading-[1.7] text-muted-foreground">{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ Testimonials */}
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <Eyebrow centered>Testimonial</Eyebrow>
              <h2 className="display-heading mt-5 text-[30px] text-ink sm:text-[42px] lg:text-[50px] dark:text-foreground">
                What our guests say
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.7] text-ink-soft dark:text-foreground/70">
                From comforting classics to bold Indian flavors, see why our guests keep coming back.
              </p>
            </div>

            <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="flex flex-col border border-line/80 bg-card p-7 dark:border-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-[22px] font-semibold text-ink dark:text-foreground">
                      — {testimonial.name}
                    </h3>
                    <img src="/savera/quote.png" alt="" aria-hidden className="h-8 w-8 object-contain" />
                  </div>
                  <div className="mt-3">
                    <Stars rating={testimonial.rating} />
                  </div>
                  <p className="mt-5 flex-1 text-[15px] leading-[1.75] text-ink-soft/80 dark:text-foreground/70">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-7 h-px w-full bg-line dark:bg-border" />
                  <div className="mt-5 flex items-center justify-end gap-3">
                    <span className="font-display text-[19px] font-semibold text-ink dark:text-foreground">
                      Google Reviews
                    </span>
                    <img src="/savera/google-g.png" alt="" aria-hidden className="h-5 w-5 object-contain" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Closing band */}
        <section className="bg-background pb-16 lg:pb-24">
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-[4px] bg-ink">
              <img
                src="/savera/band-biryani.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative flex flex-col items-center px-6 py-16 text-center sm:px-12 lg:py-24">
                <Eyebrow centered tone="light">
                  Ready when you are
                </Eyebrow>
                <h2 className="mt-5 max-w-4xl font-display text-[30px] font-medium leading-tight text-white sm:text-[40px] lg:text-[50px]">
                  Something delicious is coming your way.
                </h2>
                <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-white/85">
                  Browse the menu, build your order and check out in a few taps
                  {storeName ? ` at ${storeName}.` : "."}
                </p>
                <Link
                  href="/categories"
                  className="mt-9 inline-flex items-center gap-3 rounded-full bg-brand px-9 py-4 text-[15px] text-white transition-colors hover:bg-brand-dark"
                >
                  Start Your Order
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
