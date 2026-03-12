import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { submitMultiplePredictionsLib } from "@/lib/predictions"
import { refreshPlatformRecommendationsAfterPublish } from "@/lib/premium-recommendations"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const { lotteryNames, lotteryType, predictedNumbersStr, drawDate, drawTime, confidenceLevel, notes } = await req.json()

    const result = await submitMultiplePredictionsLib(
      user.id,
      lotteryNames,
      lotteryType,
      predictedNumbersStr,
      drawDate,
      drawTime,
      confidenceLevel,
      notes
    )
    
    if (result.success) {
      revalidatePath("/dashboard")

      // Recalcular recomendaciones de plataforma para países/loterías impactadas.
      await refreshPlatformRecommendationsAfterPublish(lotteryNames)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Error al crear múltiples predicciones" }, { status: 500 })
  }
}
