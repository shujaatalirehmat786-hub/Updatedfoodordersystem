import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "https://api.livedatanow.com/api/online-order/payment/make-payment"

function getWebOrderToken(): string | null {
  return process.env.WEB_ORDER_TOKEN || null
}

function buildUrl(request: NextRequest): string {
  const searchParams = request.nextUrl.searchParams.toString()
  return `${BACKEND_URL}${searchParams ? `?${searchParams}` : ""}`
}

async function forwardPaymentRequest(request: NextRequest, method: "GET" | "POST" | "PUT") {
  const token = getWebOrderToken()
  if (!token) {
    return NextResponse.json({ error: "WEB_ORDER_TOKEN is not set" }, { status: 500 })
  }

  const url = buildUrl(request)
  const body = method === "GET" ? undefined : await request.text()
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    let errorMessage = errorText || response.statusText || `HTTP ${response.status}`
    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // keep fallback message
    }
    return NextResponse.json({ error: errorMessage }, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}

export async function GET(request: NextRequest) {
  try {
    return await forwardPaymentRequest(request, "GET")
  } catch (error) {
    console.error("[v0] Payment make GET exception:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    return await forwardPaymentRequest(request, "POST")
  } catch (error) {
    console.error("[v0] Payment make POST exception:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await forwardPaymentRequest(request, "PUT")
  } catch (error) {
    console.error("[v0] Payment make PUT exception:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}
