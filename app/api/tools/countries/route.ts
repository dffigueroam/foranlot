import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  try {
    const result = await sql`SELECT DISTINCT country FROM lotteries WHERE is_active = true ORDER BY country`;
    const countries = result.map((row: any) => row.country)
    return NextResponse.json({ success: true, countries })
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener países" }, { status: 500 })
  }
}
