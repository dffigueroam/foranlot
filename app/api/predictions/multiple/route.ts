import { NextResponse } from "next/server"
import { submitMultiplePredictionsLib } from "@/lib/predictions"

export async function POST(req: Request) {
  try {
    const { userId, lotteryNames, lotteryType, predictedNumbersStr, drawDate, drawTime, confidenceLevel, notes } = await req.json()
    // userId must be provided by the caller (API route)
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }
    const result = await submitMultiplePredictionsLib(
      userId,
      lotteryNames,
      lotteryType,
      predictedNumbersStr,
      drawDate,
      drawTime,
      confidenceLevel,
      notes
    )
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error al crear múltiples predicciones" }, { status: 500 })
  }
}
