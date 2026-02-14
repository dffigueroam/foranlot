import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function debugFilterData() {
  try {
    // Obtener TODAS las predicciones con todos los detalles
    const allPredictions = await sql`
      SELECT 
        p.id,
        p.user_id,
        p.lottery_name,
        p.is_verified,
        p.is_correct,
        p.match_score,
        p.predicted_number,
        p.draw_date,
        p.created_at
      FROM predictions
      LIMIT 20
    `

    // Contar por estado
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as is_correct_true,
        COUNT(CASE WHEN is_correct = false THEN 1 END) as is_correct_false,
        COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as is_correct_null,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as is_verified_true,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as is_verified_false,
        COUNT(CASE WHEN match_score > 0 THEN 1 END) as has_match_score
      FROM predictions
    `

    console.log("[DEBUG DATA]")
    console.log("Total predictions:", allPredictions.length)
    console.log("Stats:", stats[0])
    console.log("\nFirst 5 predictions:")
    allPredictions.slice(0, 5).forEach(p => {
      console.log(`  ID: ${p.id}, is_correct: ${p.is_correct} (type: ${typeof p.is_correct}), is_verified: ${p.is_verified}, lottery: ${p.lottery_name}`)
    })

    return {
      predictions: allPredictions,
      stats: stats[0]
    }
  } catch (error) {
    console.error("[DEBUG ERROR]", error)
    return { error: String(error) }
  }
}
