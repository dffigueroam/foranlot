import { getPaymentMethods } from "@/lib/payment-methods"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[DEBUG] /api/debug/payment-methods endpoint called")
    console.log("[DEBUG] ENCRYPTION_KEY available:", !!process.env.ENCRYPTION_KEY)
    console.log("[DEBUG] ENCRYPTION_KEY length:", process.env.ENCRYPTION_KEY?.length || 0)

    const paymentMethods = getPaymentMethods()

    console.log("[DEBUG] Returned payment methods:", paymentMethods.length)

    return NextResponse.json({
      success: true,
      count: paymentMethods.length,
      methods: paymentMethods.map((method) => ({
        id: method.id,
        name: method.name,
        account: method.account,
        type: method.type,
      })),
      debug: {
        encryptionKeyAvailable: !!process.env.ENCRYPTION_KEY,
        encryptionKeyLength: process.env.ENCRYPTION_KEY?.length || 0,
        envProduction: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("[DEBUG] Error in /api/debug/payment-methods:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
