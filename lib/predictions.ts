import "server-only"
import { neon } from "@neondatabase/serverless"
import { LOTTERIES } from "./lotteries"

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
export async function getPredictions(userId: number | null, limit: number = 100) {
  if (!userId) return []

  try {
    const predictions = await sql`
      SELECT 
        p.*,
        u.username
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `

    return predictions as Prediction[]
  } catch (error) {
    console.error("[predictions] Error getting predictions:", error)
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
      const lottery = LOTTERIES.find(l => l.name === lotteryName)
      if (!lottery) {
        return { error: "Lotería no válida" }
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
