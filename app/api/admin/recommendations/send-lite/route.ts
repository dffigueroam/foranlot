import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { GET as runRecommendationsCron } from "@/app/api/cron/recommendations/route"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 })
    }

    const request = new Request("http://localhost/api/cron/recommendations", {
      method: "GET",
      headers: {
        authorization: `Bearer ${cronSecret}`,
      },
    })

    const response = await runRecommendationsCron(request)
    const payload = await response.json()

    return NextResponse.json(payload, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Error sending lite recommendations manually:", error)
    return NextResponse.json(
      { error: error?.message || "Error al ejecutar envío manual" },
      { status: 500 },
    )
  }
}
