import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function checkPredictionsTableStructure() {
  try {
    // Obtener información sobre las columnas
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'predictions'
      ORDER BY ordinal_position
    `
    
    console.log("[DEBUG] Predictions table structure:")
    console.log(columns)
    
    return columns
  } catch (error) {
    console.error("[DEBUG] Error checking table structure:", error)
    return []
  }
}

// Ejecutar migración de lottery_name
export async function addLotteryNameColumn() {
  try {
    // Agregar columna lottery_name
    const result1 = await sql`
      ALTER TABLE predictions
      ADD COLUMN IF NOT EXISTS lottery_name VARCHAR(100) DEFAULT 'sin_definir'
    `
    console.log("[MIGRATION] Added lottery_name column")
    
    // Agregar índice
    await sql`
      CREATE INDEX IF NOT EXISTS idx_predictions_lottery_name ON predictions(lottery_name)
    `
    console.log("[MIGRATION] Created lottery_name index")
    
    // Agregar columna visibility
    const result2 = await sql`
      ALTER TABLE predictions
      ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private'
    `
    console.log("[MIGRATION] Added visibility column")
    
    return { success: true }
  } catch (error) {
    console.error("[MIGRATION] Error:", error)
    return { error: String(error) }
  }
}
