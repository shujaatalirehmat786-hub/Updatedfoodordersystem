"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { api } from "@/lib/api"
import { getStoreFromSubdomain } from "@/lib/store"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Clock, Star, TrendingUp, Utensils, MapPin, Phone, ShoppingBag, CheckCircle2, Truck, Shield, Heart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Footer } from "@/components/footer"

function HomePageContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [dialogDepartment, setDialogDepartment] = useState<any | null>(null)
  const [dialogProducts, setDialogProducts] = useState<any[]>([])
  const [dialogLoading, setDialogLoading] = useState(false)
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
      // Handle case when searchParams is not available
      console.log("Search params not available")
    }
  }, [searchParams])

  useEffect(() => {
    if (store) {
      loadDepartments()
      loadProducts()
      loadAllProducts()
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

  const loadDialogProducts = async (departmentId: string) => {
    if (!store?._id) {
      return
    }
    try {
      setDialogLoading(true)
      const response = await api.product.list({
        storeId: store._id,
        page: 1,
        limit: 100,
        department: departmentId,
        order: "desc",
      })
      setDialogProducts(response.data?.products || response.products || [])
    } catch (error) {
      console.error("Error loading dialog products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
      setDialogProducts([])
    } finally {
      setDialogLoading(false)
    }
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

  const getProductDepartmentId = (product: any): string | null => {
    if (product.department) {
      if (typeof product.department === "string") {
        return product.department
      }
      if (product.department._id) {
        return product.department._id
      }
      if (product.department.id) {
        return product.department.id
      }
    }
    if (product.departmentId) {
      return product.departmentId
    }
    return null
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get popular products (first 4)
  const popularProducts = products.slice(0, 4)
  const featuredDepartments = departments.slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[600px] overflow-hidden py-20">
          {/* Hide HOME and MENU navigation buttons in hero section (not in header) */}
          <style dangerouslySetInnerHTML={{__html: `
            /* Hide navigation links in hero section only */
            main > section:first-of-type.relative a[href="/"]:not(header a),
            main > section:first-of-type.relative a[href="/categories"]:not(header a) {
              display: none !important;
            }
            /* Hide any buttons with HOME or MENU text in hero section */
            main > section:first-of-type.relative button[aria-label*="HOME"],
            main > section:first-of-type.relative button[aria-label*="MENU"],
            main > section:first-of-type.relative button[aria-label*="Home"],
            main > section:first-of-type.relative button[aria-label*="Menu"] {
              display: none !important;
            }
          `}} />
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&h=1080&fit=crop&q=80)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="mb-6 bg-orange-500/90 text-white hover:bg-orange-600/90 backdrop-blur-sm">
                <Star className="mr-2 h-4 w-4 fill-white" />
                {store.name}
              </Badge>
              <h1 className="text-balance mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl drop-shadow-lg">
                Order Food Delivery From Your Favorite Restaurants!
              </h1>
              <p className="text-pretty mb-10 text-xl text-white/90 md:text-2xl drop-shadow-md">
                Order takeaway online From Your Favorite Restaurants! We get what you love From Your Favorite Restaurants!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 text-base text-white/90">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500/80 backdrop-blur-sm p-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">24/7 delivery</div>
                    <div className="text-sm text-white/80">Always available</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500/80 backdrop-blur-sm p-3">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">2500 restaurants</div>
                    <div className="text-sm text-white/80">Wide selection</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500/80 backdrop-blur-sm p-3">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">Fast delivery</div>
                    <div className="text-sm text-white/80">Quick service</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Showcase Section */}
        {featuredDepartments.length > 0 && (
          <section className="bg-white py-16 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                  More Than <span className="text-orange-600 dark:text-orange-400">20,000 dishes</span> to order!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Welcome to The Biggest Network of Food Ordering & Delivery
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {featuredDepartments.map((dept) => {
                  const deptProducts = allProducts.filter((p) => {
                    const productDeptId = getProductDepartmentId(p)
                    return productDeptId && String(productDeptId) === String(dept._id)
                  })
                  const categoryImages: { [key: string]: string } = {
                    Sushi: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
                    Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
                    Burgers: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
                    Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop",
                    Pasta: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
                    Salads: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
                    Chinese: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
                    Italian: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop",
                  }
                  const imageUrl = categoryImages[dept.name] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"
                  
                  return (
                    <Card
                      key={dept._id}
                      className="group cursor-pointer overflow-hidden border-2 border-transparent transition-all hover:border-orange-500 hover:shadow-xl dark:hover:border-orange-400"
                      onClick={() => {
                        setDialogDepartment(dept)
                        setCategoryDialogOpen(true)
                        loadDialogProducts(dept._id)
                      }}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={dept.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white">{dept.name}</h3>
                          <p className="text-sm text-white/90">
                            {deptProducts.length} {deptProducts.length === 1 ? "item" : "items"} available
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
              {departments.length > 4 && (
                <div className="mt-8 text-center">
                  <Link href="/categories">
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950/20"
                    >
                      View More Categories
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* How to Order Section */}
        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">How to order?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Follow the Steps</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", title: "Choose your location", icon: MapPin },
                { step: "2", title: "Choose restaurant", icon: Utensils },
                { step: "3", title: "Make your order", icon: ShoppingBag },
                { step: "4", title: "Food is on the way", icon: Truck },
              ].map((item, index) => (
                <Card key={index} className="border-2 border-orange-200 bg-white p-6 text-center dark:border-orange-800 dark:bg-gray-900">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
                      <item.icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="mb-2 text-3xl font-bold text-orange-600 dark:text-orange-400">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Dishes Section */}
        <section className="bg-white py-16 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">What's Popular</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Clients' Most Popular Choice</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : popularProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {popularProducts.map((product) => (
                  <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Why People Choose Us</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Clients' Most Popular Choice</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Utensils, title: "30,000 Restaurants Menus", desc: "We're working with many restaurants in your city to put food all in one place." },
                { icon: Phone, title: "Easy Ordering by Phone", desc: "This allows you to order quickly and easily. Accessible at any time." },
                { icon: ShoppingBag, title: "Free Mobile Application", desc: "Mobile App allows you to choose restaurant, view price and check order." },
                { icon: CheckCircle2, title: "Easy Online Ordering", desc: "Once logged in, you can easily navigate around the site to complete your order." },
                { icon: Heart, title: "100% positive feedbacks", desc: "We care about our customers, that is why we get 100% positive feedbacks." },
                { icon: Truck, title: "Fast Guaranteed Delivery", desc: "We take responsibility for making sure that order are delivered to you safely." },
              ].map((feature, index) => (
                <Card key={index} className="border-2 border-transparent p-6 transition-all hover:border-orange-500 hover:shadow-lg dark:hover:border-orange-400">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                      <feature.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{index + 1}</div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section - All Products */}
        {selectedDepartment && (
          <section className="bg-white py-16 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {departments.find((d) => d._id === selectedDepartment)?.name || "Products"}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {products.length} {products.length === 1 ? "item" : "items"} available
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDepartment("")}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950/20"
                >
                  View All
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <Card className="py-12 text-center">
                  <Utensils className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No products found in this category.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

      </main>
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="w-[85vw] max-w-[900px] max-h-[85vh] overflow-hidden rounded-[20px] border-0 p-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
          <DialogTitle className="sr-only">{dialogDepartment?.name || "Category Items"}</DialogTitle>
          <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 px-6 py-4 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {dialogDepartment?.name || "Category Items"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {dialogProducts.length} items available
                </div>
              </div>
              <DialogClose className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="max-h-[calc(85vh-96px)] overflow-y-auto px-6 py-5">
            {dialogLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dialogProducts.length === 0 ? (
              <Card className="py-10 text-center">
                <Utensils className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No products found in this category.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {dialogProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex flex-col gap-4 rounded-xl border border-border/40 bg-card p-4 shadow-sm transition hover:shadow-md sm:flex-row"
                  >
                    <div className="h-28 w-full overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-28">
                      <img
                        src={product.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=${encodeURIComponent(product.name)}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <div>
                        <div className="text-lg font-semibold text-foreground">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {Number(product.price).toFixed(2)} USD
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      )}
                      <Button className="mt-auto w-full" onClick={() => handleAddToCart(product)}>
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
