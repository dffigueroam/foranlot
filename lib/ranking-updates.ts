import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Obtener la fecha de última actualización del ranking del usuario
 */
export async function getLastRankingUpdateForUser(userId: number) {
  try {
    const result = await sql`
      SELECT MAX(score_date) as last_update
      FROM user_ranking_scores
      WHERE user_id = ${userId}
    `
    
    return result[0]?.last_update || null
  } catch (error) {
    console.error("[v0] Error getting last ranking update:", error)
    return null
  }
}

/**
 * Obtener la fecha de última actualización global del ranking
 */
export async function getGlobalLastRankingUpdate() {
  try {
    const result = await sql`
      SELECT MAX(score_date) as last_update
      FROM user_ranking_scores
    `
    
    return result[0]?.last_update || null
  } catch (error) {
    console.error("[v0] Error getting global ranking update:", error)
    return null
  }
}

/**
 * Formatear fecha en formato amigable
 */
export function formatLastUpdate(dateString: string | null): string {
  if (!dateString) return "Sin actualizar aún"
  
  const date = new Date(dateString)
  const now = new Date()
  
  // Calcular diferencia en milisegundos
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffDays > 0) {
    return `Actualizado hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `Actualizado hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  } else if (diffMinutes > 0) {
    return `Actualizado hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
  } else {
    return "Actualizado hace poco"
  }
}
