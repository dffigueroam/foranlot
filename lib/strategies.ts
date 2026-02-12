import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface UserStrategy {
  id: number
  user_id: number
  strategy_name: string
  lottery_name: string
  digits_type: number
  parameters: any
  created_at: string
  updated_at: string
}

/**
 * Obtiene la estrategia del usuario (máximo 1 por usuario)
 */
export async function getUserStrategy(userId: number): Promise<UserStrategy | null> {
  try {
    const result = await sql`
      SELECT * FROM user_strategies
      WHERE user_id = ${userId}
      LIMIT 1
    `
    return result[0] ?? null
  } catch (error) {
    console.log("[v0] Error getting user strategy:", error)
    return null
  }
}

/**
 * Obtiene los últimos 15 resultados de una lotería
 */
export async function getLast15Results(lotteryName: string): Promise<string[]> {
  try {
    const results = await sql`
      SELECT result
      FROM lottery_results
      WHERE lottery_name = ${lotteryName}
      ORDER BY draw_date DESC
      LIMIT 15
    `
    return results.map(r => String(r.result))
  } catch (error) {
    console.log("[v0] Error getting last 15 results:", error)
    return []
  }
}

/**
 * Crea o actualiza la estrategia del usuario
 */
export async function saveUserStrategy(
  userId: number,
  strategyName: string,
  lotteryName: string,
  digitsType: number,
  parameters: any = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que el tipo de dígitos sea válido
    if (![3, 4, 5].includes(digitsType)) {
      return { success: false, error: "Tipo de dígitos inválido" }
    }

    console.log("[v0] Saving strategy:", { userId, strategyName, lotteryName, digitsType, parameters })

    // Usar UPSERT para crear o actualizar
    await sql`
      INSERT INTO user_strategies (user_id, strategy_name, lottery_name, digits_type, parameters, updated_at)
      VALUES (${userId}, ${strategyName}, ${lotteryName}, ${digitsType}, ${JSON.stringify(parameters)}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        strategy_name = EXCLUDED.strategy_name,
        lottery_name = EXCLUDED.lottery_name,
        digits_type = EXCLUDED.digits_type,
        parameters = EXCLUDED.parameters,
        updated_at = NOW()
    `

    console.log("[v0] Strategy saved successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error saving user strategy:", error)
    console.error("[v0] Error details:", JSON.stringify(error, null, 2))
    return { success: false, error: "Error al guardar la estrategia" }
  }
}

/**
 * Elimina la estrategia del usuario
 */
export async function deleteUserStrategy(userId: number): Promise<{ success: boolean }> {
  try {
    await sql`
      DELETE FROM user_strategies
      WHERE user_id = ${userId}
    `
    return { success: true }
  } catch (error) {
    console.log("[v0] Error deleting user strategy:", error)
    return { success: false }
  }
}
