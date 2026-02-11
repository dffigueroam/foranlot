import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredTokens } from "@/lib/email-verification"

/**
 * Cron job para limpiar tokens de verificación de email expirados
 * Debe ejecutarse diariamente a las 3 AM
 * 
 * Configurar en Vercel:
 * Schedule: 0 3 * * * (3 AM diariamente)
 * URL: /api/cron/cleanup-email-tokens
 * Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized cron attempt for cleanup-email-tokens")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting cleanup of expired email verification tokens...")

    const result = await cleanupExpiredTokens()

    if (!result.success) {
      return NextResponse.json(
        { error: "Error cleaning up tokens" },
        { status: 500 }
      )
    }

    console.log(`[v0] Successfully cleaned up ${result.deletedCount} expired tokens`)

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("[v0] Error in cleanup-email-tokens cron:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
