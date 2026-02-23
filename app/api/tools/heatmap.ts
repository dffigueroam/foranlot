import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { generateHeatmap } from "@/lib/heatmap"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { country, digitCount, lotteryName } = await request.json()
    if (!country || !digitCount || !lotteryName) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }
    // Buscar lotería
    const rows = await sql`SELECT * FROM lotteries WHERE is_active = true AND country = ${country} AND name = ${lotteryName} AND ${digitCount} = ANY(digits)`
    if (!rows[0]) {
      return NextResponse.json({ error: "Lotería no encontrada" }, { status: 404 })
    }
    // Generar heatmap
    const result = await import("@/lib/heatmap").then(m => m.generateHeatmapByPosition(country, digitCount))
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json({ error: "Error al generar mapa de calor" }, { status: 500 })
  }
}
