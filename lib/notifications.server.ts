import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Add all server-only notification functions here, e.g.:
// export async function getUserNotifications(userId: number) { ... }
