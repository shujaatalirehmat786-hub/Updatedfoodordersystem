const BASE_URL = "/api/online-order"

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

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    console.error("[v0] API request failed:", error)
    throw error
  }
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
    acquireInitialApiKey: () => apiRequest<any>("/payment/acquire-api-key", { method: "POST" }),
    makePayment: (params: { amount: number; paymentMethod: string; orderId: string; status: string }) => {
      const queryString = buildQueryString({
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        orderId: params.orderId,
        status: params.status,
      })

      return apiRequest<any>(`/payment/make-payment?${queryString}`)
    },
  },
}
