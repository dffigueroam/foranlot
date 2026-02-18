import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Obtener avatar del usuario
 */
export async function getUserAvatar(userId: number) {
  try {
    const result = await sql`
      SELECT * FROM user_avatars
      WHERE user_id = ${userId}
    `
    // ...rest of the function logic...
    return result[0] || null;
  } catch {
    return null;
  }
}

// Add other server-only functions here as needed
