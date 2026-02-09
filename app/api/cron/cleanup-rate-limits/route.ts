import { NextResponse } from "next/server"
import { cleanupRateLimits } from "@/lib/security"

/**
 * Cron job para limpiar rate limits antiguos
 * Schedule: 0 2 * * * (2 AM diario)
 * 
 * Configurar en cron-job.org:
 * URL: https://tudominio.com/api/cron/cleanup-rate-limits
 * Schedule: 0 2 * * *
 * Authorization: Bearer [CRON_SECRET]
 */

export async function GET(request: Request) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    console.log("[v0] Iniciando limpieza de rate limits...")

    const result = await cleanupRateLimits()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Rate limits limpiados exitosamente",
    })

  } catch (error) {
    console.error("[v0] Error en cron de cleanup:", error)
    return NextResponse.json(
      { error: "Error al limpiar rate limits" },
      { status: 500 }
    )
  }
}
