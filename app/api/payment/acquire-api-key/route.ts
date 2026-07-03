import { NextRequest, NextResponse } from "next/server"

const PAYMENT_GATEWAY_URL = "https://pay-cert.dcap.com/v2/AcquireInitialApiKey"
const PAYMENT_USERNAME = "AONEPDALL1GP"
const PAYMENT_PASSWORD = "96e2d7de5c514406a18766e5198ac44c"

export async function POST(request: NextRequest) {
  try {
    // Create Basic Auth header
    const credentials = Buffer.from(`${PAYMENT_USERNAME}:${PAYMENT_PASSWORD}`).toString("base64")
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    }

    const response = await fetch(PAYMENT_GATEWAY_URL, {
      method: "POST",
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
      console.error("[v0] Payment Gateway API error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Payment Gateway API response:", JSON.stringify(data).substring(0, 200))
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Payment Gateway API exception:", error)
    return NextResponse.json({ error: "Failed to fetch from payment gateway" }, { status: 500 })
  }
}

