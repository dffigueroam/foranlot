import "server-only"
import { neon } from "@neondatabase/serverless"
import { fetchLotteryResults } from "./lottery-api"
import { updateRankings } from "./ranking"
import { LOTTERIES } from "./lotteries"

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
      // Extraer solo dígitos para digits_4
      const digitsOnly = (result.winning_number || "").replace(/\D/g, "").slice(0, 4).padStart(4, "0")
      
      await sql`
        INSERT INTO lottery_results (lottery_name, winning_number, digits_4, draw_date)
        VALUES (${result.lottery_name}, ${result.winning_number}, ${digitsOnly}, ${result.draw_date})
        ON CONFLICT (lottery_name, draw_date)
        DO UPDATE SET winning_number = ${result.winning_number}, digits_4 = ${digitsOnly}, verified_at = CURRENT_TIMESTAMP
      `
    }

    // Verificar cada pronóstico
    let verifiedCount = 0
    let correctCount = 0

    for (const result of lotteryResults) {
      // Usar digits_4 para la comparación (números limpios)
      const digitsOnly = (result.winning_number || "").replace(/\D/g, "").slice(0, 4).padStart(4, "0")
      
      const updatedPredictions = await sql`
        UPDATE predictions
        SET 
          is_verified = true,
          is_correct = (predicted_number = ${digitsOnly}),
          actual_number = ${digitsOnly},
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
        ORDER BY lottery_name ASC
      `
    } else {
      // Obtener resultados de últimas 24 horas usando subquery
      results = await sql`
        SELECT * FROM lottery_results
        WHERE draw_date >= (
          SELECT MAX(draw_date) - INTERVAL '1 day'
          FROM lottery_results
        )
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

// Obtener resultados solo del último día disponible
export async function getLastDayResults() {
  try {
    // Obtener el último resultado disponible de cada lotería (independiente de la fecha)
    const results = await sql`
      WITH results AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY lottery_name
            ORDER BY draw_date DESC
          ) AS rn
        FROM lottery_results
      )
      SELECT *
      FROM results
      WHERE rn = 1
      ORDER BY lottery_name ASC
    `

    return results
  } catch (error) {
    console.error("[v0] Error getting latest results:", error)
    return []
  }
}

// Obtener resultados agrupados por país
export async function getLastDayResultsByCountry() {
  try {
    const results = await getLastDayResults()

    const normalizeLotteryName = (name: string): string => {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
    }

    // Crear mapa de país para cada lotería
    const lotteryCountryMap = new Map<string, string[]>()
    LOTTERIES.forEach(lottery => {
      // Dividir países combinados (ej: "USA y Colombia" -> ["USA", "Colombia"])
      const countries = lottery.country.split(" y ").map(c => c.trim())
      const key = normalizeLotteryName(lottery.name)
      lotteryCountryMap.set(key, countries)
    })

    // Agrupar resultados por país
    const groupedByCountry = new Map<string, any[]>()
    const countryFlags: Record<string, string> = {
      "Colombia": "🇨🇴",
      "España": "🇪🇸",
      "USA": "🇺🇸",
    }

    results.forEach((result: any) => {
      const key = normalizeLotteryName(result.lottery_name || "")
      const countries = lotteryCountryMap.get(key) || []
      
      // Agregar el resultado a cada país
      countries.forEach(country => {
        if (!groupedByCountry.has(country)) {
          groupedByCountry.set(country, [])
        }
        groupedByCountry.get(country)!.push({ ...result, country })
      })
    })

    // Convertir a array y ordenar por país
    const sortedCountries = Array.from(groupedByCountry.entries())
      .sort(([countryA], [countryB]) => {
        const order = ["Colombia", "España", "USA"]
        return order.indexOf(countryA) - order.indexOf(countryB)
      })
      .map(([country, lotteries]) => ({
        country,
        flag: countryFlags[country] || "🎰",
        lotteries: lotteries.sort((a, b) => (a.lottery_name || "").localeCompare(b.lottery_name || ""))
      }))

    return sortedCountries
  } catch (error) {
    console.error("[v0] Error getting results by country:", error)
    return []
  }
}
