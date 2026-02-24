import { NextResponse } from "next/server"
import { getAvailableLotteriesForDate } from "../../../actions/lotteries"

export async function POST(req: Request) {
  try {
    const { drawDate, country } = await req.json()
    if (!drawDate || !country) {
      return NextResponse.json({ success: false, error: "Fecha y país requeridos" }, { status: 400 })
    }
    const result = await getAvailableLotteriesForDate(drawDate, country)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error al consultar loterías" }, { status: 500 })
  }
}
