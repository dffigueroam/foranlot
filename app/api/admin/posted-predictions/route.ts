import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPostedPredictionsByLottery } from "@/lib/admin-predictions"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const drawDate = request.nextUrl.searchParams.get("drawDate") || new Date().toISOString().split("T")[0]
  const country = request.nextUrl.searchParams.get("country") || undefined
  const lotteryType = request.nextUrl.searchParams.get("lotteryType") || undefined
  const username = request.nextUrl.searchParams.get("username") || undefined
  const groups = await getPostedPredictionsByLottery(drawDate, {
    country,
    lotteryType,
    username,
  })

  return NextResponse.json({ success: true, drawDate, groups, filters: { country, lotteryType, username } })
}