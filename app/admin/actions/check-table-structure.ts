"use server"

import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function checkLotteryResultsTable() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { error: "No autorizado" }
    }

    // Obtener estructura de la tabla
    const columns = await sql`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'lottery_results'
      ORDER BY ordinal_position
    `

    // Obtener algunos datos de ejemplo
    const sampleData = await sql`
      SELECT * FROM lottery_results
      ORDER BY draw_date DESC
      LIMIT 5
    `

    // Serializar fechas a strings para evitar errores de hidratación
    const serializedData = sampleData.map(row => {
      const serialized: any = {}
      for (const [key, value] of Object.entries(row)) {
        if (value instanceof Date) {
          serialized[key] = value.toISOString()
        } else {
          serialized[key] = value
        }
      }
      return serialized
    })

    return {
      success: true,
      columns,
      sampleData: serializedData,
      totalRows: serializedData.length
    }
  } catch (error: any) {
    console.error("[v0] Error checking table:", error)
    return { error: error.message }
  }
}
