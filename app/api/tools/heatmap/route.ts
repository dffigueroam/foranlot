import { NextResponse } from "next/server"
import { generateHeatmapByPosition } from "@/lib/heatmap"

export async function POST(req: Request) {
  try {
    const { country, digitCount } = await req.json()
    const result = await generateHeatmapByPosition(country, digitCount)
    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error al generar mapa de calor" }, { status: 400 })
  }
}
