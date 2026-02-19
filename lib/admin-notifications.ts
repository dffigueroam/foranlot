import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export async function getNotificationSentCount() {
  // Contar notificaciones enviadas
  const result = await sql`SELECT COUNT(*)::int as count FROM notifications`
  return result[0]?.count || 0
}
