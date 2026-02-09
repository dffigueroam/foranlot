import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateRankings } from "@/lib/ranking"
import { saveRankingScores, calculateUserScores } from "@/lib/compensation"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Endpoint API para actualización manual del ranking
 * Solo accesible por administradores
 * 
 * GET /api/admin/update-ranking
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación y rol de admin
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado - Se requiere rol de administrador" },
        { status: 403 }
      )
    }

    console.log("[v0] API manual ranking update initiated by:", user.username)

    // 1. Actualizar estadísticas básicas
    await updateRankings()

    // 2. Obtener usuarios activos
    const activeUsers = await sql`
      SELECT DISTINCT user_id, 100 as amount
      FROM predictions
      WHERE is_verified = true
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      LIMIT 100
    `

    // 3. Calcular y guardar scores
    if (activeUsers.length > 0) {
      const userScores = await calculateUserScores({
        totalCapital: activeUsers.length * 100,
        multiplier: 400,
        winningNumber: "0000",
        lotteryType: "4_digits",
        drawDate: new Date().toISOString().split('T')[0],
        userContributions: activeUsers.map((u: any) => ({
          userId: u.user_id,
          amount: u.amount,
        })),
      })

      await saveRankingScores(userScores)
    }

    console.log("[v0] API manual ranking update completed successfully")

    return NextResponse.json({
      success: true,
      message: "Ranking actualizado exitosamente",
      data: {
        usersProcessed: activeUsers.length,
        timestamp: new Date().toISOString(),
        triggeredBy: user.username,
      },
    })

  } catch (error: any) {
    console.error("[v0] Error in API manual ranking update:", error)
    
    return NextResponse.json(
      {
        error: "Error al actualizar el ranking",
        details: error?.message || "Error desconocido",
      },
      { status: 500 }
    )
  }
}

/**
 * POST también soportado para compatibilidad
 */
export async function POST(request: Request) {
  return GET(request)
}
