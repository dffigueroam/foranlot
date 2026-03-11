import { NextResponse } from "next/server"
import { verifyPendingPredictions } from "@/lib/verification"

// Esta ruta puede ser llamada por un cron job de Vercel
// Para configurar: Vercel Dashboard > Project > Settings > Cron Jobs
// Agregar: 0 22 * * * (todos los días a las 10 PM)

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Running automated verification cron job")

  try {
    const result = await verifyPendingPredictions()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("[v0] Cron job completed successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Verification completed",
      ...result,
    })
  } catch (error: any) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
