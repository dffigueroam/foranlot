// Script para verificar si hay pronósticos verificados
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function checkVerifiedPredictions() {
  try {
    const verified = await sql`
      SELECT 
        id, 
        user_id, 
        lottery_name,
        predicted_number, 
        draw_date, 
        is_verified,
        is_correct,
        match_type,
        match_score
      FROM predictions 
      WHERE is_verified = true
      ORDER BY draw_date DESC
      LIMIT 10
    `
    
    console.log("Total pronósticos verificados:", verified.length)
    console.log("\nDetalles:")
    verified.forEach(p => {
      console.log(`- ID: ${p.id}, Fecha: ${p.draw_date}, Número: ${p.predicted_number}, Lotería: ${p.lottery_name}`)
    })
    
    if (verified.length === 0) {
      console.log("\n⚠️ No hay pronósticos verificados. La sección 'Última Fecha Posteada' no se mostrará.")
    }
    
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

checkVerifiedPredictions()
