import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Evita que Next.js intente evaluar esto en build
export const dynamic = "force-dynamic"

/**
 * Cron job: Expirar slots de contratos vencidos
 * Frecuencia: Diaria - 2:00 AM
 * Vercel cron: 0 2 * * * (2 AM todos los días)
 * 
 * Protección: Requiere header Authorization: Bearer CRON_SECRET
 * 
 * Proceso:
 * 1. Llama a deactivate_expired_slots() en la base de datos
 * 2. Desactiva todos los slots con valid_until < NOW()
 * 3. Crea notificaciones para usuarios afectados
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[cron-expire-slots] Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[cron-expire-slots] Starting slot expiration check...")

    // Llamar a la función SQL que expira slots
    const result = await sql`
      SELECT deactivate_expired_slots() as expired_count
    `

    const expiredCount = result[0]?.expired_count || 0

    console.log(`[cron-expire-slots] Expired ${expiredCount} slot(s)`)

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[cron-expire-slots] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
