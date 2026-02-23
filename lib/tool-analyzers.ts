import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Herramientas de análisis para usuarios
 * Punto 23: Análisis basado en últimos 15 resultados
 */

export interface HotNumbersResult {
  matchedNumbers: Array<{
    number: string
    frequency: number
    lastSeen: string
    positionsMatch: number[]
    matchQuality: "excellent" | "good" | "partial"
  }>
  summary: {
    totalAnalyzed: number
    totalMatches: number
    recommendation: string
  }
}

export interface ColdNumbersResult {
  analysis: Array<{
    userNumber: string
    oldestDigits: Array<{
      position: number
      digit: string
      daysSinceLastSeen: number
      status: "muy_frio" | "frio" | "tibio"
    }>
  }>
  summary: {
    hasVeryOldDigits: boolean
    recommendation: string
  }
}

export interface PatternAnalysisResult {
  patterns: Array<{
    type: string
    description: string
    confidence: "high" | "medium" | "low"
  }>
  recommendation: string
}

/**
 * 1. NÚMEROS CALIENTES
 * Encuentra números que se repiten en últimos 15 días
 * Filtra por país y valida coincidencia de al menos 2 posiciones
 */
export async function analyzeHotNumbers(
  userNumbers: string[],
  lotteryType: string,
  country: string = "COL"
): Promise<HotNumbersResult> {
  try {
    const digitCount = parseInt(lotteryType.split("_")[0])

    // 1. Obtener últimos 15 resultados del país usando columna digits_3 o digits_4
    const digitsCol = digitCount === 3 ? 'digits_3' : digitCount === 4 ? 'digits_4' : null;
    if (!digitsCol) throw new Error('Solo se soportan 3 o 4 dígitos');
    const query = `
      SELECT 
        lr.${digitsCol} AS winning_number,
        lr.draw_date,
        l.country
      FROM lottery_results lr
      JOIN lotteries l ON lr.lottery_name = l.name
      WHERE l.country = $1
        AND lr.${digitsCol} IS NOT NULL
        AND lr.draw_date >= CURRENT_DATE - INTERVAL '15 days'
      ORDER BY lr.draw_date DESC
      LIMIT 15
    `;
    const recentResults = await sql.query(query, [country]);

    if (recentResults.length === 0) {
      return {
        matchedNumbers: [],
        summary: {
          totalAnalyzed: 0,
          totalMatches: 0,
          recommendation: "No hay suficientes datos de los últimos 15 días para este país y tipo de lotería.",
        },
      }
    }

    // 2. Contar frecuencia de cada número
    const frequencyMap = new Map<string, { count: number; lastSeen: string }>()
    
    recentResults.forEach((result: any) => {
      const number = result.winning_number
      const existing = frequencyMap.get(number) || { count: 0, lastSeen: result.draw_date }
      
      frequencyMap.set(number, {
        count: existing.count + 1,
        lastSeen: result.draw_date, // Mantener la más reciente
      })
    })

    // 3. Analizar coincidencias con números del usuario
    const matchedNumbers: Array<{ number: string; frequency: number; lastSeen: string; positionsMatch: number[]; matchQuality: "excellent" | "good" | "partial" }> = []

    for (const userNumber of userNumbers) {
      if (!userNumber || userNumber.length !== digitCount) continue

      // Buscar coincidencias exactas
      if (frequencyMap.has(userNumber)) {
        const data = frequencyMap.get(userNumber)!
        matchedNumbers.push({
          number: userNumber,
          frequency: data.count,
          lastSeen: data.lastSeen,
          positionsMatch: Array.from({ length: digitCount }, (_, i) => i), // Todas las posiciones
          matchQuality: (data.count >= 3 ? "excellent" : data.count === 2 ? "good" : "partial") as ("excellent" | "good" | "partial"),
        })
        continue
      }

      // Buscar coincidencias parciales (al menos 2 posiciones)
      for (const [hotNumber, data] of frequencyMap.entries()) {
        const matchingPositions: number[] = []

        for (let i = 0; i < digitCount; i++) {
          if (userNumber[i] === hotNumber[i]) {
            matchingPositions.push(i)
          }
        }

        if (matchingPositions.length >= 2) {
          matchedNumbers.push({
            number: `${userNumber} (coincide con ${hotNumber})`,
            frequency: data.count,
            lastSeen: data.lastSeen,
            positionsMatch: matchingPositions,
            matchQuality: (matchingPositions.length === digitCount - 1 ? "good" : "partial") as "excellent" | "good" | "partial",
          })
        }
      }
    }

    // 4. Ordenar por calidad y frecuencia
    matchedNumbers.sort((a, b) => {
      const qualityScore: Record<"excellent" | "good" | "partial", number> = { excellent: 3, good: 2, partial: 1 }
      return qualityScore[b.matchQuality] - qualityScore[a.matchQuality] || b.frequency - a.frequency
    })

    // 5. Generar recomendación
    let recommendation = ""
    if (matchedNumbers.length === 0) {
      recommendation = "Ninguno de tus números coincide con los números calientes recientes. Considera revisar los números más frecuentes."
    } else if (matchedNumbers.some(m => m.matchQuality === "excellent")) {
      recommendation = "¡Excelente! Algunos de tus números están muy activos en los últimos sorteos."
    } else {
      recommendation = "Tus números tienen coincidencias parciales con tendencias recientes."
    }

    return {
      matchedNumbers: matchedNumbers.slice(0, 10), // Top 10
      summary: {
        totalAnalyzed: recentResults.length,
        totalMatches: matchedNumbers.length,
        recommendation,
      },
    }
  } catch (error) {
    console.error("[v0] Error in analyzeHotNumbers:", error)
    throw error
  }
}

/**
 * 2. NÚMEROS SIN SALIR
 * Identifica cifras en posiciones específicas que llevan más tiempo sin aparecer
 */
export async function analyzeColdNumbers(
  userNumbers: string[],
  lotteryType: string,
  country: string = "COL"
): Promise<ColdNumbersResult> {
  try {
    const digitCount = parseInt(lotteryType.split("_")[0])

    // 1. Obtener todos los resultados históricos (últimos 60 días para tener datos) usando digits_3 o digits_4
    const digitsCol = digitCount === 3 ? 'digits_3' : digitCount === 4 ? 'digits_4' : null;
    if (!digitsCol) throw new Error('Solo se soportan 3 o 4 dígitos');
    const query = `
      SELECT 
        lr.${digitsCol} AS winning_number,
        lr.draw_date,
        l.country
      FROM lottery_results lr
      JOIN lotteries l ON lr.lottery_name = l.name
      WHERE l.country = $1
        AND lr.${digitsCol} IS NOT NULL
        AND lr.draw_date >= CURRENT_DATE - INTERVAL '60 days'
      ORDER BY lr.draw_date DESC
    `;
    const historicalResults = await sql.query(query, [country]);

    if (historicalResults.length === 0) {
      return {
        analysis: [],
        summary: {
          hasVeryOldDigits: false,
          recommendation: "No hay suficientes datos históricos para este análisis.",
        },
      }
    }

    // 2. Para cada posición, encontrar cuándo fue la última vez que salió cada dígito
    const digitsByPosition: Map<number, Map<string, string>> = new Map()

    for (let pos = 0; pos < digitCount; pos++) {
      digitsByPosition.set(pos, new Map())
    }

    // Recorrer resultados desde el más reciente
    historicalResults.forEach((result: any) => {
      const number = result.winning_number
      const date = result.draw_date

      for (let pos = 0; pos < digitCount; pos++) {
        const digit = number[pos]
        const posMap = digitsByPosition.get(pos)!

        // Solo guardar la primera vez (más reciente) que vimos este dígito
        if (!posMap.has(digit)) {
          posMap.set(digit, date)
        }
      }
    })

    // 3. Analizar números del usuario
    const analysis = []

    for (const userNumber of userNumbers) {
      if (!userNumber || userNumber.length !== digitCount) continue

      const oldestDigits = []

      for (let pos = 0; pos < digitCount; pos++) {
        const digit = userNumber[pos]
        const lastSeenDate = digitsByPosition.get(pos)!.get(digit)

        if (!lastSeenDate) {
          // Este dígito nunca ha salido en esta posición (último n 60 días)
          oldestDigits.push({
            position: pos,
            digit,
            daysSinceLastSeen: 999,
            status: "muy_frio" as const,
          })
        } else {
          const daysSince = Math.floor(
            (new Date().getTime() - new Date(lastSeenDate).getTime()) / (1000 * 60 * 60 * 24)
          )

          let status: "muy_frio" | "frio" | "tibio"
          if (daysSince > 30) status = "muy_frio"
          else if (daysSince > 15) status = "frio"
          else status = "tibio"

          oldestDigits.push({
            position: pos,
            digit,
            daysSinceLastSeen: daysSince,
            status,
          })
        }
      }

      // Solo incluir si hay al menos un dígito frío
      if (oldestDigits.some(d => d.status !== "tibio")) {
        analysis.push({
          userNumber,
          oldestDigits: oldestDigits.filter(d => d.status !== "tibio"),
        })
      }
    }

    // 4. Generar recomendación
    const hasVeryOld = analysis.some(a => a.oldestDigits.some(d => d.status === "muy_frio"))

    let recommendation = ""
    if (analysis.length === 0) {
      recommendation = "Todos tus números tienen cifras que han salido recientemente. ¡Buena elección!"
    } else if (hasVeryOld) {
      recommendation = "Algunos de tus números contienen cifras que llevan mucho tiempo sin salir en esas posiciones. Considera si es estratégico o arriesgado."
    } else {
      recommendation = "Tus números tienen algunas cifras que no han salido recientemente. Pueden ser candidatos."
    }

    return {
      analysis,
      summary: {
        hasVeryOldDigits: hasVeryOld,
        recommendation,
      },
    }
  } catch (error) {
    console.error("[v0] Error in analyzeColdNumbers:", error)
    throw error
  }
}

/**
 * 3. ANÁLISIS DE PATRONES SIMPLES
 * Detecta patrones básicos en números del usuario (secuencias, repeticiones, etc.)
 */
export async function analyzeNumberPatterns(
  userNumbers: string[],
  lotteryType: string
): Promise<PatternAnalysisResult> {
  try {
    const digitCount = parseInt(lotteryType.split("_")[0])
    const patterns = []

    for (const userNumber of userNumbers) {
      if (!userNumber || userNumber.length !== digitCount) continue

      const digits = userNumber.split("").map(Number)

      // Patrón 1: Números consecutivos ascendentes
      let isAscending = true
      for (let i = 1; i < digits.length; i++) {
        if (digits[i] !== digits[i - 1] + 1) {
          isAscending = false
          break
        }
      }
      if (isAscending) {
        patterns.push({
          type: "Secuencia ascendente",
          description: `${userNumber} es una secuencia consecutiva. Históricamente poco probable pero no imposible.`,
          confidence: "low" as const,
        })
      }

      // Patrón 2: Números consecutivos descendentes
      let isDescending = true
      for (let i = 1; i < digits.length; i++) {
        if (digits[i] !== digits[i - 1] - 1) {
          isDescending = false
          break
        }
      }
      if (isDescending) {
        patterns.push({
          type: "Secuencia descendente",
          description: `${userNumber} es una secuencia consecutiva inversa. Históricamente poco probable.`,
          confidence: "low" as const,
        })
      }

      // Patrón 3: Todos los dígitos iguales
      if (digits.every(d => d === digits[0])) {
        patterns.push({
          type: "Número capicúa extremo",
          description: `${userNumber} tiene todos los dígitos iguales. Muy poco probable estadísticamente.`,
          confidence: "low" as const,
        })
      }

      // Patrón 4: Suma de dígitos
      const sum = digits.reduce((a, b) => a + b, 0)
      const avgSum = (digitCount * 9) / 2 // Promedio esperado
      if (sum >= avgSum * 1.3) {
        patterns.push({
          type: "Suma alta",
          description: `${userNumber} tiene una suma de dígitos alta (${sum}). Puede ser poco común.`,
          confidence: "medium" as const,
        })
      } else if (sum <= avgSum * 0.7) {
        patterns.push({
          type: "Suma baja",
          description: `${userNumber} tiene una suma de dígitos baja (${sum}). Puede ser poco común.`,
          confidence: "medium" as const,
        })
      } else {
        patterns.push({
          type: "Suma balanceada",
          description: `${userNumber} tiene una suma de dígitos balanceada (${sum}). Estadísticamente más común.`,
          confidence: "high" as const,
        })
      }

      // Patrón 5: Dígitos únicos vs repetidos
      const uniqueDigits = new Set(digits).size
      if (uniqueDigits === digits.length) {
        patterns.push({
          type: "Todos dígitos únicos",
          description: `${userNumber} no tiene dígitos repetidos. Mayor variabilidad.`,
          confidence: "medium" as const,
        })
      } else if (uniqueDigits === 1) {
        // Ya cubierto arriba
      } else {
        patterns.push({
          type: "Dígitos con repetición",
          description: `${userNumber} tiene algunos dígitos repetidos. Patrón común en loteríast.`,
          confidence: "high" as const,
        })
      }
    }

    // Recomendación general
    const lowConfidenceCount = patterns.filter(p => p.confidence === "low").length
    let recommendation = ""

    if (lowConfidenceCount > 2) {
      recommendation = "Varios de tus números tienen patrones inusuales. Considera diversificar con números más aleatorios."
    } else if (patterns.some(p => p.confidence === "high")) {
      recommendation = "Tus números tienen patrones estadísticamente normales. Buena diversificación."
    } else {
      recommendation = "Análisis de patrones completado. Considera combinar números con diferentes características."
    }

    return {
      patterns,
      recommendation,
    }
  } catch (error) {
    console.error("[v0] Error in analyzeNumberPatterns:", error)
    throw error
  }
}
