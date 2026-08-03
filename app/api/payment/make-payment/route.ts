import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "https://api.livedatanow.com/api/online-order/payment/make-payment"

function getWebOrderToken(): string | null {
  return process.env.WEB_ORDER_TOKEN || null
}

function buildUrl(request: NextRequest): string {
  const searchParams = request.nextUrl.searchParams.toString()
  return `${BACKEND_URL}${searchParams ? `?${searchParams}` : ""}`
}

async function forwardPaymentRequest(request: NextRequest) {
  // Payment is made on behalf of the authenticated customer. Use the
  // browser session token first; the server token remains available for
  // deployments that configure it explicitly.
  const authorization = request.headers.get("authorization")
  const configuredToken = getWebOrderToken()
  const authorizationHeader = authorization || (configuredToken ? `Bearer ${configuredToken}` : null)
  if (!authorizationHeader) {
    return NextResponse.json({ error: "Authentication token is missing" }, { status: 401 })
  }

  const url = buildUrl(request)
  const body = await request.text()
  const headers = {
    "Content-Type": "application/json",
    Authorization: authorizationHeader,
  }

  const response = await fetch(url, { method: "POST", headers, body })
  const status = response.status
  const errorText = await response.text().catch(() => "")

  if (status < 200 || status >= 300) {
    let errorMessage = errorText || `HTTP ${status}`
    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // keep fallback message
    }
    return NextResponse.json({ error: errorMessage }, { status })
  }

  const data = errorText ? JSON.parse(errorText) : {}
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    return await forwardPaymentRequest(request)
  } catch (error) {
    console.error("[v0] Payment make POST exception:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}
