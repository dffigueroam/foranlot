// lib/results.ts
import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

/**
 * Llama la función update_daily_digit_counts tras insertar un resultado oficial.
 * @param drawDate Fecha del sorteo (YYYY-MM-DD)
 * @param lotteryName Nombre de la lotería
 * @param result Número ganador como string (ej: '1234')
 */
export async function updateDailyDigitCounts(drawDate: string, lotteryName: string, result: string) {
  try {
    await sql`SELECT update_daily_digit_counts(${drawDate}, ${lotteryName}, ${result})`;
    return { success: true }
  } catch (e) {
    console.log("[v0] Error updateDailyDigitCounts", e)
    return { error: "No se pudo actualizar los conteos diarios" }
  }
}

/**
 * Limpia históricos viejos de la tabla daily_digit_counts (mayores a 180 días)
 */
export async function cleanOldDailyDigitCounts() {
  try {
    await sql`DELETE FROM daily_digit_counts WHERE draw_date < (CURRENT_DATE - INTERVAL '180 days')`;
    return { success: true }
  } catch (e) {
    console.log("[v0] Error cleanOldDailyDigitCounts", e)
    return { error: "No se pudo limpiar históricos viejos" }
  }
}
