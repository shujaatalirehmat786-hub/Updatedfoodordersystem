import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://api.livedatanow.com/api/online-order"

export async function GET(request: NextRequest) {
  try {
    const token = process.env.WEB_ORDER_TOKEN
    if (!token) {
      return NextResponse.json({ error: "WEB_ORDER_TOKEN is not set" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BASE_URL}/order/my-orders${searchParams ? `?${searchParams}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorData.message || errorText
      } catch {
        errorMessage = errorText || response.statusText || `HTTP ${response.status}`
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] My Orders API exception:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

