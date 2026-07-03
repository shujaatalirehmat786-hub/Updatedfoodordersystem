import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://api.livedatanow.com/api/online-order"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

    console.log("[v0] API Proxy GET:", url)

    const token = request.headers.get("authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = token
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
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
      console.error("[v0] API Proxy GET error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] API Proxy GET response:", JSON.stringify(data).substring(0, 200))
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API Proxy GET exception:", error)
    return NextResponse.json({ error: "Failed to fetch from external API" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join("/")
    const url = `${BASE_URL}/${path}`
    const body = await request.text()

    console.log("[v0] API Proxy POST:", url)
    console.log("[v0] API Proxy POST body:", body)

    const token = request.headers.get("authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = token
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
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
      console.error("[v0] API Proxy POST error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] API Proxy POST response:", JSON.stringify(data))
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API Proxy POST exception:", error)
    return NextResponse.json({ error: "Failed to fetch from external API" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join("/")
    const url = `${BASE_URL}/${path}`
    const body = await request.text()

    console.log("[v0] API Proxy PUT:", url)

    const token = request.headers.get("authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = token
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body,
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
      console.error("[v0] API Proxy PUT error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] API Proxy PUT response:", JSON.stringify(data).substring(0, 200))
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API Proxy PUT exception:", error)
    return NextResponse.json({ error: "Failed to fetch from external API" }, { status: 500 })
  }
}
