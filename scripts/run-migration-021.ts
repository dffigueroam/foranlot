// Script temporal para ejecutar migración SQL
import { neon } from "@neondatabase/serverless"
import * as fs from "fs"
import * as path from "path"

const sql = neon(process.env.DATABASE_URL!)

async function runMigration() {
  try {
    console.log("Ejecutando migración: 021_add_match_score_system.sql...")
    
    const sqlFile = fs.readFileSync(
      path.join(process.cwd(), "scripts", "021_add_match_score_system.sql"),
      "utf-8"
    )
    
    // Dividir por statements y ejecutar uno por uno
    const statements = sqlFile
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--") && !s.startsWith("COMMENT"))
    
    for (const statement of statements) {
      if (statement.includes("COMMENT ON")) continue
      console.log("Ejecutando:", statement.substring(0, 50) + "...")
      await sql([statement] as any)
    }
    
    console.log("✅ Migración completada exitosamente")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error en migración:", error)
    process.exit(1)
  }
}

runMigration()
