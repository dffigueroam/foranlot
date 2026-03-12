// Crear múltiples predicciones en varias loterías (uno por número)
import { getLotteriesFromDB } from "./lotteries-server"
import { canPublishPrediction } from "./timezones"
import { addDailyPnGInvestment } from "./daily-pyg"
export async function submitMultiplePredictionsLib(
  userId: number,
  lotteryNames: string[],
  lotteryType: string,
  predictedNumbersStr: string,
  drawDate: string,
  drawTime: string | null,
  confidenceLevel: string,
  notes: string | null
) {
  const confidenceValue = Number(confidenceLevel)
  if (Number.isNaN(confidenceValue) || confidenceValue < 1 || confidenceValue > 5) {
    return { error: "El nivel de confianza debe estar entre 1 y 5" }
  }

  // Validar y separar números
  const predictedNumbers = predictedNumbersStr.trim().split(" ").filter(Boolean)
  if (predictedNumbers.length === 0) {
    return { error: "Debes ingresar al menos un número" }
  }

  const digitsNum = parseInt(lotteryType.split("_")[0])
  const invalid = predictedNumbers.find(n => n.length !== digitsNum)
  if (invalid) {
    return { error: `Cada número debe tener exactamente ${digitsNum} dígitos` }
  }

  // Validar y procesar loterias
  const allLotteries = await getLotteriesFromDB()
  const validatedLotteries = lotteryNames
    .map(name => allLotteries.find(l => l.name === name))
    .filter((lot): lot is typeof allLotteries[0] => {
      if (!lot) return false
      return lot.digits.includes(digitsNum)
    })

  if (validatedLotteries.length === 0) {
    return { error: "No hay loterias válidas para los números ingresados" }
  }

  // Verificar límites antes de crear
  for (const lottery of validatedLotteries) {
    const remaining = await getRemainingDailyLimit(userId, lottery.name, lotteryType, drawDate)
    if (remaining < predictedNumbers.length) {
      return {
        error: `Límite excedido para ${lottery.name}: solo puedes agregar ${remaining} números más hoy (máx 10 por lotería por tipo de cifra por día)`
      }
    }
  }

  // 🕐 VALIDACIÓN DE TIEMPO: Verificar al menos una lotería para tiempo
  if (validatedLotteries.length > 0) {
    const firstLottery = validatedLotteries[0]
    let lotteryHour = firstLottery.time;
    if (lotteryHour === undefined && firstLottery.dayTypeHours) {
      lotteryHour = firstLottery.dayTypeHours.laboral || Object.values(firstLottery.dayTypeHours)[0];
    }
    const resolvedDrawTime = drawTime || `${lotteryHour?.toString().padStart(2, "0")}:00`
    const timeValidation = canPublishPrediction(
      drawDate,
      resolvedDrawTime,
      firstLottery.country
    )
    if (!timeValidation.allowed) {
      return { error: timeValidation.message || "No se puede publicar esta predicción" }
    }
  }

  const notesProcessed = notes && notes.trim() !== "" ? notes : undefined

  // Crear una predicción por cada número por cada lotería
  const errors: string[] = []
  let successCount = 0

  for (const lottery of validatedLotteries) {
    for (const number of predictedNumbers) {
      const result = await createPrediction(
        userId,
        lottery.name,
        lotteryType,
        number,
        drawDate,
        drawTime || null,
        confidenceValue,
        notesProcessed,
      )
      if (result.error) {
        errors.push(`${lottery.name} - ${number}: ${result.error}`)
      } else {
        successCount++
      }
    }
  }

  if (successCount === 0) {
    return { error: `No se pudieron crear pronósticos. ${errors.join(" | ")}` }
  }

  await saveLotteryCombination(userId, lotteryNames, lotteryType)

  return {
    success: true,
    message: `Pronóstico publicado: ${successCount} registros (${predictedNumbers.length} números × ${validatedLotteries.length} loterias)`
  }
}
/* ======================================================
   ACERTOS VERIFICADOS (para dashboard)
====================================================== */
export async function getVerifiedCorrectPredictionsWithUser(userId?: number) {
  try {
    const result = userId
      ? await sql`
          SELECT p.*, u.username
          FROM predictions p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_verified = TRUE AND p.is_correct = TRUE AND p.user_id = ${userId}
          ORDER BY p.created_at DESC
        `
      : await sql`
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
  user_id?: number
  predicted_number: string
  lottery_name: string
  lottery_type?: string
  created_at: string
  draw_date: string
  draw_time: string | null
}

export async function getLatestPostedPredictions(userId?: number, todayOnly = false) {
  try {
    // Reconstruye el último lote publicado usando una predicción ancla reciente.
    // Esto evita traer un rango arbitrario por fecha y permite resumir el bloque más reciente.
    if (userId) {
      const result = todayOnly
        ? await sql`
            WITH latest_anchor AS (
              SELECT
                p.user_id,
                p.draw_date,
                p.lottery_type,
                p.confidence_level,
                p.notes,
                p.created_at
              FROM predictions p
              WHERE p.user_id = ${userId}
                AND (p.created_at AT TIME ZONE 'America/Bogota')::date = (NOW() AT TIME ZONE 'America/Bogota')::date
              ORDER BY p.created_at DESC
              LIMIT 1
            )
            SELECT
              p.user_id,
              p.predicted_number,
              p.lottery_name,
              p.lottery_type,
              p.created_at,
              p.draw_date,
              p.draw_time
            FROM predictions p
            JOIN latest_anchor a
              ON p.user_id = a.user_id
             AND p.draw_date = a.draw_date
             AND p.lottery_type = a.lottery_type
             AND p.confidence_level = a.confidence_level
             AND p.created_at >= (a.created_at - INTERVAL '5 minutes')
             AND ((p.notes IS NULL AND a.notes IS NULL) OR p.notes = a.notes)
            ORDER BY p.created_at DESC, p.lottery_name ASC, p.predicted_number ASC
          `
        : await sql`
        WITH latest_anchor AS (
          SELECT
            p.user_id,
            p.draw_date,
            p.lottery_type,
            p.confidence_level,
            p.notes,
            p.created_at
          FROM predictions p
          WHERE p.user_id = ${userId}
          ORDER BY p.created_at DESC
          LIMIT 1
        )
        SELECT
          p.user_id,
          p.predicted_number,
          p.lottery_name,
          p.lottery_type,
          p.created_at,
          p.draw_date,
          p.draw_time
        FROM predictions p
        JOIN latest_anchor a
          ON p.user_id = a.user_id
         AND p.draw_date = a.draw_date
         AND p.lottery_type = a.lottery_type
         AND p.confidence_level = a.confidence_level
         AND p.created_at >= (a.created_at - INTERVAL '5 minutes')
         AND ((p.notes IS NULL AND a.notes IS NULL) OR p.notes = a.notes)
        ORDER BY p.created_at DESC, p.lottery_name ASC, p.predicted_number ASC
      `

      return result as LatestPostedPrediction[]
    }

    const result = await sql`
      WITH latest_anchor AS (
        SELECT
          p.user_id,
          p.draw_date,
          p.lottery_type,
          p.confidence_level,
          p.notes,
          p.created_at
        FROM predictions p
        ORDER BY p.created_at DESC
        LIMIT 1
      )
      SELECT
        p.user_id,
        p.predicted_number,
        p.lottery_name,
        p.lottery_type,
        p.created_at,
        p.draw_date,
        p.draw_time
      FROM predictions p
      JOIN latest_anchor a
        ON p.user_id = a.user_id
       AND p.draw_date = a.draw_date
       AND p.lottery_type = a.lottery_type
       AND p.confidence_level = a.confidence_level
       AND p.created_at >= (a.created_at - INTERVAL '5 minutes')
       AND ((p.notes IS NULL AND a.notes IS NULL) OR p.notes = a.notes)
      ORDER BY p.created_at DESC, p.lottery_name ASC, p.predicted_number ASC
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
      const lotteries = await getLotteriesFromDB()
      const lottery = lotteries.find((item) => item.name === lotteryName)

      if (!lottery) {
        return { error: "La lotería seleccionada no existe o no está activa" }
      }

      const digitCount = parseInt(lotteryType.split("_")[0])
      if (!lottery.digits.includes(digitCount)) {
        return {
          error: `La lotería ${lotteryName} no soporta ${digitCount} cifras`,
        }
      }

      const resolvedDrawTime = drawTime || `${lottery.time.toString().padStart(2, "0")}:00`
      const timeValidation = canPublishPrediction(drawDate, resolvedDrawTime, lottery.country)
      if (!timeValidation.allowed) {
        return { error: timeValidation.message || "La lotería no está disponible para postear en la fecha/hora seleccionada." }
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
      await addDailyPnGInvestment({
        userId,
        predictionDate: drawDate,
        predictedNumber,
      })

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
