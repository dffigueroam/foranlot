import { NextResponse } from "next/server"
import { getCurrentUser } from "../../../lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  const { city, municipality, profession, estrato } = await request.json()
  try {
    await sql`
      UPDATE users SET
        city = ${city || null},
        municipality = ${municipality || null},
        profession = ${profession || null},
        estrato = ${estrato || null}
      WHERE id = ${user.id}
    `
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}
