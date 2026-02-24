/* ======================================================
   ACERTOS VERIFICADOS (para dashboard)
====================================================== */
export async function getVerifiedCorrectPredictionsWithUser() {
  try {
    const result = await sql`
      SELECT p.*, u.username
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_verified = TRUE AND p.is_correct = TRUE
      ORDER BY p.created_at DESC
    `;
    return result as Prediction[];
  } catch (error) {
    console.error("[predictions] Error getting verified correct predictions:", error);
    return [];
  }
}
import "server-only"
import { neon } from "@neondatabase/serverless"
import { saveLotteryCombination } from "./lottery-combinations"

const sql = neon(process.env.DATABASE_URL!)

export interface Prediction {
  id: number
  user_id: number
  username: string
  lottery_name: string
  lottery_type: string
  predicted_number: string
  draw_date: string
  draw_time: string | null
  is_verified: boolean
  is_correct: boolean | null
  actual_number: string | null
  match_type?: 'exact' | 'combination' | 'no_match'
  match_score?: number
  confidence_level: number
  notes?: string | null
  created_at: string
  visibility: "private" | "contracted"
}

/* ======================================================
   VERIFICAR LÍMITE DIARIO
====================================================== */
export async function getRemainingDailyLimit(
  userId: number,
  lotteryName: string,
  lotteryType: string,
  drawDate: string
): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*)::int as count
      FROM predictions
      WHERE user_id = ${userId}
        AND lottery_name = ${lotteryName}
        AND lottery_type = ${lotteryType}
        AND DATE(draw_date) = DATE(${drawDate})
    `
    const current = result[0]?.count || 0
    return Math.max(0, 10 - current)
  } catch (error) {
    console.error("[predictions] Error checking limit:", error)
    return 0
  }
}

/* ======================================================
   DASHBOARD / FEED
   👉 SOLO pronósticos del usuario
====================================================== */
export async function getPredictions(userId: number | null, limit?: number) {
  if (!userId) return []

  try {
    const predictions = typeof limit === "number"
      ? await sql`
          SELECT 
            p.*,
            u.username
          FROM predictions p
          JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ${userId}
          AND p.draw_date >= (CURRENT_DATE - INTERVAL '3 days')
          ORDER BY p.draw_date DESC, p.created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT 
            p.*,
            u.username
          FROM predictions p
          JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ${userId}
          AND p.draw_date >= (CURRENT_DATE - INTERVAL '3 days')
          ORDER BY p.draw_date DESC, p.created_at DESC
        `

    // Debug: Log first 3 records
    if (predictions.length > 0) {
      console.log(`[getPredictions] Found ${predictions.length} predictions for user ${userId}`)
      console.log("[getPredictions] First 3 records:", predictions.slice(0, 3).map(p => ({
        id: p.id,
        match_type: p.match_type,
        is_verified: p.is_verified,
        predicted_number: p.predicted_number,
        actual_number: p.actual_number
      })))
    }

    return predictions as Prediction[]
  } catch (error) {
    console.error("[predictions] Error getting predictions:", error)
    return []
  }
}

/* ======================================================
   RESUMEN ÚLTIMO POSTEADO (global)
====================================================== */
export interface LatestPostedPrediction {
  predicted_number: string
  lottery_name: string
  created_at: string
  draw_date: string
  draw_time: string | null
}

export async function getLatestPostedPredictions(userId: number) {
  try {
    const result = await sql`
      SELECT
        p.predicted_number,
        p.lottery_name,
        p.created_at,
        p.draw_date,
        p.draw_time
      FROM predictions p
      WHERE p.user_id = ${userId}
      AND DATE(p.created_at) = (
        SELECT DATE(MAX(created_at))
        FROM predictions
        WHERE user_id = ${userId}
      )
      ORDER BY p.created_at DESC
    `

    return result as LatestPostedPrediction[]
  } catch (error) {
    console.error("[predictions] Error getting latest posted predictions:", error)
    return []
  }
}

/* ======================================================
   CREAR PRONÓSTICO
   👉 SIEMPRE privado al inicio
====================================================== */
export async function createPrediction(
  userId: number,
  lotteryName: string,
  lotteryType: string,
  predictedNumber: string,
  drawDate: string,
  drawTime: string | null,
  confidenceLevel: number,
  notes?: string,
) {
  try {
    // Validar que drawDate es válido
    if (!drawDate) {
      return { error: "Fecha de sorteo es requerida" }
    }

    // Validar que drawDate sea una fecha válida
    const dateObj = new Date(drawDate)
    if (isNaN(dateObj.getTime())) {
      return { error: "Fecha de sorteo inválida" }
    }

    // Validar límite de 10 números por lotería por tipo de cifra por día
    const todayCount = await sql`
      SELECT COUNT(*)::int as count
      FROM predictions
      WHERE user_id = ${userId}
        AND lottery_name = ${lotteryName}
        AND lottery_type = ${lotteryType}
        AND DATE(draw_date) = DATE(${drawDate})
    `

    if (todayCount[0]?.count >= 10) {
      return { error: "Has alcanzado el límite de 10 pronósticos por lotería por tipo de cifra por día" }
    }

    if (lotteryName !== "sin_definir") {
      // Validación avanzada: consultar lotería desde la BD y aplicar lógica de disponibilidad
      const { getAvailableLotteriesForPosting } = await import("./lotteries")
      const availableLotteries = await getAvailableLotteriesForPosting(drawDate, "Colombia")
      const lottery = availableLotteries.find(l => l.name === lotteryName)
      if (!lottery) {
        return { error: "La lotería no está disponible para postear en la fecha/hora seleccionada (verifica el día y la hora límite)." }
      }

      const digitCount = parseInt(lotteryType.split("_")[0])
      if (!lottery.digits.includes(digitCount)) {
        return {
          error: `La lotería ${lotteryName} no soporta ${digitCount} cifras`,
        }
      }
    }

    // Validar que predictedNumber no está vacío
    if (!predictedNumber || predictedNumber.trim() === "") {
      return { error: "Números pronosticados requeridos" }
    }

    // Convertir drawTime: "null" string → null real
    const finalDrawTime = drawTime === "null" || !drawTime ? null : drawTime

    const result = await sql`
      INSERT INTO predictions (
        user_id,
        lottery_name,
        lottery_type,
        predicted_number,
        draw_date,
        draw_time,
        confidence_level,
        notes,
        visibility
      )
      VALUES (
        ${userId},
        ${lotteryName},
        ${lotteryType},
        ${predictedNumber},
        ${drawDate},
        ${finalDrawTime},
        ${confidenceLevel},
        ${notes || null},
        'private'
      )
      RETURNING *
    `

    // Guardar la combinación de loterías para reutilización rápida
    if (result.length > 0) {
      await saveLotteryCombination(userId, [lotteryName], lotteryType)
    }

    return { prediction: result[0] }
  } catch (error: any) {
    console.error("[v0] Error creating prediction:", error)
    // Log del error específico para debugging
    const errorMsg = error?.message || error?.toString() || "Error desconocido"
    console.error("[v0] Error details:", errorMsg)
    return { error: `Error al crear pronóstico: ${errorMsg}` }
  }
}

/* ======================================================
   PERFIL DEL USUARIO
   👉 VE TODO LO SUYO
====================================================== */
export async function getUserPredictions(userId: number) {
  try {
    const predictions = await sql`
      SELECT 
        p.*,
        u.username
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
      LIMIT 50
    `

    return predictions as Prediction[]
  } catch (error) {
    console.error("[predictions] Error getting user predictions:", error)
    return []
  }
}

/* ======================================================
   ESTADÍSTICAS
====================================================== */
export async function getPredictionStatsByType(userId: number) {
  try {
    const stats = await sql`
      SELECT 
        lottery_type,
        COUNT(*) as total,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct,
        ROUND(
          COUNT(CASE WHEN is_correct = true THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(CASE WHEN is_verified = true THEN 1 END), 0) * 100,
          2
        ) as accuracy
      FROM predictions
      WHERE user_id = ${userId}
        AND is_verified = true
      GROUP BY lottery_type
    `

    return stats
  } catch (error) {
    console.error("[predictions] Error getting prediction stats:", error)
    return []
  }
}

/* ======================================================
   COMBINACIONES DE LOTERÍAS (últimas usadas)
====================================================== */
export interface LotteryCombination {
  id: number
  lottery_names: string[]
  digit_type: string
  usage_count: number
  is_favorite: boolean
  created_at: string
  last_used_at: string
}

export async function toggleFavoriteCombination(
  combinationId: number,
  userId: number
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
  try {
    const result = await sql`
      SELECT * FROM toggle_favorite_combination(${combinationId}, ${userId})
    `

    if (result.length > 0 && result[0].success) {
      return {
        success: true,
        isFavorite: result[0].is_favorite
      }
    }

    return { success: false, error: "No se pudo actualizar favorito" }
  } catch (error) {
    console.error("[predictions] Error toggling favorite:", error)
    return { success: false, error: "Error al actualizar favorito" }
  }
}

export async function deleteLotteryCombination(
  combinationId: number,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sql`
      SELECT * FROM delete_lottery_combination(${combinationId}, ${userId})
    `

    if (result.length > 0 && result[0].success) {
      return { success: true }
    }

    return { success: false, error: "No se pudo eliminar la combinación" }
  } catch (error) {
    console.error("[predictions] Error deleting combination:", error)
    return { success: false, error: "Error al eliminar combinación" }
  }
}

export async function incrementCombinationUsage(
  combinationId: number,
  userId: number
): Promise<{ success: boolean }> {
  try {
    const result = await sql`
      SELECT * FROM increment_combination_usage(${combinationId}, ${userId})
    `

    return { success: result.length > 0 && result[0].success }
  } catch (error) {
    console.error("[predictions] Error incrementing usage:", error)
    return { success: false }
  }
}
