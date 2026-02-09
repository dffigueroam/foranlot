import { type NextRequest, NextResponse } from "next/server"

/**
 * Stripe webhook DESACTIVADO TEMPORALMENTE
 * Motivo: solo versionar código en GitHub sin configurar Stripe
 * Reactivar cuando se vaya a producción
 */

// Evita que Next.js intente evaluar esto en build
export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest) {
  console.log("[stripe-webhook] Endpoint desactivado temporalmente")

  return NextResponse.json(
    {
      received: true,
      message: "Stripe webhook disabled (development mode)",
    },
    { status: 200 }
  )
}
