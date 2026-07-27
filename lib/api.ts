const BACKEND_URL = "https://api.livedatanow.com/api/online-order"
const PROXY_URL = "/api/online-order"
const PAYMENT_PROXY_URL = "/api/payment"
const TEST_HOSTNAMES = new Set([
  "updatedfoodordersystem.vercel.app",
])

function shouldUseDirectBackend(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return TEST_HOSTNAMES.has(window.location.hostname)
}

function getApiBaseUrls(): string[] {
  return shouldUseDirectBackend() ? [BACKEND_URL, PROXY_URL] : [PROXY_URL]
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue
    }
    queryParams.set(key, String(value))
  }
  return queryParams.toString()
}

function normalizeId(value: unknown): string {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const record = value as { _id?: unknown; id?: unknown }
    if (typeof record._id === "string") return record._id
    if (typeof record.id === "string") return record.id
  }
  return String(value ?? "")
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let lastError: unknown = null

  for (const baseUrl of getApiBaseUrls()) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
        const errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : typeof errorData.message === "string"
              ? errorData.message
              : `API Error: ${response.statusText}`
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      lastError = error
      if (baseUrl !== PROXY_URL) {
        continue
      }
      console.error("[v0] API request failed:", error)
      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("API request failed")
}

async function apiRequestLocal<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${PAYMENT_PROXY_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
    const errorMessage =
      typeof errorData.error === "string"
        ? errorData.error
        : typeof errorData.message === "string"
          ? errorData.message
          : `API Error: ${response.statusText}`
    throw new Error(errorMessage)
  }

  return response.json()
}

async function apiRequestOptional<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let lastError: unknown = null

  for (const baseUrl of getApiBaseUrls()) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const responseText = await response.text().catch(() => "")
        const contentType = response.headers.get("content-type") || ""

        if (
          response.status === 404 ||
          responseText.includes("Cannot GET") ||
          responseText.includes("Website not found for this subdomain") ||
          contentType.includes("text/html")
        ) {
          return null
        }

        let errorMessage = `API Error: ${response.statusText}`
        if (contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(responseText) as { error?: string; message?: string }
            errorMessage =
              typeof errorData.error === "string"
                ? errorData.error
                : typeof errorData.message === "string"
                  ? errorData.message
                  : errorMessage
          } catch {
            // keep fallback message
          }
        } else if (responseText) {
          errorMessage = responseText
        }

        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      lastError = error
      if (baseUrl !== PROXY_URL) {
        continue
      }
      throw error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  return null
}

async function apiRequestOptionalMulti<T>(endpoints: string[], options: RequestInit = {}): Promise<T | null> {
  for (const endpoint of endpoints) {
    const result = await apiRequestOptional<T>(endpoint, options)
    if (result !== null) {
      return result
    }
  }
  return null
}

export const api = {
  auth: {
    login: (phone: string, store: string) =>
      apiRequest<{ token?: string; user?: any; data?: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, store }),
      }),
    verifyOtp: (phone: string, otp: string, store: string) =>
      apiRequest<{ token?: string; user?: any; data?: any }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp, store }),
      }),
  },

  profile: {
    get: () => apiRequest<any>("/profile"),
    update: (data: any) =>
      apiRequest<any>("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  store: {
    getBySubdomain: (hostname: string) => apiRequest<any>(`/store/by-subdomain?hostname=${encodeURIComponent(hostname)}`),
    getBySubdomainOptional: (hostname: string) =>
      apiRequestOptional<any>(`/store/by-subdomain?hostname=${encodeURIComponent(hostname)}`),
    list: (params: { page?: number; limit?: number } = {}) =>
      apiRequestOptionalMulti<any>([
        `/store?${buildQueryString({ page: params.page ?? 1, limit: params.limit ?? 1000 })}`,
        `/store/list?${buildQueryString({ page: params.page ?? 1, limit: params.limit ?? 1000 })}`,
        `/store/all?${buildQueryString({ page: params.page ?? 1, limit: params.limit ?? 1000 })}`,
      ]),
  },

  department: {
    list: (params: { storeId: string; page?: number; limit?: number }) => {
      const { storeId, page = 1, limit = 10 } = params
      return apiRequest<any>(`/department?${buildQueryString({ storeId, page, limit })}`)
    },
  },

  kitchen: {
    list: (params: { storeId: string; page?: number; limit?: number }) => {
      const { storeId, page = 1, limit = 10 } = params
      return apiRequest<any>(`/kitchen?${buildQueryString({ storeId, page, limit })}`)
    },
  },

  product: {
    list: (params: {
      storeId: string
      page?: number
      limit?: number
      department?: string
      kitchen?: string
      order?: "asc" | "desc"
      search?: string
    }) => {
      const queryString = buildQueryString({
        storeId: params.storeId,
        page: params.page ?? 1,
        limit: params.limit ?? 800,
        department: params.department ?? "",
        kitchen: params.kitchen ?? "",
        order: params.order ?? "desc",
        search: params.search ?? "",
      })
      return apiRequest<any>(`/product?${queryString}`)
    },
    getById: (id: string) => apiRequest<any>(`/product/${id}`),
  },

  modifier: {
    listGroups: (storeId: string, page = 1, limit = 10) =>
      apiRequest<any>(`/modifier-group?${buildQueryString({ storeId, page, limit })}`),
    listByGroup: (modifierGroupId: string | { _id?: string; id?: string }, page = 1, limit = 10) =>
      apiRequest<any>(
        `/modifier?${buildQueryString({ page, limit, modifierGroupId: normalizeId(modifierGroupId) })}`,
      ),
  },

  order: {
    place: (orderData: any) =>
      apiRequest<any>("/order/place-order", {
        method: "POST",
        body: JSON.stringify(orderData),
      }),
    getMyOrders: (page = 1, limit = 50) =>
      apiRequest<any>(`/order/my-orders?${buildQueryString({ page, limit })}`),
  },

  payment: {
    acquireInitialApiKey: () => apiRequestLocal<any>("/acquire-api-key", { method: "POST" }),
    makePayment: (params: { amount: number; paymentMethod: string; orderId: string; status: string }) => {
      const queryString = buildQueryString({
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        orderId: params.orderId,
        status: params.status,
      })

      return apiRequestLocal<any>(`/make-payment?${queryString}`)
    },
  },
}
