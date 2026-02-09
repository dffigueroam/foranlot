import { checkExpiredSelections } from "@/lib/credits"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  // Verificar que viene del cron job de Vercel
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await checkExpiredSelections()
    return NextResponse.json({ success: true, message: "Expired selections checked" })
  } catch (error: any) {
    console.error("Error checking selections:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
