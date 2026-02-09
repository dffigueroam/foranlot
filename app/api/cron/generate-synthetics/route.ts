import { NextResponse } from "next/server"
import { generateMonthlySynthetics } from "@/lib/synthetic-users"

/**
 * Cron job para generar usuarios sintéticos
 * Schedule: 0 0 15 * * (medianoche del día 15 de cada mes)
 * 
 * Configurar en cron-job.org:
 * URL: https://tudominio.com/api/cron/generate-synthetics
 * Schedule: 0 0 15 * *
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

    console.log("[v0] Iniciando generación mensual de usuarios sintéticos...")

    const result = await generateMonthlySynthetics()

    console.log("[v0] Generación completa:", result)

    return NextResponse.json({
      success: true,
      message: `Generados ${result.total} usuarios sintéticos`,
      dayBestUsers: result.dayBestUsers.length,
      lotBestUsers: result.lotBestUsers.length,
      details: result,
    })

  } catch (error) {
    console.error("[v0] Error en cron de usuarios sintéticos:", error)
    return NextResponse.json(
      { error: "Error al generar usuarios sintéticos" },
      { status: 500 }
    )
  }
}
