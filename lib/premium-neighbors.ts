// lib/premium-neighbors.ts
import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

/**
 * Genera todos los "vecinos" de un número: variantes que difieren en 1 dígito (por posición).
 * Ejemplo: 123 → 223, 133, 113, 124, 122, 121, etc.
 */
export function generateNeighbors(number: string): string[] {
  const neighbors: Set<string> = new Set()
  for (let i = 0; i < number.length; i++) {
    for (let d = 0; d <= 9; d++) {
      if (number[i] !== d.toString()) {
        const variant = number.slice(0, i) + d.toString() + number.slice(i + 1)
        neighbors.add(variant)
      }
    }
  }
  neighbors.delete(number)
  return Array.from(neighbors)
}

/**
 * Busca si los vecinos de un número han salido en los últimos N días en una lotería específica.
 * @param number Número base (string)
 * @param lotteryName Lotería
 * @param digitCount Cantidad de cifras
 * @param days Ventana de días a analizar
 * @returns Lista de vecinos encontrados y fecha de aparición
 */
export async function findNeighborsInHistory(number: string, lotteryName: string, digitCount: number, days: number = 30) {
  const neighbors = generateNeighbors(number)
  // Buscar en tabla de resultados históricos
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const sinceStr = since.toISOString().slice(0, 10)
  const res = await sql`
    SELECT draw_date, result
    FROM lottery_results
    WHERE lottery_name = ${lotteryName}
      AND char_length(result) = ${digitCount}
      AND draw_date >= ${sinceStr}
      AND result = ANY(${neighbors})
    ORDER BY draw_date DESC
  `
  return res as { draw_date: string, result: string }[]
}

/**
 * Análisis premium: para cada número ingresado, muestra vecinos que hayan salido recientemente.
 */
export async function analyzeNeighborsPremium(numbers: string[], lotteryName: string, digitCount: number, days: number = 30) {
  const results = []
  for (const number of numbers) {
    const neighbors = await findNeighborsInHistory(number, lotteryName, digitCount, days)
    results.push({
      number,
      neighbors: neighbors.map(n => ({ number: n.result, date: n.draw_date }))
    })
  }
  return results
}
