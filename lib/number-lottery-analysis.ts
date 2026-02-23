import "server-only"
import { neon } from "@neondatabase/serverless"
import { getLotteriesFromDB } from "./lotteries"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Analiza para cada número ingresado en qué loterías del país tiene mayor probabilidad de salir
 * Basado en frecuencia y atraso en los últimos 60 sorteos por lotería
 */
export async function analyzeNumberByLoteries(userNumbers: string[], country: string, digitCount: number) {
  // Filtrar loterías del país y dígitos desde la base de datos
  const lotteries = (await getLotteriesFromDB()).filter(l => l.country === country && l.digits.includes(digitCount))
  const results: Record<string, any> = {}

  for (const number of userNumbers) {
    results[number] = []
    for (const lottery of lotteries) {
      // Buscar frecuencia y atraso en los últimos 60 sorteos
      const rows = await sql`
        SELECT
          COUNT(*) FILTER (WHERE winning_number = ${number}) AS freq,
          MAX(CASE WHEN winning_number = ${number} THEN draw_date ELSE NULL END) AS last_seen,
          COUNT(*) AS total
        FROM lottery_results
        WHERE lottery_name = ${lottery.name}
          AND lottery_type = ${digitCount}_digits
          AND country = ${country}
        LIMIT 60
      `
      const freq = Number(rows[0]?.freq || 0)
      const lastSeen = rows[0]?.last_seen
      // Calcular atraso (días desde última aparición)
      let atraso = null
      if (lastSeen) {
        const lastDate = new Date(lastSeen)
        const now = new Date()
        atraso = Math.floor((now.getTime() - lastDate.getTime()) / (1000*60*60*24))
      }
      // Criterio: frecuencia alta o atraso alto
      if (freq >= 2 || atraso >= 30) {
        results[number].push({
          lottery: lottery.name,
          freq,
          atraso,
          message: freq >= 2 ? "Frecuente en últimos sorteos" : "Atrasado, podría salir pronto"
        })
      }
    }
  }
  return results
}
