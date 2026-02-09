"use server"

import { revalidatePath } from "next/cache"
import { neon } from "@neondatabase/serverless"
import { ENVIRONMENT_CONFIG } from "@/lib/environment-config"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Limpiar resultados de lotería más antiguos de X días
 * Y que ya hayan sido objeto de cálculo de scores
 */
export async function cleanupOldLotteryResults() {
  try {
    const retentionDays = ENVIRONMENT_CONFIG.LOTTERY_RESULTS_RETENTION_DAYS

    // Obtener resultados a eliminar (que ya han sido usados para calcular scores)
    const resultsToDelete = await sql`
      SELECT lr.id
      FROM lottery_results lr
      WHERE lr.draw_date < (CURRENT_DATE - (${retentionDays} * INTERVAL '1 day'))
        AND EXISTS (
          SELECT 1 FROM user_ranking_scores urs
          WHERE DATE(urs.score_date) >= DATE(lr.draw_date)
        )
    `

    if (resultsToDelete.length === 0) {
      console.log("[v0] No hay resultados de lotería para limpiar")
      return { success: true, deleted: 0 }
    }

    // Eliminar registros
    const result = await sql`
      DELETE FROM lottery_results
      WHERE draw_date < (CURRENT_DATE - (${retentionDays} * INTERVAL '1 day'))
        AND EXISTS (
          SELECT 1 FROM user_ranking_scores urs
          WHERE DATE(urs.score_date) >= DATE(lottery_results.draw_date)
        )
    `

    const deleted = resultsToDelete.length

    console.log(`[v0] Limpieza completada: ${deleted} resultados de lotería eliminados`)

    revalidatePath("/admin")

    return { success: true, deleted }

  } catch (error) {
    console.error("[v0] Error cleaning up lottery results:", error)
    return { error: "Error al limpiar resultados" }
  }
}
