import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country")
  if (!country) return NextResponse.json({ error: "País requerido" }, { status: 400 })
  try {
    const result = await sql`SELECT digits FROM lotteries WHERE is_active = true AND country = ${country}`;
    // Flatten and deduplicate digits
    const digitsSet = new Set<number>()
    for (const row of result) {
      if (Array.isArray(row.digits)) {
        row.digits.forEach((d: number) => digitsSet.add(d))
      }
    }
    const digits = Array.from(digitsSet).sort((a, b) => a - b)
    return NextResponse.json({ success: true, digits })
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener cifras" }, { status: 500 })
  }
}
