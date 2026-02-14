import { NextResponse } from "next/server"
import { validateAndFixDuplicateAvatars } from "@/lib/avatars"

/**
 * Cron job para validar y corregir avatares duplicados en el ranking
 * 
 * Schedule: Configurar en Vercel > Project Settings > Cron Jobs
 * Intervalo sugerido: Cada día a las 2 AM (0 2 * * *)
 * 
 * Authorization: Verificar CRON_SECRET en header
 */
export async function GET(request: Request) {
  try {
    // Verificar token CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedToken) {
      console.log("[v0] Unauthorized cron request")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[v0] Starting avatar duplicate validation cron job")

    const result = await validateAndFixDuplicateAvatars()

    if (result.success) {
      console.log(
        `[v0] Avatar validation completed: ${result.duplicatesFixed} avatares corregidos`
      )

      return NextResponse.json({
        success: true,
        message: `Se corrigieron ${result.duplicatesFixed} avatares duplicados`,
        changedUsers: result.changedUsers,
      })
    } else {
      console.error("[v0] Avatar validation failed:", result.error)

      return NextResponse.json(
        { error: result.error || "Avatar validation failed" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[v0] Cron job error - avatar validation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
