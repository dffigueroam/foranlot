import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Cron job para resetear límites de herramientas a medianoche
 * 
 * Schedule: 0 0 * * * (medianoche)
 * URL: /api/cron/reset-tool-limits
 * Authorization: Bearer [CRON_SECRET]
 */
export async function GET(request: Request) {
  // Verificar token de autenticación
  const authHeader = request.headers.get("authorization")

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Running daily tool limits reset cron job")

  try {
    // Llamar función SQL para limpiar registros antiguos
    const result = await sql`SELECT reset_daily_tool_limits() as reset_count`

    console.log("[v0] Daily tool limits reset completed:", result[0].reset_count)

    return NextResponse.json({
      success: true,
      message: "Tool limits reset completed",
      recordsCleaned: result[0].reset_count,
    })
  } catch (error: any) {
    console.error("[v0] Error in tool limits reset cron:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
