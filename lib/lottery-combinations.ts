import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface LotteryCombination {
  id: number
  lottery_names: string[]
  digit_type: string
  created_at: string
}

/* ======================================================
   GUARDAR COMBINACIÓN DE LOTERÍAS
====================================================== */
export async function saveLotteryCombination(
  userId: number,
  lotteryNames: string[],
  digitType: string
) {
  try {
    const result = await sql`
      SELECT * FROM save_lottery_combination(
        ${userId},
        ${JSON.stringify(lotteryNames)}::TEXT[],
        ${digitType}
      )
    `
    
    if (result.length > 0 && result[0].success) {
      console.log(`[saveLotteryCombination] Guardada para usuario ${userId}`)
      return { success: true, combinationId: result[0].combination_id }
    }
    return { success: false }
  } catch (error) {
    console.error("[saveLotteryCombination] Error:", error)
    return { success: false }
  }
}

/* ======================================================
   OBTENER ÚLTIMAS COMBINACIONES DEL USUARIO
====================================================== */
export async function getUserLastCombinations(userId: number) {
  try {
    const result = await sql`
      SELECT * FROM get_user_last_combinations(${userId})
    `
    
    return result as LotteryCombination[]
  } catch (error) {
    console.error("[getUserLastCombinations] Error:", error)
    return []
  }
}
