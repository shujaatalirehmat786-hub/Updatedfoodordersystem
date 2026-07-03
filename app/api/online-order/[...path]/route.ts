import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://api.livedatanow.com/api/online-order"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

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
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API Online-Order GET exception:", error)
    return NextResponse.json({ error: "Failed to fetch from external API" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join("/")
    const url = `${BASE_URL}/${path}`
    const body = await request.text()

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
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API Online-Order POST exception:", error)
    return NextResponse.json({ error: "Failed to fetch from external API" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join("/")
    const url = `${BASE_URL}/${path}`
    const body = await request.text()

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
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API Online-Order PUT exception:", error)
    return NextResponse.json({ error: "Failed to fetch from external API" }, { status: 500 })
  }
}

