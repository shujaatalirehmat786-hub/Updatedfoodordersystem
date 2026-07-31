import { request as httpsRequest } from "node:https"
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

  let status: number
  let errorText: string
  if (method === "GET") {
    const result = await requestGetWithBody(url, headers, body)
    status = result.status
    errorText = result.body

    // The supplied collection documents GET, but some deployed backend
    // versions expose this endpoint as POST. Retry only on an explicit GET
    // route rejection so a successful payment is never submitted twice.
    if (status === 404 || status === 405 || errorText.includes("Cannot GET")) {
      const fallbackResponse = await fetch(url, {
        method: "POST",
        headers,
        body,
      })
      status = fallbackResponse.status
      errorText = await fallbackResponse.text().catch(() => "")
    }
  } else {
    const response = await fetch(url, { method, headers, body })
    status = response.status
    errorText = await response.text().catch(() => "")
  }

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

function requestGetWithBody(
  url: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const request = httpsRequest(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "GET",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on("data", (chunk: Buffer) => chunks.push(chunk))
        response.on("end", () => {
          resolve({
            status: response.statusCode || 500,
            body: Buffer.concat(chunks).toString("utf8"),
          })
        })
      },
    )
    request.on("error", reject)
    request.write(body)
    request.end()
  })
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
    // Browsers cannot send a body with GET. The local transport is POST,
    // while the external payment API still receives its required GET body.
    return await forwardPaymentRequest(request, "GET")
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
