"use server"

import { revalidatePath } from "next/cache"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { updateRankings } from "@/lib/ranking"
import { saveRankingScores, calculateRankingScoresForPeriod } from "@/lib/compensation"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Actualizar ranking manualmente desde el panel de admin
 * Ejecuta el mismo proceso que el cron job automático
 */
export async function updateRankingManually() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    console.log("[v0] Manual ranking update initiated by:", user.username)

    // 1. Actualizar estadísticas básicas (user_stats)
    await updateRankings()

    // 2. Calcular scores detallados para usuarios activos
    const userScores = await calculateRankingScoresForPeriod(15)

    if (userScores.length > 0) {
      // 3. Guardar scores en user_ranking_scores con fecha actual
      await saveRankingScores(userScores)
    }

    // 4. Revalidar páginas que muestran ranking
    revalidatePath("/ranking")
    revalidatePath("/admin")
    revalidatePath("/dashboard")

    console.log("[v0] Manual ranking update completed successfully")

    return {
      success: true,
      message: "Ranking actualizado exitosamente",
      usersProcessed: userScores.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error("[v0] Error in manual ranking update:", error)
    return {
      error: "Error al actualizar el ranking",
      details: error?.message || "Error desconocido",
    }
  }
}

/**
 * Obtener estadísticas del último cálculo de ranking
 */
export async function getRankingUpdateStats() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    // Última fecha de actualización
    const lastUpdate = await sql`
      SELECT MAX(score_date) as last_update, COUNT(DISTINCT user_id) as users_count
      FROM user_ranking_scores
    `

    // Total de usuarios con predicciones verificadas
    const totalUsers = await sql`
      SELECT COUNT(DISTINCT user_id) as total
      FROM predictions
      WHERE is_verified = true
    `

    // Predicciones pendientes de verificar
    const pendingPredictions = await sql`
      SELECT COUNT(*) as pending
      FROM predictions
      WHERE is_verified = false
        AND draw_date <= CURRENT_DATE
    `

    return {
      success: true,
      stats: {
        lastUpdate: lastUpdate[0]?.last_update || null,
        usersInRanking: lastUpdate[0]?.users_count || 0,
        totalActiveUsers: totalUsers[0]?.total || 0,
        pendingVerifications: pendingPredictions[0]?.pending || 0,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error getting ranking stats:", error)
    return { error: "Error al obtener estadísticas" }
  }
}
