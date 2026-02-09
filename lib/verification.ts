import "server-only"
import { neon } from "@neondatabase/serverless"
import { fetchLotteryResults } from "./lottery-api"
import { updateRankings } from "./ranking"

const sql = neon(process.env.DATABASE_URL!)

// Verificar pronósticos para una fecha específica
export async function verifyPredictionsForDate(date: string) {
  try {
    console.log("[v0] Starting verification for date:", date)

    // Obtener resultados oficiales de lotería
    const lotteryResults = await fetchLotteryResults(date)

    console.log("[v0] Fetched lottery results:", lotteryResults.length)

    // Guardar resultados en la base de datos
    for (const result of lotteryResults) {
      await sql`
        INSERT INTO lottery_results (lottery_name, winning_number, draw_date)
        VALUES (${result.lottery_name}, ${result.winning_number}, ${result.draw_date})
        ON CONFLICT (lottery_name, draw_date)
        DO UPDATE SET winning_number = ${result.winning_number}, verified_at = CURRENT_TIMESTAMP
      `
    }

    // Verificar cada pronóstico
    let verifiedCount = 0
    let correctCount = 0

    for (const result of lotteryResults) {
      const updatedPredictions = await sql`
        UPDATE predictions
        SET 
          is_verified = true,
          is_correct = (predicted_number = ${result.winning_number}),
          actual_number = ${result.winning_number},
          updated_at = CURRENT_TIMESTAMP
        WHERE draw_date = ${result.draw_date}
          AND lottery_name = ${result.lottery_name}
          AND is_verified = false
        RETURNING id, is_correct
      `

      verifiedCount += updatedPredictions.length
      correctCount += updatedPredictions.filter((p: any) => p.is_correct).length
    }

    console.log("[v0] Verified predictions:", verifiedCount, "Correct:", correctCount)

    // Actualizar rankings
    await updateRankings()

    return {
      success: true,
      verified: verifiedCount,
      correct: correctCount,
      resultsProcessed: lotteryResults.length,
    }
  } catch (error) {
    console.error("[v0] Error verifying predictions:", error)
    return { error: "Error al verificar pronósticos" }
  }
}

// Verificar pronósticos pendientes de los últimos días
export async function verifyPendingPredictions() {
  try {
    // Obtener fechas únicas de pronósticos no verificados
    const pendingDates = await sql`
      SELECT DISTINCT DATE(draw_date) as date
      FROM predictions
      WHERE is_verified = false
        AND draw_date <= CURRENT_DATE
      ORDER BY draw_date DESC
      LIMIT 7
    `

    console.log("[v0] Found pending dates:", pendingDates.length)

    let totalVerified = 0
    let totalCorrect = 0

    for (const row of pendingDates) {
      const date = (row as any).date
      const result = await verifyPredictionsForDate(date)

      if (result.success) {
        totalVerified += result.verified || 0
        totalCorrect += result.correct || 0
      }
    }

    return {
      success: true,
      totalVerified,
      totalCorrect,
      datesProcessed: pendingDates.length,
    }
  } catch (error) {
    console.error("[v0] Error verifying pending predictions:", error)
    return { error: "Error al verificar pronósticos pendientes" }
  }
}

// Obtener resultados oficiales guardados
export async function getLotteryResults(date?: string, limit = 50) {
  try {
    let results

    if (date) {
      results = await sql`
        SELECT * FROM lottery_results
        WHERE draw_date = ${date}
        ORDER BY lottery_name
      `
    } else {
      // Obtener resultados de últimas 24 horas (últimas 2-3 fechas típicamente)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]
      
      results = await sql`
        SELECT * FROM lottery_results
        WHERE draw_date >= ${yesterdayStr}
        ORDER BY draw_date DESC, lottery_name ASC
        LIMIT ${limit}
      `
    }

    return results
  } catch (error) {
    console.error("[v0] Error getting lottery results:", error)
    return []
  }
}
