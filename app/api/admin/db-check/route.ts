import { NextRequest, NextResponse } from "next/server"
import { checkPredictionsTableStructure, addLotteryNameColumn } from "@/lib/db-migrations"

export async function GET(request: NextRequest) {
  // Verificar si tiene el token correcto
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const action = request.nextUrl.searchParams.get("action")

    if (action === "check") {
      const structure = await checkPredictionsTableStructure()
      return NextResponse.json({
        message: "Database structure checked",
        columns: structure
      })
    }

    if (action === "migrate") {
      const result = await addLotteryNameColumn()
      return NextResponse.json({
        message: "Migration executed",
        result
      })
    }

    return NextResponse.json({
      message: "Admin API endpoint",
      availableActions: ["check", "migrate"]
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
