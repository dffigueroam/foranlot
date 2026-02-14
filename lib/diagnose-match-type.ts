import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function diagnosePredictions(userId: number) {
  try {
    // Ver qué valores tiene match_type
    const matchTypeValues = await sql`
      SELECT DISTINCT match_type, COUNT(*) as count
      FROM predictions
      WHERE user_id = ${userId}
      GROUP BY match_type
    `
    
    console.log("[DIAGNOSIS] match_type values in database:")
    console.log(matchTypeValues)
    
    // Ver ejemplos de predicciones con match_type
    const examples = await sql`
      SELECT id, predicted_number, match_type, match_score, is_verified, actual_number
      FROM predictions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    console.log("[DIAGNOSIS] Examples of predictions:")
    console.log(examples)
    
    return {
      matchTypeValues,
      examples
    }
  } catch (error) {
    console.error("[DIAGNOSIS] Error:", error)
    return { error: String(error) }
  }
}
