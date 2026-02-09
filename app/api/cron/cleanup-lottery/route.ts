import { NextResponse } from "next/server"
import { cleanupOldLotteryResults } from "@/app/actions/admin/cleanup-lottery"

/**
 * Cron job para limpiar resultados de lotería antiguos
 * Schedule: 0 3 * * * (3 AM diario)
 * 
 * Configura en cron-job.org:
 * URL: https://tudominio.com/api/cron/cleanup-lottery
 * Schedule: 0 3 * * *
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

    console.log("[v0] Iniciando limpieza de resultados de lotería...")

    const result = await cleanupOldLotteryResults()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Limpieza completada: ${result.deleted} registros eliminados`,
      deletedCount: result.deleted,
    })

  } catch (error) {
    console.error("[v0] Error en cron cleanup-lottery:", error)
    return NextResponse.json(
      { error: "Error al limpiar resultados" },
      { status: 500 }
    )
  }
}
