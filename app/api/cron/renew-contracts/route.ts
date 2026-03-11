import { NextResponse } from "next/server"
import { processAutomaticRenewals, notifyExpiringContracts } from "@/lib/contracts"

/**
 * Cron job para procesar renovaciones automáticas de contratos
 * 
 * HORARIO: 0-9 AM diario
 * Schedule: 0 3 * * * (3 AM)
 * 
 * FUNCIONES:
 * 1. Renovar contratos que vencen hoy (si tienen créditos)
 * 2. Enviar notificaciones de vencimiento
 */
export async function GET(request: Request) {
  // Verificar token de autenticación
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Running automatic contract renewals cron job")

  try {
    // 1. Procesar renovaciones automáticas
    const renewalResult = await processAutomaticRenewals()

    // 2. Enviar notificaciones de contratos por vencer
    const notificationResult = await notifyExpiringContracts()

    console.log("[v0] Contract renewals completed:", renewalResult)
    console.log("[v0] Notifications sent:", notificationResult.notificationsSent)

    return NextResponse.json({
      success: true,
      message: "Contract renewals processed",
      data: {
        renewed: renewalResult.renewed,
        failed: renewalResult.failed,
        notificationsSent: notificationResult.notificationsSent,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in contract renewals cron:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
