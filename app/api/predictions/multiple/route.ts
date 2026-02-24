import { NextResponse } from "next/server"
import { submitMultiplePredictions } from "../../../actions/predictions"

export async function POST(req: Request) {
  try {
    const { lotteryNames, lotteryType, predictedNumbersStr, drawDate, drawTime, confidenceLevel, notes } = await req.json()
    const result = await submitMultiplePredictions(
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
