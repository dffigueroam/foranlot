import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  email: string
  username: string
  is_premium: boolean
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const rows = await sql`SELECT id, email, username, is_premium FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
    return rows[0] as User || null;
  } catch {
    return null;
  }
}
