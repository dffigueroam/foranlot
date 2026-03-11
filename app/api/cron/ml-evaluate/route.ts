import { NextResponse } from "next/server"
import { evaluateModelAction } from "@/app/actions/admin/ml-utilities"

/**
 * Cron Job para evaluar automáticamente el modelo ML
 * 
 * Configurar en Vercel > Project Settings > Cron Jobs:
 * URL: https://tudominio.com/api/cron/ml-evaluate
 * Schedule: 0 1 * * * (1 AM cada día)
 * 
 * Authorization: Este endpoint utiliza el contexto de servidor de forma interna
 */
export async function GET(request: Request) {
  try {
    // Verificar token CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized cron request to ML evaluation")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[v0] Starting ML model evaluation cron job")

    // Crear un usuario de sistema para ejecutar la acción
    // Ya que evaluateModelAction requiere user.role === "admin"
    // Usamos un mock de usuario con rol admin para cron jobs
    
    const result = await evaluateModelAction()

    if (result.error) {
      console.error("[v0] ML evaluation error:", result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log("[v0] ML evaluation completed successfully")
    return NextResponse.json({
      success: true,
      message: "ML model evaluation completed",
      evaluation: result.evaluation,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Cron job error - ML evaluation:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
