import { NextRequest, NextResponse } from "next/server"
import { generateQuedadosByPosition } from "@/lib/quedados"
import { getLastDraws } from "@/lib/last-draws"

export async function GET(req: NextRequest) {
  let country = req.nextUrl.searchParams.get("country")
  const lotteryName = req.nextUrl.searchParams.get("lotteryName")
  const digitCount = req.nextUrl.searchParams.get("digitCount")
  if (!country || !lotteryName || !digitCount) {
    console.warn("[quedados][API][GET] Faltan parámetros", { country, lotteryName, digitCount });
    return NextResponse.json({ error: "Faltan parámetros", errorType: "param_error", details: { country, lotteryName, digitCount } }, { status: 400 })
  }
  // Map full country names to code
  const countryCodeMap: Record<string, string> = {
    "Colombia": "COL",
    "España": "ESP",
    "USA": "USA",
    "Estados Unidos": "USA"
  }
  country = countryCodeMap[country] || country
  try {
    const draws = await getLastDraws(country, lotteryName, Number(digitCount))
    if (!draws.length) {
      console.warn("[quedados][API][GET] No draws found", { country, lotteryName, digitCount });
      return NextResponse.json({ error: "No se encontraron sorteos para los parámetros dados", errorType: "no_results", details: { country, lotteryName, digitCount } }, { status: 404 })
    }
    return NextResponse.json({ success: true, draws })
  } catch (e) {
    console.log("[quedados-last-draws] error:", e)
    return NextResponse.json({ error: "Error al obtener sorteos", errorType: "db_error", details: typeof e === "object" && e && "message" in e ? (e as any).message : String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { country, lotteryName, digitCount } = await req.json()
    if (!country || !lotteryName || !digitCount) {
      console.warn("[quedados][API][POST] Faltan parámetros", { country, lotteryName, digitCount });
      return NextResponse.json({ error: "Faltan parámetros", errorType: "param_error", details: { country, lotteryName, digitCount } }, { status: 400 })
    }
    const result = await generateQuedadosByPosition(country, lotteryName, digitCount)
    if (!result || !result.quedados || !result.quedados.length) {
      console.warn("[quedados][API][POST] No quedados found", { country, lotteryName, digitCount });
      return NextResponse.json({ error: "No se encontraron quedados para los parámetros dados", errorType: "no_results", details: { country, lotteryName, digitCount } }, { status: 404 })
    }
    return NextResponse.json({ success: true, result })
  } catch (e) {
    console.log("[quedados] error:", e)
    return NextResponse.json({ error: "Error en el análisis de quedados", errorType: "server_error", details: typeof e === "object" && e && "message" in e ? (e as any).message : String(e) }, { status: 500 })
  }
}
