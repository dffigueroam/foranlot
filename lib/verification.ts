import "server-only"
import { neon } from "@neondatabase/serverless"
import { updateRankings } from "./ranking"
import { LOTTERIES } from "./lotteries"
import { 
  notifyOfficialResults, 
  notifyPredictionHit,
  notifyPaymentReceived 
} from "./notifications"

const sql = neon(process.env.DATABASE_URL!)

/* ======================================================
   FUNCIÓN AUXILIAR: DETECTAR COMBINACIONES
====================================================== */

/**
 * Verifica si dos números son combinaciones/permutaciones entre sí
 * @param predicted - Número predicho
 * @param actual - Número resultado oficial
 * @returns { isMatch: boolean, matchType: string, score: number }
 */
function checkCombination(predicted: string, actual: string): { 
  isMatch: boolean
  matchType: 'exact' | 'combination' | 'no_match'
  score: number 
} {
  // Normalizar: remover espacios y convertir a string
  const pred = predicted.trim()
  const act = actual.trim()
  
  // Coincidencia exacta
  if (pred === act) {
    // Score = 0 para exactos (se marca is_correct = true)
    return { isMatch: true, matchType: 'exact', score: 0 }
  }
  
  // Verificar que tengan la misma longitud para ser combinación válida
  if (pred.length !== act.length) {
    return { isMatch: false, matchType: 'no_match', score: 0 }
  }
  
  // Ordenar dígitos y comparar (combinación/permutación)
  const predSorted = pred.split('').sort().join('')
  const actSorted = act.split('').sort().join('')
  
  if (predSorted === actSorted) {
    // Es una combinación válida
    const digitCount = pred.length
    
    if (digitCount === 4) {
      return { isMatch: true, matchType: 'combination', score: 4 }
    } else if (digitCount === 3) {
      return { isMatch: true, matchType: 'combination', score: 2 }
    }
  }
  
  return { isMatch: false, matchType: 'no_match', score: 0 }
}

// Verificar pronósticos para una fecha específica
export async function verifyPredictionsForDate(date: string) {
  try {
    console.log("[v0] Starting verification for date:", date)

    // Obtener resultados oficiales desde la base de datos
    const lotteryResults = await getLotteryResults(date)

    if (!lotteryResults || lotteryResults.length === 0) {
      return { error: "No hay resultados cargados para esa fecha" }
    }

    console.log("[v0] Loaded lottery results from DB:", lotteryResults.length)

    // Verificar cada pronóstico
    let verifiedCount = 0
    let correctCount = 0
    let combinationCount = 0

    for (const result of lotteryResults) {
      // Usar digits_4 y digits_3 para la comparacion segun lottery_type
      const digitsOnly = (result.winning_number || "").replace(/\D/g, "").padStart(4, "0")
      const digits_4 = (result.digits_4 || "").toString().padStart(4, "0").slice(0, 4) || digitsOnly.slice(0, 4)
      const digits_3 = (result.digits_3 || "").toString().padStart(3, "0").slice(0, 3) || digitsOnly.slice(0, 3)
      
      // Obtener pronósticos pendientes para esta lotería y fecha
      const pendingPredictions = await sql`
        SELECT id, lottery_type, predicted_number
        FROM predictions
        WHERE DATE(draw_date) = DATE(${result.draw_date})
          AND LOWER(TRIM(lottery_name)) = LOWER(TRIM(${result.lottery_name}))
          AND is_verified = false
      `

      // Verificar cada pronóstico individualmente con sistema de combinaciones
      for (const pred of pendingPredictions) {
        const actualNumber = pred.lottery_type === '3_digits' ? digits_3 : digits_4
        const predictedNumbers = pred.predicted_number.split(' ')
        
        let bestMatch = { isMatch: false, matchType: 'no_match' as const, score: 0 }
        
        // Verificar cada número predicho (puede haber varios separados por espacio)
        for (const predictedNum of predictedNumbers) {
          const match = checkCombination(predictedNum, actualNumber)
          
          // Guardar la mejor coincidencia
          if (match.isMatch && (match.matchType === 'exact' || match.score > bestMatch.score)) {
            bestMatch = match
            if (match.matchType === 'exact') break // Exacto es lo mejor posible
          }
        }
        
        // Actualizar el pronóstico con el resultado
        await sql`
          UPDATE predictions
          SET 
            is_verified = true,
            is_correct = ${bestMatch.matchType === 'exact'},
            match_type = ${bestMatch.matchType},
            match_score = ${bestMatch.score},
            actual_number = ${actualNumber},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${pred.id}
        `
        
        verifiedCount++
        if (bestMatch.matchType === 'exact') correctCount++
        if (bestMatch.matchType === 'combination') combinationCount++
      }
    }

    console.log("[v0] Verified predictions:", verifiedCount, "Exact:", correctCount, "Combinations:", combinationCount)

    // Actualizar rankings
    await updateRankings()

    return {
      success: true,
      verified: verifiedCount,
      correct: correctCount,
      combinations: combinationCount,
      resultsProcessed: lotteryResults.length,
    }
  } catch (error) {
    console.error("[v0] Error verifying predictions:", error)
    return { error: "Error al verificar pronósticos" }
  }
}

// Verificar pronosticos usando resultados ya cargados en la base de datos
export async function verifyPredictionsFromStoredResults(date: string) {
  try {
    console.log("[v0] Starting verification from stored results for date:", date)

    const lotteryResults = await getLotteryResults(date)

    if (!lotteryResults || lotteryResults.length === 0) {
      return { error: "No hay resultados cargados para esa fecha" }
    }

    let verifiedCount = 0
    let correctCount = 0
    let combinationCount = 0

    for (const result of lotteryResults) {
      if (!result.winning_number) continue

      const digitsOnly = (result.winning_number || "").replace(/\D/g, "").padStart(4, "0")
      const digits_4 = (result.digits_4 || "").toString().padStart(4, "0").slice(0, 4) || digitsOnly.slice(0, 4)
      const digits_3 = (result.digits_3 || "").toString().padStart(3, "0").slice(0, 3) || digitsOnly.slice(0, 3)

      // Obtener pronósticos pendientes
      const pendingPredictions = await sql`
        SELECT id, lottery_type, predicted_number
        FROM predictions
        WHERE DATE(draw_date) = DATE(${result.draw_date})
          AND LOWER(TRIM(lottery_name)) = LOWER(TRIM(${result.lottery_name}))
          AND is_verified = false
      `

      // Verificar cada pronóstico con sistema de combinaciones
      for (const pred of pendingPredictions) {
        const actualNumber = pred.lottery_type === '3_digits' ? digits_3 : digits_4
        const predictedNumbers = pred.predicted_number.split(' ')
        
        let bestMatch = { isMatch: false, matchType: 'no_match' as const, score: 0 }
        
        for (const predictedNum of predictedNumbers) {
          const match = checkCombination(predictedNum, actualNumber)
          
          if (match.isMatch && (match.matchType === 'exact' || match.score > bestMatch.score)) {
            bestMatch = match
            if (match.matchType === 'exact') break
          }
        }
        
        await sql`
          UPDATE predictions
          SET 
            is_verified = true,
            is_correct = ${bestMatch.matchType === 'exact'},
            match_type = ${bestMatch.matchType},
            match_score = ${bestMatch.score},
            actual_number = ${actualNumber},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${pred.id}
        `
        
        verifiedCount++
        if (bestMatch.matchType === 'exact') correctCount++
        if (bestMatch.matchType === 'combination') combinationCount++
      }
    }

    await updateRankings()

    return {
      success: true,
      verified: verifiedCount,
      correct: correctCount,
      combinations: combinationCount,
      resultsProcessed: lotteryResults.length,
    }
  } catch (error) {
    console.error("[v0] Error verifying from stored results:", error)
    return { error: "Error al verificar pronosticos" }
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
    let notificationsCount = 0

    for (const row of pendingDates) {
      const date = (row as any).date
      
      // Obtener resultados oficiales para esta fecha
      const lotteryResults = await getLotteryResults(date)

      if (!lotteryResults || lotteryResults.length === 0) continue

      // Notificar a TODOS los usuarios sobre los resultados
      for (const result of lotteryResults) {
        const winningNumber = result.winning_number || result.digits_4 || result.digits_3 || ""
        await notifyOfficialResults(
          result.lottery_name,
          date,
          winningNumber
        )
      }

      // Procesar predicciones y enviar notificaciones de aciertos
      for (const result of lotteryResults) {
        const digitsOnly = (result.winning_number || "").replace(/\D/g, "").padStart(4, "0")
        const digits_4 = (result.digits_4 || "").toString().padStart(4, "0").slice(0, 4) || digitsOnly.slice(0, 4)
        const digits_3 = (result.digits_3 || "").toString().padStart(3, "0").slice(0, 3) || digitsOnly.slice(0, 3)
        
        // Obtener pronósticos pendientes
        const pendingPredictions = await sql`
          SELECT p.id, p.user_id, p.lottery_type, p.predicted_number, p.lottery_name
          FROM predictions p
          WHERE DATE(p.draw_date) = DATE(${result.draw_date})
            AND LOWER(TRIM(p.lottery_name)) = LOWER(TRIM(${result.lottery_name}))
            AND p.is_verified = false
        `

        // Verificar y notificar cada predicción
        for (const pred of pendingPredictions) {
          const actualNumber = pred.lottery_type === '3_digits' ? digits_3 : digits_4
          const predictedNumbers = pred.predicted_number.split(' ')
          
          let bestMatch = { isMatch: false, matchType: 'no_match' as const, score: 0 }
          let matchedNumber = ""
          
          for (const predictedNum of predictedNumbers) {
            const match = checkCombination(predictedNum, actualNumber)
            
            if (match.isMatch && (match.matchType === 'exact' || match.score > bestMatch.score)) {
              bestMatch = match
              matchedNumber = predictedNum
              if (match.matchType === 'exact') break
            }
          }
          
          // Actualizar predicción
          await sql`
            UPDATE predictions
            SET 
              is_verified = true,
              is_correct = ${bestMatch.matchType === 'exact'},
              match_type = ${bestMatch.matchType},
              match_score = ${bestMatch.score},
              actual_number = ${actualNumber},
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${pred.id}
          `
          
          totalVerified++
          
          // SI HAY ACIERTO, NOTIFICAR AL USUARIO
          if (bestMatch.isMatch) {
            if (bestMatch.matchType === 'exact') totalCorrect++
            
            // Calcular ganancias (20% de las ganancias)
            // Suponemos una paga base de $10,000 COP y 20% van al predictor
            const basePayout = 1000000 // $10,000 COP en centavos
            const predictorEarnings = Math.floor(basePayout * 0.2)
            
            await notifyPredictionHit(
              pred.user_id,
              result.lottery_name,
              matchedNumber,
              actualNumber,
              bestMatch.matchType as "exact" | "combination",
              predictorEarnings
            )
            
            // Registrar las ganancias en la cuenta del usuario
            await sql`
              UPDATE users
              SET total_earnings = COALESCE(total_earnings, 0) + ${predictorEarnings}
              WHERE id = ${pred.user_id}
            `
            
            // Notificar sobre el pago recibido
            await notifyPaymentReceived(
              pred.user_id,
              predictorEarnings,
              `acierto en ${result.lottery_name}`
            )
            
            notificationsCount++
          }
        }
      }
    }

    // Actualizar rankings después de verificar
    await updateRankings()

    return {
      success: true,
      totalVerified,
      totalCorrect,
      notificationsSent: notificationsCount,
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
